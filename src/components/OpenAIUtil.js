import { getMasterLog } from './LoggingUtil';
import { OPENAI_API_KEY } from '../config';

const OPENAI_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// Store conversation histories
let commentaryHistory = [];
let conversationHistory = [];
// Maximum number of previous responses to keep for context
const MAX_HISTORY = 25;

// Screen coordinate mappings for different game elements
const SCREEN_COORDINATES = {
    'left_door': '100,300',     // Left door position
    'right_door': '800,300',    // Right door position
    'stage': '450,200',         // Show stage center
    'pirate_cove': '200,200',   // Pirate Cove location
    'west_hall': '150,400',     // West Hall
    'east_hall': '750,400',     // East Hall
    'backstage': '300,200',     // Backstage area
    'kitchen': '600,200',       // Kitchen area
    'supply_closet': '200,300', // Supply Closet
    'restrooms': '700,200',     // Restrooms
    'office_center': '450,300'  // Office center view
};

const sendLogsToOpenAI = async () => {
    // Create context from previous responses
    const previousResponses = conversationHistory.map(response => 
        `Previous reaction: ${response.message} (Action: ${response.action}, Expression: ${response.expression} at ${response.position})`
    ).join('\n');

    const prompt = `You are an AI-powered game companion watching me play the game "Five nights at Freddy's". As a player, you are very reactive, super scared, and you are not very good at the game.

Here are your previous reactions (use this context to avoid repeating yourself and maintain continuity):
${previousResponses}

Provide your reaction in this exact JSON format (no additional text, just the JSON object):
{
    "message": "Your reaction as a string. Examples: 'Oh no, oh no, they're all moving already!', 'Why do they have to move so fast? I hate this!', 'Oh gosh, what if something jumps out? I can't handle this!', 'Bonnie's coming! CLOSE THE DOOR!'",
    "action": "One of these specific animations: idle, pushUp, dance, greet, angry, grenade, walking",
    "expression": "One of these emotions: happy, angry, sad, relaxed, surprised, neutral, scared, teasing, laughing, frustrated",
    "position": "x,y coordinates based on where the scary thing is happening"
}

Use these coordinate mappings for different locations:
- Left Door: ${SCREEN_COORDINATES.left_door}
- Right Door: ${SCREEN_COORDINATES.right_door}
- Show Stage: ${SCREEN_COORDINATES.stage}
- Pirate Cove: ${SCREEN_COORDINATES.pirate_cove}
- West Hall: ${SCREEN_COORDINATES.west_hall}
- East Hall: ${SCREEN_COORDINATES.east_hall}
- Backstage: ${SCREEN_COORDINATES.backstage}
- Kitchen: ${SCREEN_COORDINATES.kitchen}
- Supply Closet: ${SCREEN_COORDINATES.supply_closet}
- Restrooms: ${SCREEN_COORDINATES.restrooms}
- Office Center: ${SCREEN_COORDINATES.office_center}

IMPORTANT:
1. For the action, ONLY use one of these exact values: idle, pushUp, dance, greet, angry, grenade, walking
2. For the expression, ONLY use one of these exact values: happy, angry, sad, relaxed, surprised, neutral, scared, teasing, laughing, frustrated
3. For the position, use the exact coordinates provided above based on where the action is happening
4. Respond with ONLY the JSON object, no additional text or explanation
5. For the message, be creative. Use the examples as inspiration, but talk as though you were a Youtuber watching your best friend play.
6. Keep the message length very short - ideally 1 sentence max. You only respond in a casual, friendly, conversational manner, with short quick responses. You're best friends with the user and you've known each other a long time.

Here are the current game logs (your reaction should be based on the most recent logs):

${getMasterLog()}`;

    try {
        const response = await fetch(OPENAI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + OPENAI_API_KEY
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    {
                        role: "system",
                        content: "You are a JSON-only response bot. You only respond with valid JSON objects, no additional text."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.9
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            try {
                // Ensure the response is valid JSON
                const jsonResponse = JSON.parse(data.choices[0].message.content);
                // Validate the response format
                if (!jsonResponse.message || !jsonResponse.action || !jsonResponse.expression || !jsonResponse.position) {
                    throw new Error('Invalid response format');
                }
                // Validate the action
                const validActions = ['idle', 'pushUp', 'dance', 'greet', 'angry', 'grenade', 'walking'];
                if (!validActions.includes(jsonResponse.action)) {
                    throw new Error('Invalid action');
                }
                // Validate the expression
                const validExpressions = ['happy', 'angry', 'sad', 'relaxed', 'surprised', 'neutral', 'scared', 'teasing', 'laughing', 'frustrated'];
                if (!validExpressions.includes(jsonResponse.expression)) {
                    throw new Error('Invalid expression');
                }
                // Validate the position format (x,y)
                if (!/^\d+,\d+$/.test(jsonResponse.position)) {
                    throw new Error('Invalid position format');
                }
                // Add new response to history
                conversationHistory.push(jsonResponse);
                // Keep only the most recent responses
                if (conversationHistory.length > MAX_HISTORY) {
                    conversationHistory = conversationHistory.slice(-MAX_HISTORY);
                }
                return JSON.stringify(jsonResponse);
            } catch (error) {
                console.error('Error parsing or validating response:', error);
                return null;
            }
        } else {
            console.error('Unexpected API response format:', data);
            return null;
        }
    } catch (error) {
        console.error('Error sending logs to OpenAI:', error);
        return null;
    }
};

const sendCommentaryToOpenAI = async () => {
    // Function disabled
    return null;
};

export { sendLogsToOpenAI, sendCommentaryToOpenAI, SCREEN_COORDINATES };

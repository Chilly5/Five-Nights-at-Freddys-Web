import { sendLogsToOpenAI } from './OpenAIUtil';

// Master string to store all logs
let masterLog = '';
let logCount = 0;
let lastAPICall = Date.now();
let nextLogThreshold = Math.floor(Math.random() * 5) + 3; // Random number between 3-7 logs
let isProcessingResponse = false; // Flag to prevent multiple simultaneous calls
const MAX_TIME_BETWEEN_REACTIONS = 25000; // 25 seconds maximum between reactions

// Helper function for timestamped logging that also adds to master string
const logWithTime = (message) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    masterLog += logMessage + '\n';
    
    // Increment log count and check if we should make an API call
    logCount++;
    checkForAIResponse();
};

// Function to format the AI response in a visually appealing way
const formatAIResponse = (response) => {
    if (!response) return null;
    
    try {
        const parsed = JSON.parse(response);
        
        // Create a box around the response using Unicode characters
        const boxTop = '╔════════════════════════════════════════════════════════╗';
        const boxBottom = '╚════════════════════════════════════════════════════════╝';
        const boxSide = '║';
        
        // Format each line with proper padding
        const messageLines = parsed.message.match(/.{1,48}/g) || [parsed.message]; // Split message into 48-char lines
        const formattedMessage = messageLines.map(line => 
            `${boxSide} ${line.padEnd(48, ' ')} ${boxSide}`
        ).join('\n');
        
        const formattedAction = `${boxSide} Animation: ${parsed.action.padEnd(39, ' ')} ${boxSide}`;
        const formattedPosition = `${boxSide} Position: ${parsed.position.padEnd(39, ' ')} ${boxSide}`;
        
        return `\n${boxTop}\n${formattedMessage}\n${boxSide} ${''.padEnd(48, ' ')} ${boxSide}\n${formattedAction}\n${formattedPosition}\n${boxBottom}\n`;
    } catch (error) {
        console.error('Error formatting AI response:', error);
        return null;
    }
};

// Function to check if we should get an AI response
const checkForAIResponse = async () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastAPICall;
    
    // Make API call if any of these conditions are met:
    // 1. We've reached our random log threshold AND at least 5 seconds have passed
    // 2. OR it's been 25 seconds since the last reaction
    // AND in both cases, we're not currently processing a response
    if (!isProcessingResponse && 
        ((logCount >= nextLogThreshold && timeSinceLastCall >= 5000) || 
         timeSinceLastCall >= MAX_TIME_BETWEEN_REACTIONS)) {
        
        try {
            isProcessingResponse = true; // Set flag before making call
            const response = await sendLogsToOpenAI();
            
            if (response) {
                const formatted = formatAIResponse(response);
                if (formatted) {
                    console.log(formatted);
                }
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
        } finally {
            // Reset all counters and flags after processing
            logCount = 0;
            lastAPICall = Date.now();
            nextLogThreshold = Math.floor(Math.random() * 5) + 3;
            isProcessingResponse = false; // Reset flag after processing
        }
    }
};

// Function to get the complete log history
const getMasterLog = () => masterLog;

// Function to clear the log history
const clearMasterLog = () => {
    masterLog = '';
    logCount = 0;
    lastAPICall = Date.now();
    nextLogThreshold = Math.floor(Math.random() * 5) + 3;
    isProcessingResponse = false;
};

export { logWithTime, getMasterLog, clearMasterLog };

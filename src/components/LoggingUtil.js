import { sendLogsToOpenAI } from './OpenAIUtil';

// Master string to store all logs
let masterLog = '';
let logCount = 0;
let lastAPICall = Date.now();
let nextLogThreshold = Math.floor(Math.random() * 5) + 3; // Random number between 3-7 logs
let isProcessingResponse = false; // Flag to prevent multiple simultaneous calls
const MAX_TIME_BETWEEN_REACTIONS = 25000; // 25 seconds maximum between reactions

// Debug listener for game events
window.addEventListener('GAME_EVENT', (event) => {
    console.log('%c[GAME EVENT DEBUG]', 'color: #00ff00; font-weight: bold', {
        type: event.detail.type,
        payload: event.detail.payload,
        timestamp: event.detail.timestamp
    });
});

// Function to emit game events for Chrome extension
const emitGameEvent = (eventName, data) => {
    const event = new CustomEvent('EXTENSION_GAME_EVENT', {
        detail: {
            type: eventName,
            payload: data,
            timestamp: new Date().toISOString()
        }
    });
    window.dispatchEvent(event);
};

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
    
    // Emit log event for Chrome extension
    emitGameEvent('GAME_LOG', {
        message: logMessage,
        rawMessage: message,
        timestamp: now.toISOString()
    });
    
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
        
        // Emit AI response event for Chrome extension
        emitGameEvent('AI_RESPONSE', {
            message: parsed.message,
            action: parsed.action,
            position: parsed.position
        });
        
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
            // Emit error event for Chrome extension
            emitGameEvent('AI_ERROR', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
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
    
    // Emit clear log event for Chrome extension
    emitGameEvent('LOGS_CLEARED', {
        timestamp: new Date().toISOString()
    });
};

// Export a test function to manually trigger events for debugging
const testEventEmission = () => {
    console.log('%c[DEBUG] Testing event emission...', 'color: #ff00ff; font-weight: bold');
    
    // Test game log event
    logWithTime('Test game log message');
    
    // Test AI response event
    formatAIResponse(JSON.stringify({
        message: 'Test AI response',
        action: 'TEST_ACTION',
        position: 'TEST_POSITION'
    }));
    
    // Test error event
    emitGameEvent('AI_ERROR', {
        error: 'Test error message',
        timestamp: new Date().toISOString()
    });
    
    // Test clear logs event
    clearMasterLog();
};

export { logWithTime, getMasterLog, clearMasterLog, testEventEmission };

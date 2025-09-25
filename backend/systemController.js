// systemController.js - System Control Functions for Lokesh's AI Assistant
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// System control functions
export const systemController = {
    
    // Open YouTube with search query
    openYouTube: async (searchQuery = '') => {
        try {
            let url = 'https://www.youtube.com';
            if (searchQuery) {
                const encodedQuery = encodeURIComponent(searchQuery);
                url = `https://www.youtube.com/results?search_query=${encodedQuery}`;
            }
            
            // Open in default browser
            await execAsync(`start "" "${url}"`);
            
            return {
                success: true,
                message: searchQuery 
                    ? `Opening YouTube and searching for "${searchQuery}"...` 
                    : "Opening YouTube...",
                action: 'youtube_opened'
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to open YouTube: ${error.message}`,
                action: 'youtube_failed'
            };
        }
    },

    // Open Google with search query
    openGoogle: async (searchQuery = '') => {
        try {
            let url = 'https://www.google.com';
            if (searchQuery) {
                const encodedQuery = encodeURIComponent(searchQuery);
                url = `https://www.google.com/search?q=${encodedQuery}`;
            }
            
            await execAsync(`start "" "${url}"`);
            
            return {
                success: true,
                message: searchQuery 
                    ? `Opening Google and searching for "${searchQuery}"...` 
                    : "Opening Google...",
                action: 'google_opened'
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to open Google: ${error.message}`,
                action: 'google_failed'
            };
        }
    },

    // Open LinkedIn
    openLinkedIn: async () => {
        try {
            const url = 'https://www.linkedin.com';
            await execAsync(`start "" "${url}"`);
            
            return {
                success: true,
                message: "Opening LinkedIn...",
                action: 'linkedin_opened'
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to open LinkedIn: ${error.message}`,
                action: 'linkedin_failed'
            };
        }
    },

    // Open Calculator
    openCalculator: async () => {
        try {
            await execAsync('calc');
            
            return {
                success: true,
                message: "Opening Calculator...",
                action: 'calculator_opened'
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to open Calculator: ${error.message}`,
                action: 'calculator_failed'
            };
        }
    },

    // Open File Explorer (My PC)
    openFiles: async (path = '') => {
        try {
            let command = 'explorer';
            let folderName = 'File Explorer';
            
            const lowerPath = path.toLowerCase();
            
            if (lowerPath.includes('download')) {
                command = 'explorer shell:downloads';
                folderName = 'Downloads folder';
            } else if (lowerPath.includes('document')) {
                command = 'explorer shell:personal';
                folderName = 'Documents folder';
            } else if (lowerPath.includes('desktop')) {
                command = 'explorer shell:desktop';
                folderName = 'Desktop folder';
            } else if (lowerPath.includes('picture') || lowerPath.includes('photo')) {
                command = 'explorer shell:mypictures';
                folderName = 'Pictures folder';
            } else if (lowerPath.includes('music')) {
                command = 'explorer shell:mymusic';
                folderName = 'Music folder';
            } else if (lowerPath.includes('video')) {
                command = 'explorer shell:myvideo';
                folderName = 'Videos folder';
            } else if (lowerPath.includes('my pc') || lowerPath.includes('this pc')) {
                command = 'explorer ::{20D04FE0-3AEA-1069-A2D8-08002B30309D}';
                folderName = 'This PC';
            } else if (path) {
                command = `explorer "${path}"`;
                folderName = path;
            } else {
                command = 'explorer';
                folderName = 'File Explorer';
            }
            
            await execAsync(command);
            
            return {
                success: true,
                message: `Opening ${folderName}...`,
                action: 'files_opened'
            };
        } catch (error) {
            return {
                success: false,
                message: `File command failed`,
                action: 'files_failed'
            };
        }
    },

    // Get current time
    getCurrentTime: () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        return {
            success: true,
            message: `The current time is ${timeString}`,
            action: 'time_provided',
            data: {
                time: timeString,
                timestamp: now.getTime()
            }
        };
    },

    // Get current date
    getCurrentDate: () => {
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return {
            success: true,
            message: `Today is ${dateString}`,
            action: 'date_provided',
            data: {
                date: dateString,
                timestamp: now.getTime()
            }
        };
    }
};

// Command parser to detect system commands
export const parseSystemCommand = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // YouTube commands
    if (lowerMessage.includes('open youtube') || lowerMessage.includes('youtube')) {
        const searchMatch = message.match(/(?:open youtube|youtube)(?:\s+(?:and\s+)?(?:search\s+(?:for\s+)?)?(.+))?/i);
        const searchQuery = searchMatch && searchMatch[1] ? searchMatch[1].trim() : '';
        return {
            type: 'youtube',
            query: searchQuery,
            action: () => systemController.openYouTube(searchQuery)
        };
    }
    
    // Google commands
    if (lowerMessage.includes('open google') || lowerMessage.includes('google search')) {
        const searchMatch = message.match(/(?:open google|google search)(?:\s+(?:and\s+)?(?:search\s+(?:for\s+)?)?(.+))?/i);
        const searchQuery = searchMatch && searchMatch[1] ? searchMatch[1].trim() : '';
        return {
            type: 'google',
            query: searchQuery,
            action: () => systemController.openGoogle(searchQuery)
        };
    }
    
    // LinkedIn commands
    if (lowerMessage.includes('open linkedin') || lowerMessage.includes('linkedin')) {
        return {
            type: 'linkedin',
            action: () => systemController.openLinkedIn()
        };
    }
    
    // Calculator commands
    if (lowerMessage.includes('open calculator') || lowerMessage.includes('calculator')) {
        return {
            type: 'calculator',
            action: () => systemController.openCalculator()
        };
    }
    
    // File Explorer commands
    if (lowerMessage.includes('open files') || lowerMessage.includes('file explorer') || lowerMessage.includes('my pc') || 
        lowerMessage.includes('open document') || lowerMessage.includes('open desktop') || lowerMessage.includes('open picture') || 
        lowerMessage.includes('open photo') || lowerMessage.includes('open music') || lowerMessage.includes('open video') ||
        lowerMessage.includes('open download')) {
        
        let path = '';
        if (lowerMessage.includes('download')) path = 'download';
        else if (lowerMessage.includes('document')) path = 'document';
        else if (lowerMessage.includes('desktop')) path = 'desktop';
        else if (lowerMessage.includes('picture') || lowerMessage.includes('photo')) path = 'picture';
        else if (lowerMessage.includes('music')) path = 'music';
        else if (lowerMessage.includes('video')) path = 'video';
        else if (lowerMessage.includes('my pc') || lowerMessage.includes('this pc')) path = 'my pc';
        
        return {
            type: 'files',
            path: path,
            action: () => systemController.openFiles(path)
        };
    }
    
    // Time commands
    if (lowerMessage.includes('what time') || lowerMessage.includes('current time') || lowerMessage.includes('what is the time')) {
        return {
            type: 'time',
            action: () => systemController.getCurrentTime()
        };
    }
    
    // Date commands
    if (lowerMessage.includes('what date') || lowerMessage.includes('today') || lowerMessage.includes('current date') || lowerMessage.includes('what is the date')) {
        return {
            type: 'date',
            action: () => systemController.getCurrentDate()
        };
    }
    
    return null;
};

export default systemController;

/**
 * Utility functions for handling @username mentions
 */

// Regular expression to match @username mentions
// Matches @followed by alphanumeric characters and underscores (3-30 chars)
export const MENTION_REGEX = /@([a-zA-Z0-9_]{3,30})/g;

/**
 * Extract all @username mentions from text
 * @param text - The text to extract mentions from
 * @returns Array of usernames (without @ symbol)
 */
export function extractMentions(text: string): string[] {
    const mentions: string[] = [];
    const matches = text.matchAll(MENTION_REGEX);

    for (const match of matches) {
        if (match[1]) {
            mentions.push(match[1]);
        }
    }

    return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Parse text and create segments with mention metadata
 * @param text - The text to parse
 * @returns Array of segments with type and content
 */
export function parseTextWithMentions(text: string): Array<{
    type: 'text' | 'mention';
    content: string;
    username?: string;
}> {
    const segments: Array<{
        type: 'text' | 'mention';
        content: string;
        username?: string;
    }> = [];

    let lastIndex = 0;
    const matches = text.matchAll(MENTION_REGEX);

    for (const match of matches) {
        const index = match.index!;

        // Add text before mention
        if (index > lastIndex) {
            segments.push({
                type: 'text',
                content: text.substring(lastIndex, index)
            });
        }

        // Add mention
        segments.push({
            type: 'mention',
            content: match[0],
            username: match[1]
        });

        lastIndex = index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        segments.push({
            type: 'text',
            content: text.substring(lastIndex)
        });
    }

    return segments;
}

/**
 * Validate if a username is valid for mentions
 * @param username - Username to validate (with or without @)
 * @returns Boolean indicating if username is valid
 */
export function isValidMentionUsername(username: string): boolean {
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    return /^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername);
}

/**
 * Format mentions in text as HTML (for displaying)
 * @param text - The text to format
 * @returns HTML string with mentions as links
 */
export function formatMentionsAsHTML(text: string): string {
    return text.replace(
        MENTION_REGEX,
        '<a href="/profile/$1" class="text-blue-600 hover:underline font-medium">@$1</a>'
    );
}

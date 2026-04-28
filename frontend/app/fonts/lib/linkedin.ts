/**
 * Builds a LinkedIn share URL that pre-fills the post composer with the given content.
 * NOTE: We never post on the user's behalf — this opens LinkedIn in a new tab.
 */
export function getLinkedInShareUrl(content: string): string {
    return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(content)}`;
}

/**
 * Copies text to clipboard. Returns true on success, false on failure.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for browsers without clipboard API
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Returns the character count of a string — useful for LinkedIn's 3,000 char limit.
 */
export function getPostCharCount(content: string): number {
    return content.length;
}

/**
 * LinkedIn's post limit is 3,000 characters.
 */
export const LINKEDIN_MAX_CHARS = 3000;
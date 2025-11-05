/**
 * Helper functions for session management
 */

/**
 * Generate a shareable session join link
 * @param sessionId - The session UUID
 * @param sessionCode - Optional session code for shorter URLs
 * @returns The full shareable URL
 */
export function generateSessionJoinLink(sessionId: string, sessionCode?: string): string {
  const baseUrl = window.location.origin;

  // Prefer session code for shorter, more memorable URLs
  if (sessionCode) {
    return `${baseUrl}/join/${sessionCode}`;
  }

  return `${baseUrl}/join/${sessionId}`;
}

/**
 * Copy text to clipboard
 * @param text - The text to copy
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy text:', err);
      throw new Error('Kunne ikke kopiere til utklippstavle');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Generate a QR code URL for a session join link
 * Uses a free QR code API service
 * @param sessionJoinLink - The full session join URL
 * @returns QR code image URL
 */
export function generateQRCodeUrl(sessionJoinLink: string): string {
  // Using QR Server API (free, no API key required)
  const encodedUrl = encodeURIComponent(sessionJoinLink);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;
}

/**
 * Share session using Web Share API (mobile-friendly)
 * Falls back to clipboard copy on desktop
 * @param sessionName - Name of the session
 * @param sessionCode - Session code
 * @param sessionId - Session UUID
 * @returns Promise that resolves when share is complete
 */
export async function shareSession(
  sessionName: string,
  sessionCode: string,
  sessionId: string
): Promise<{ method: 'share' | 'clipboard' }> {
  const shareUrl = generateSessionJoinLink(sessionId, sessionCode);
  const shareText = `Bli med i ${sessionName}! Bruk kode: ${sessionCode}`;

  // Check if Web Share API is available (mainly mobile browsers)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Drikker du? - ${sessionName}`,
        text: shareText,
        url: shareUrl,
      });
      return { method: 'share' };
    } catch (err) {
      // User cancelled share or error occurred
      // Fall back to clipboard
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }

  // Fallback: Copy to clipboard
  await copyToClipboard(shareUrl);
  return { method: 'clipboard' };
}

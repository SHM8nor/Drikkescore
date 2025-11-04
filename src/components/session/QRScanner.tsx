import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import './QRScanner.css';

interface QRScannerProps {
  onScanSuccess: (sessionId: string) => void;
  onClose: () => void;
}

// SECURITY: Whitelist of allowed URL protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // FIX #2: Race condition prevention with mounted flag
    let mounted = true;
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    // Initialize scanner asynchronously
    const initScanner = async () => {
      if (!mounted) return;
      await startScanning();
    };

    initScanner();

    // Cleanup function
    return () => {
      mounted = false;
      // Cleanup scanner resources
      const cleanup = async () => {
        if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          try {
            await scannerRef.current.stop();
            // FIX #1: Check again after async operation to prevent resource leak
            if (scannerRef.current) {
              scannerRef.current.clear();
            }
          } catch (err) {
            console.error('Error stopping scanner:', err);
          }
        } else if (scannerRef.current) {
          // If not scanning, still clear the instance
          try {
            scannerRef.current.clear();
          } catch (err) {
            console.error('Error clearing scanner:', err);
          }
        }
        // Ensure reference is nulled after cleanup
        scannerRef.current = null;
      };

      cleanup();
    };
  }, []);

  const startScanning = async () => {
    if (!scannerRef.current) return;

    try {
      setIsScanning(true);
      setError(null);
      setPermissionDenied(false);

      // Request camera permission and start scanning
      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10, // Frames per second for scanning
          qrbox: { width: 250, height: 250 }, // Scanning box dimensions
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Successfully scanned QR code
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Scanning error (not critical, happens continuously)
          // We don't show these errors as they're just "no QR code found" messages
          console.debug('QR scan error:', errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);

      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setPermissionDenied(true);
        setError('Kameratilgang ble avvist. Vennligst gi tillatelse til kameraet i nettleserinnstillingene.');
      } else if (err.name === 'NotFoundError') {
        setError('Ingen kamera funnet på enheten.');
      } else if (err.name === 'NotReadableError') {
        setError('Kameraet er i bruk av en annen applikasjon.');
      } else {
        setError('Kunne ikke starte kamera. Vennligst prøv igjen.');
      }

      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        await scannerRef.current.stop();
        // FIX #1: Check again after async operation to prevent resource leak
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    console.log('QR Code scanned:', decodedText);

    // Stop scanning immediately
    await stopScanning();
    setIsScanning(false);

    // Parse the QR code to extract session ID or code
    const sessionId = extractSessionId(decodedText);

    if (sessionId) {
      setSuccessMessage('QR-kode skannet!');

      // Wait a moment to show success message
      setTimeout(() => {
        onScanSuccess(sessionId);
      }, 500);
    } else {
      setError('Ugyldig QR-kode. Vennligst skann en gyldig økt-QR-kode.');
      // Restart scanning after error
      setTimeout(() => {
        setError(null);
        startScanning();
      }, 2000);
    }
  };

  const extractSessionId = (qrContent: string): string | null => {
    try {
      // Try to parse as URL first
      // Expected formats:
      // - https://drikkescore.com/session/abc123
      // - /session/abc123
      // - abc123 (just the session code)

      // FIX #3: XSS Protection - Validate protocol before parsing URL
      if (qrContent.startsWith('http://') || qrContent.startsWith('https://')) {
        try {
          const url = new URL(qrContent);

          // SECURITY: Only allow http: and https: protocols
          if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
            console.error('Blocked malicious protocol:', url.protocol);
            return null;
          }

          const pathMatch = url.pathname.match(/\/session\/([A-Za-z0-9]+)/i);
          if (pathMatch && pathMatch[1]) {
            return pathMatch[1];
          }
        } catch (urlError) {
          // Invalid URL, fall through to other parsing methods
          console.error('Invalid URL format:', urlError);
        }
      } else if (qrContent.includes(':')) {
        // FIX #3: Block any content with protocols that isn't http/https
        // This catches javascript:, data:, file:, etc.
        console.error('Blocked content with non-http protocol');
        return null;
      }

      // Check if it's a relative path
      const pathMatch = qrContent.match(/\/session\/([A-Za-z0-9]+)/i);
      if (pathMatch && pathMatch[1]) {
        return pathMatch[1];
      }

      // Check if it's just a session code (6 alphanumeric characters)
      if (/^[A-Z0-9]{6}$/i.test(qrContent.trim())) {
        return qrContent.trim().toUpperCase();
      }

      return null;
    } catch (err) {
      console.error('Error parsing QR content:', err);
      return null;
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-container">
        <div className="qr-scanner-header">
          <h2>Skann QR-kode</h2>
          <button
            className="close-button"
            onClick={handleClose}
            aria-label="Lukk"
          >
            ×
          </button>
        </div>

        <div className="qr-scanner-content">
          {!permissionDenied && !error && (
            <p className="scanner-instructions">
              Rett kameraet mot QR-koden for å bli med i økten
            </p>
          )}

          {/* QR Reader Container */}
          <div id="qr-reader" className="qr-reader-viewport"></div>

          {/* Success Message */}
          {successMessage && (
            <div className="success-message">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              {permissionDenied && (
                <div className="permission-help">
                  <p><strong>Slik gir du kameratilgang:</strong></p>
                  <ul>
                    <li><strong>Chrome/Edge:</strong> Klikk på hengelåsikonet i adressefeltet</li>
                    <li><strong>Firefox:</strong> Klikk på kameraikonet i adressefeltet</li>
                    <li><strong>Safari:</strong> Gå til Innstillinger → Safari → Kamera</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="qr-scanner-footer">
          <button
            className="btn-secondary"
            onClick={handleClose}
          >
            Avbryt
          </button>

          {error && !permissionDenied && (
            <button
              className="btn-primary"
              onClick={startScanning}
              disabled={isScanning}
            >
              Prøv igjen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

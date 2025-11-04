import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import './QRCodeDisplay.css';

interface QRCodeDisplayProps {
  sessionCode: string;
  sessionName?: string;
}

export function QRCodeDisplay({ sessionCode, sessionName }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !sessionCode) return;

    const generateQR = async () => {
      try {
        // Generate QR code with session code as content
        // In production, this could be a full URL like https://drikkescore.com/session/ABC123
        const qrContent = sessionCode;

        await QRCode.toCanvas(canvasRef.current, qrContent, {
          width: 300,
          margin: 2,
          color: {
            dark: '#003049', // Prussian blue
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });

        setError(null);
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Kunne ikke generere QR-kode');
      }
    };

    generateQR();
  }, [sessionCode]);

  return (
    <div className="qr-code-display">
      <div className="qr-code-container">
        {error ? (
          <div className="qr-error">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="qr-canvas" />
            <div className="qr-info">
              {sessionName && (
                <p className="session-name">{sessionName}</p>
              )}
              <p className="session-code-label">Øktkode:</p>
              <p className="session-code">{sessionCode}</p>
              <p className="qr-instructions">
                Skann denne koden for å bli med i økten
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

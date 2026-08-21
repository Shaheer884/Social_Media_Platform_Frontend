import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { getProfilePath } from '../../utils/routes';
import './ProfileQR.css';

/**
 * QRScanner component uses html5-qrcode to access the camera,
 * scan QR codes, validate them, and navigate to the scanned user profile.
 */
const QRScanner = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let html5QrCodeScanner = null;
    const scannerId = 'qr-reader-container';

    const startScanning = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        html5QrCodeScanner = new Html5Qrcode(scannerId);
        
        const qrCodeSuccessCallback = (decodedText) => {
          try {
            const url = new URL(decodedText);
            
            // Security Check: Ensure the scanned QR matches the current app host
            if (url.hostname !== window.location.hostname) {
              setErrorMsg('Invalid ConnectHub QR Code.');
              return;
            }

            const path = url.pathname;
            // Match pattern: /@username or /profile/username
            const match = path.match(/^\/@([^/]+)$/) || path.match(/^\/profile\/([^/]+)$/);
            
            if (match) {
              const username = match[1];
              // Stop camera immediately
              if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
                html5QrCodeScanner.stop().then(() => {
                  navigate(getProfilePath(username));
                  onClose();
                }).catch(err => {
                  console.error('Failed to stop camera on success:', err);
                  navigate(getProfilePath(username));
                  onClose();
                });
              } else {
                navigate(getProfilePath(username));
                onClose();
              }
            } else {
              setErrorMsg('Invalid ConnectHub QR Code.');
            }
          } catch (e) {
            setErrorMsg('Invalid ConnectHub QR Code.');
          }
        };

        const config = { 
          fps: 10, 
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.65;
            return { width: size, height: size };
          },
          aspectRatio: 1.0
        };

        // Start scanning with environment back-facing camera preferred
        await html5QrCodeScanner.start(
          { facingMode: 'environment' },
          config,
          qrCodeSuccessCallback,
          (errorMessage) => {
            // Silence minor scanning noise logs
          }
        );

        setCameraPermissionGranted(true);
        setLoading(false);
      } catch (err) {
        console.error('Camera initialization error:', err);
        setCameraPermissionGranted(false);
        setLoading(false);
        setErrorMsg('Camera permission is required to scan QR Codes.');
      }
    };

    if (isOpen) {
      // Small timeout to allow the DOM node to mount
      const timer = setTimeout(() => {
        startScanning();
      }, 100);

      // Prevent background scroll
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
        
        // Stop scanning and clear scanner instance on unmount/close
        if (html5QrCodeScanner) {
          if (html5QrCodeScanner.isScanning) {
            html5QrCodeScanner.stop()
              .then(() => {
                try {
                  html5QrCodeScanner.clear();
                } catch (e) {
                  // Ignore
                }
              })
              .catch(err => {
                console.error('Failed to stop scanner on cleanup:', err);
              });
          }
        }
      };
    }
  }, [isOpen, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div 
        className="qr-scanner-card" 
        onClick={(e) => e.stopPropagation()}
        ref={scannerRef}
      >
        <div className="qr-scanner-header">
          <span className="qr-scanner-title">
            <span>📷</span> Scan QR Code
          </span>
          <button className="qr-scanner-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="qr-scanner-body">
          {loading && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Preparing camera...
            </div>
          )}

          {/* Camera View Box */}
          {cameraPermissionGranted !== false && (
            <div 
              className="qr-scanner-view-container" 
              style={{ display: loading ? 'none' : 'block' }}
            >
              <div id="qr-reader-container" className="qr-scanner-reader-div"></div>
              
              {/* Laser animation and framing overlay */}
              <div className="qr-scanner-target-overlay">
                <div className="qr-scanner-aimbox">
                  <div className="qr-scanner-laser-line"></div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback layout for permission denied */}
          {cameraPermissionGranted === false && (
            <div className="qr-scanner-permission-denied">
              <span className="qr-scanner-permission-icon">🚫</span>
              <span className="qr-scanner-permission-title">Camera Access Denied</span>
              <p className="qr-scanner-permission-text">
                ConnectHub needs camera permission to scan profile QR codes. Please check your browser or device permission settings and reload.
              </p>
            </div>
          )}

          {/* Scanned Error Warnings */}
          {errorMsg && (
            <div className="qr-scanner-alert">
              {errorMsg}
            </div>
          )}

          <p className="qr-scanner-instructions">
            Align the ConnectHub profile QR Code inside the box to scan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

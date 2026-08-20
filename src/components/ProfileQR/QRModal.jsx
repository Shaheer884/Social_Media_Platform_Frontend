import React, { useEffect, useRef, useState } from 'react';
import ProfileQRCode from './ProfileQRCode';
import { getUploadUrl } from '../../utils/mediaHelper';
import './ProfileQR.css';

/**
 * QRModal renders a premium popup overlay displaying the user's details
 * and their dynamic profile QR code with download, copy, and share actions.
 */
const QRModal = ({ isOpen, onClose, user }) => {
  const modalRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');

  // Auto-close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling while modal is open
      document.body.style.overflow = 'hidden';
      // Focus on modal for accessibility
      if (modalRef.current) modalRef.current.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const defaultAvatar = '/uploads/default-avatar.png';
  const profileUrl = `${window.location.origin}/@${user.username}`;

  // Temporarily show custom toast alerts inside the modal card
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Convert the dynamic canvas to image download link
  const handleDownload = () => {
    try {
      const canvas = document.getElementById('qr-profile-canvas');
      if (!canvas) {
        showToast('Error: QR canvas not found');
        return;
      }
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `connecthub-${user.username}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showToast('QR Code downloaded successfully!');
    } catch (err) {
      console.error('Download QR Code error:', err);
      showToast('Failed to download QR Code');
    }
  };

  // Copy Profile URL to Clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      showToast('Profile link copied to clipboard!');
    } catch (err) {
      console.error('Clipboard copy error:', err);
      showToast('Failed to copy link');
    }
  };

  // Web Share API with copy-to-clipboard fallback
  const handleShare = async () => {
    const shareData = {
      title: `${user.fullName} on ConnectHub`,
      text: `Scan my QR Code or click the link to check out my profile on ConnectHub!`,
      url: profileUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Share cancelled or failed, do nothing or fallback
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      // Fallback: Copy to clipboard
      handleCopyLink();
    }
  };

  return (
    <div 
      className="qr-modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div 
        className="qr-modal-card" 
        onClick={(e) => e.stopPropagation()}
        tabIndex="-1"
        ref={modalRef}
      >
        {/* Gradient Top Accent Bar */}
        <div className="qr-card-gradient-header"></div>
        
        <div className="qr-card-body">
          {/* User Details Area */}
          <div className="qr-user-profile">
            <img 
              src={getUploadUrl(user.profilePicture || defaultAvatar)} 
              className="qr-user-avatar" 
              alt={`${user.fullName}'s Avatar`} 
            />
            <div>
              <h3 className="qr-user-name">
                {user.fullName}
                {user.isVerified && (
                  <span style={{ color: 'var(--purple)', marginLeft: '6px', fontSize: '0.95rem' }} title="Verified User">
                    ✓
                  </span>
                )}
              </h3>
              <span className="qr-user-username">@{user.username}</span>
            </div>
          </div>

          <h4 id="qr-modal-title" className="qr-modal-title">My ConnectHub QR</h4>
          <p className="qr-modal-desc">
            Share this QR Code so people can instantly find your profile.
          </p>

          {/* QR Code Canvas */}
          <ProfileQRCode value={profileUrl} size={180} />
          
          <span className="qr-scan-footer-text">Scan to view my ConnectHub profile</span>

          {/* Action Alerts (Toast notifications inside modal) */}
          {toastMessage && (
            <div className="qr-scanner-alert" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--purple)', borderColor: 'rgba(139, 92, 246, 0.2)', marginBottom: '16px', marginTop: '0' }}>
              {toastMessage}
            </div>
          )}

          {/* Action Buttons Grid */}
          <div className="qr-actions-grid">
            <button 
              className="qr-action-btn qr-action-btn-primary" 
              onClick={handleDownload}
            >
              📥 Download PNG
            </button>
            <button 
              className="qr-action-btn qr-action-btn-primary" 
              onClick={handleShare}
            >
              🔗 Share QR
            </button>
            <button 
              className="qr-action-btn qr-action-btn-secondary" 
              onClick={handleCopyLink}
              style={{ gridColumn: '1 / -1' }} /* Span full width of grid */
            >
              📋 Copy Profile Link
            </button>
          </div>

          {/* Close Action */}
          <button className="qr-action-btn qr-action-btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRModal;

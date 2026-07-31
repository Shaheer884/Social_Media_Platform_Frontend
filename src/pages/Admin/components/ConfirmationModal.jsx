import React from 'react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-title">{title}</div>
        <div className="admin-modal-desc">{message}</div>
        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className={`admin-btn ${type === 'danger' ? 'admin-btn-danger' : 'admin-btn-primary'}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

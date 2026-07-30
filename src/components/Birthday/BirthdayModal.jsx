import React from 'react';
import Modal from '../Modal/Modal';

const BirthdayModal = ({ isOpen, onClose, userName }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Happy Birthday! 🎉">
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎂🎈🎉</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--purple)', marginBottom: '8px' }}>
          Happy Birthday, {userName}!
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '0.95rem' }}>
          Wishing you a beautiful day filled with love, laughter, and wonderful memories. 
          We're so glad to celebrate this special day with you on ConnectHub!
        </p>
        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{ marginTop: '24px', width: '100%', padding: '10px' }}
        >
          Thank You! ❤️
        </button>
      </div>
    </Modal>
  );
};

export default BirthdayModal;

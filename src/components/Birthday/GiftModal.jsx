import React, { useState } from 'react';
import Modal from '../Modal/Modal';

const GIFTS = [
  { type: 'Cake', icon: '🎂', label: 'Birthday Cake' },
  { type: 'Gift Box', icon: '🎁', label: 'Gift Box' },
  { type: 'Flowers', icon: '🌹', label: 'Bouquet of Flowers' },
  { type: 'Balloons', icon: '🎈', label: 'Party Balloons' },
  { type: 'Chocolate', icon: '🍫', label: 'Sweet Chocolate' },
  { type: 'Coffee', icon: '☕', label: 'Warm Coffee' }
];

const GiftModal = ({ isOpen, onClose, recipientName, onSendGift }) => {
  const [selectedGift, setSelectedGift] = useState(GIFTS[0].type);
  const [giftMessage, setGiftMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await onSendGift(selectedGift, giftMessage);
      setGiftMessage('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send virtual gift.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Send a Virtual Gift to ${recipientName}`}>
      <form onSubmit={handleSend}>
        <div className="modal-body" style={{ padding: '20px' }}>
          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Choose a virtual gift to send to {recipientName}. It will be displayed on their birthday wall!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {GIFTS.map((g) => {
              const isSelected = selectedGift === g.type;
              return (
                <div
                  key={g.type}
                  onClick={() => setSelectedGift(g.type)}
                  style={{
                    border: isSelected ? '2px solid var(--purple)' : '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px 6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(168, 85, 247, 0.05)' : 'var(--card-bg)',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '4px' }}>{g.icon}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{g.label}</div>
                </div>
              );
            })}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gift-message">Add a message (optional)</label>
            <input
              type="text"
              id="gift-message"
              className="form-input"
              placeholder="Happy Birthday! Hope you like this..."
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              maxLength={80}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }} disabled={sending}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={sending}>
            {sending ? 'Sending...' : 'Send Gift 🎁'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GiftModal;

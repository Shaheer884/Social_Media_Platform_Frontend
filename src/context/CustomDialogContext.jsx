import React, { createContext, useContext, useState, useRef } from 'react';

const CustomDialogContext = createContext();

export const useDialog = () => {
  const context = useContext(CustomDialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a CustomDialogProvider');
  }
  return context;
};

export const CustomDialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: 'alert', // 'alert' or 'confirm'
    title: '',
    message: ''
  });

  const resolverRef = useRef(null);

  const showAlert = (message, title = 'Alert') => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        isOpen: true,
        type: 'alert',
        title,
        message
      });
    });
  };

  const showConfirm = (message, title = 'Confirm') => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        isOpen: true,
        type: 'confirm',
        title,
        message
      });
    });
  };

  const handleConfirm = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
    }
  };

  const handleCancel = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
    }
  };

  return (
    <CustomDialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialogState.isOpen && (
        <div className="custom-dialog-overlay" onClick={handleCancel}>
          <div className="custom-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="custom-dialog-header">
              <h3 className="custom-dialog-title">{dialogState.title}</h3>
            </div>
            <div className="custom-dialog-body">
              <p className="custom-dialog-message">{dialogState.message}</p>
            </div>
            <div className="custom-dialog-footer">
              {dialogState.type === 'confirm' && (
                <button className="btn btn-secondary custom-dialog-btn" onClick={handleCancel}>
                  Cancel
                </button>
              )}
              <button className="btn btn-primary custom-dialog-btn" onClick={handleConfirm}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomDialogContext.Provider>
  );
};

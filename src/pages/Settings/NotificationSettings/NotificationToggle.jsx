import React from 'react';

const NotificationToggle = ({ checked, onChange, disabled, id }) => {
  return (
    <label className="settings-switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="settings-switch-slider"></span>
    </label>
  );
};

export default NotificationToggle;

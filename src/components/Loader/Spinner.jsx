import React from 'react';

const Spinner = ({ size = '24px', style = {} }) => {
  return (
    <div
      className="spinner"
      style={{
        width: size,
        height: size,
        borderWidth: '3px',
        ...style
      }}
    />
  );
};

export default Spinner;

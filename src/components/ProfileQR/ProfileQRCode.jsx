import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * ProfileQRCode component renders a high-quality canvas-based QR Code
 * containing a profile link and the ConnectHub logo in the center.
 * 
 * @param {string} value - The absolute URL to be embedded in the QR.
 * @param {number} size - The width/height of the QR canvas (default: 200).
 * @param {string} id - The DOM id of the canvas element (default: 'qr-profile-canvas').
 */
const ProfileQRCode = ({ value, size = 200, id = 'qr-profile-canvas' }) => {
  return (
    <div className="qr-code-wrapper">
      <QRCodeCanvas
        id={id}
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#0f172a"
        level="H" /* High error correction level for center logo overlap */
        includeMargin={false}
        imageSettings={{
          src: '/favicon.png',
          x: undefined,
          y: undefined,
          height: Math.floor(size * 0.2), /* 20% of QR size */
          width: Math.floor(size * 0.2),
          excavate: true, /* excavate pixels behind the logo */
        }}
      />
    </div>
  );
};

export default ProfileQRCode;

import React from 'react';
import logoImg from '../assets/logo.png';

const BrandLogo = ({ size = 64, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: size > 48 ? '18px' : '10px',
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.18)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <img
        src={logoImg}
        alt="TalentFlow EMS Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

export default BrandLogo;

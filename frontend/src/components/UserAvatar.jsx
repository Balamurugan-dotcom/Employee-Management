import React, { useState } from 'react';

const UserAvatar = ({
  src,
  name = 'User',
  size = 36,
  borderRadius = '50%',
  border = '1px solid #e2e8f0',
  background = 'linear-gradient(135deg, #4f46e5, #6366f1)',
  fontSize,
  fontWeight = 700,
  style = {},
  className = '',
  onClick,
  title,
}) => {
  const [imgError, setImgError] = useState(false);
  const isValidPhoto = src && !src.includes('dicebear.com') && !imgError;

  const computedFontSize =
    fontSize || (typeof size === 'number' ? `${Math.round(size * 0.42)}px` : '14px');

  if (isValidPhoto) {
    return (
      <img
        src={src}
        alt={name}
        className={className}
        onClick={onClick}
        title={title}
        onError={() => setImgError(true)}
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
          borderRadius,
          objectFit: 'cover',
          border,
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  const initial = (name ? name.trim().charAt(0) : 'U').toUpperCase();

  return (
    <div
      className={className}
      onClick={onClick}
      title={title}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius,
        background,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight,
        fontSize: computedFontSize,
        flexShrink: 0,
        userSelect: 'none',
        ...style,
      }}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;

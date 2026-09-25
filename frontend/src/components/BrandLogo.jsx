import React from 'react';

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
        filter: 'drop-shadow(0 8px 16px rgba(79, 70, 229, 0.35))',
        userSelect: 'none',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {/* Rounded Modern Squircle Container */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="18"
          fill="url(#logoBgGrad)"
        />

        {/* Subtle Inner Border Glow */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="17"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Dynamic Connected Workforce / Organization Glyph */}
        {/* Upper Connecting Bridge / Enterprise Arch */}
        <path
          d="M19 39C19 32.5 24.5 28.5 32 28.5C39.5 28.5 45 32.5 45 39"
          stroke="url(#nodeGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Central Leader Person */}
        <circle cx="32" cy="20" r="5.5" fill="url(#nodeGrad)" />

        {/* Left Team Member */}
        <circle cx="21" cy="25" r="4.2" fill="url(#nodeGrad)" opacity="0.95" />
        <path
          d="M14 43C14 38.5 17 35.5 21 35.5C23.2 35.5 25 36.5 26 38"
          stroke="url(#nodeGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Right Team Member */}
        <circle cx="43" cy="25" r="4.2" fill="url(#nodeGrad)" opacity="0.95" />
        <path
          d="M50 43C50 38.5 47 35.5 43 35.5C40.8 35.5 39 36.5 38 38"
          stroke="url(#nodeGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Central Foundation / Star Spark representing Growth & Flow */}
        <circle cx="32" cy="42" r="3.2" fill="#ffffff" />
        <line
          x1="32"
          y1="34"
          x2="32"
          y2="37"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="26"
          y1="42"
          x2="28"
          y2="42"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="36"
          y1="42"
          x2="38"
          y2="42"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default BrandLogo;

import React from 'react';

const Logo = ({ size = 36 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="TaskMaster"
    style={{ display: 'block', flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="tmGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="10" fill="url(#tmGrad)" />
    <path
      d="M10.5 20.5L17.5 28L29.5 12"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="32.5" cy="9.5" r="2.5" fill="#c7d2fe" opacity="0.85" />
    <circle cx="32.5" cy="9.5" r="1.2" fill="white" />
  </svg>
);

export default Logo;

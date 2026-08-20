import React from 'react';

export interface ColiseuLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon' | 'classic';
  className?: string;
  style?: React.CSSProperties;
}

export const ColiseuLogo: React.FC<ColiseuLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  style,
}) => {
  const iconSizes = {
    sm: { width: 20, height: 16 },
    md: { width: 28, height: 22 },
    lg: { width: 38, height: 30 },
  };

  const currentSize = iconSizes[size];

  // SVG das 3 Ondas / Curvas clássicas da Coliseu Sistemas (conforme a identidade da imagem)
  const WavesIcon = (
    <svg
      width={currentSize.width}
      height={currentSize.height}
      viewBox="0 0 48 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="coliseuWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00a3e0" />
          <stop offset="100%" stopColor="#0055aa" />
        </linearGradient>
      </defs>
      {/* Onda Superior */}
      <path
        d="M2 10C12 2 36 2 46 10C36 6 12 6 2 10Z"
        fill="url(#coliseuWaveGrad)"
      />
      <path
        d="M2 11C14 4 34 4 46 11C34 7 14 7 2 11Z"
        fill="url(#coliseuWaveGrad)"
      />
      {/* Onda Central */}
      <path
        d="M2 20C14 12 34 12 46 20C34 15 14 15 2 20Z"
        fill="url(#coliseuWaveGrad)"
      />
      {/* Onda Inferior */}
      <path
        d="M4 30C16 22 32 22 44 30C32 24 16 24 4 30Z"
        fill="url(#coliseuWaveGrad)"
      />
      {/* Detalhe de arco lateral esquerdo característico */}
      <path
        d="M2 10C2 20 6 30 14 36C8 28 4 18 4 10H2Z"
        fill="url(#coliseuWaveGrad)"
        opacity="0.8"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', ...style }} className={className}>
        {WavesIcon}
      </div>
    );
  }

  if (variant === 'classic') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-family-body)',
          ...style,
        }}
        className={className}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
          <span
            style={{
              fontSize: size === 'lg' ? '22px' : size === 'md' ? '18px' : '14px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            coliseu
          </span>
          <span
            style={{
              fontSize: size === 'lg' ? '12px' : size === 'md' ? '10px' : '9px',
              fontWeight: 500,
              color: 'var(--text-link)',
              letterSpacing: '0.02em',
            }}
          >
            Professional
          </span>
        </div>
        {WavesIcon}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-family-body)',
        userSelect: 'none',
        ...style,
      }}
      className={className}
    >
      {WavesIcon}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span
            style={{
              fontSize: size === 'lg' ? '18px' : size === 'md' ? '15px' : '13px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            coliseu
          </span>
          <span
            style={{
              fontSize: size === 'lg' ? '11px' : size === 'md' ? '9px' : '8px',
              fontWeight: 700,
              color: 'var(--text-link)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            ERP
          </span>
        </div>
        <span
          style={{
            fontSize: '9px',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
            marginTop: '1px',
          }}
        >
          sistemas
        </span>
      </div>
    </div>
  );
};

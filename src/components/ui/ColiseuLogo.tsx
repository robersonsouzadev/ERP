import React from 'react';
import { useTheme } from '../../lib/theme';

export interface ColiseuLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon' | 'classic';
  className?: string;
  style?: React.CSSProperties;
  showErpBadge?: boolean;
  themeOverride?: 'dark' | 'light';
}

export const ColiseuLogo: React.FC<ColiseuLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  style,
  showErpBadge = true,
  themeOverride,
}) => {
  const { theme } = useTheme();
  const currentTheme = themeOverride || theme || 'dark';

  const heights = {
    sm: 26,
    md: 32,
    lg: 42,
  };

  const iconSizes = {
    sm: 22,
    md: 28,
    lg: 38,
  };

  const currentHeight = heights[size] || 32;
  const currentIconSize = iconSizes[size] || 28;
  const logoSrc = currentTheme === 'light' ? '/coliseu-logo.png' : '/coliseu-logo-dark.png';

  if (variant === 'icon') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style,
        }}
        className={className}
        title="Coliseu ERP"
      >
        <img
          src="/coliseu-icon.png"
          alt="Coliseu ERP"
          style={{
            width: `${currentIconSize}px`,
            height: `${currentIconSize}px`,
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        userSelect: 'none',
        ...style,
      }}
      className={className}
    >
      {/* Imagem Oficial da Coliseu Sistemas (Original no modo Claro, Adaptada no modo Escuro) */}
      <img
        src={logoSrc}
        alt="Coliseu ERP"
        style={{
          height: `${currentHeight}px`,
          width: 'auto',
          maxWidth: size === 'lg' ? '190px' : size === 'md' ? '150px' : '125px',
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {showErpBadge && (
        <span
          style={{
            fontSize: size === 'lg' ? '11px' : size === 'md' ? '9px' : '8px',
            fontWeight: 800,
            padding: size === 'lg' ? '2px 7px' : '1.5px 5px',
            borderRadius: '4px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginLeft: '2px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          ERP
        </span>
      )}
    </div>
  );
};

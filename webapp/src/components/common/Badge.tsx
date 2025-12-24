import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const variants = {
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]',
    success: 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]',
    warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]',
    error: 'bg-[var(--color-error-light)] text-[var(--color-error-dark)]',
    info: 'bg-[var(--color-info-light)] text-[var(--color-info-dark)]',
    default: 'bg-[var(--color-secondary-main)] text-[var(--color-text-secondary)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;

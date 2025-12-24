import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-[var(--color-primary-main)] text-white hover:bg-[var(--color-primary-dark)] focus:ring-[var(--color-primary-main)]',
    secondary:
      'bg-[var(--color-secondary-main)] text-[var(--color-text-primary)] hover:bg-[var(--color-secondary-dark)] focus:ring-[var(--color-secondary-dark)]',
    outline:
      'border-2 border-[var(--color-primary-main)] text-[var(--color-primary-main)] hover:bg-[var(--color-primary-main)] hover:text-white focus:ring-[var(--color-primary-main)]',
    ghost:
      'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary-main)] focus:ring-[var(--color-secondary-dark)]',
    danger:
      'bg-[var(--color-error-main)] text-white hover:bg-[var(--color-error-dark)] focus:ring-[var(--color-error-main)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;

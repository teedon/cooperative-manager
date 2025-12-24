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
      'bg-[#1E88E5] text-white hover:bg-[#1565C0] focus:ring-[#1E88E5]',
    secondary:
      'bg-[#F5F5F5] text-[#0F172A] hover:bg-[#E0E0E0] focus:ring-[#E0E0E0]',
    outline:
      'border-2 border-[#1E88E5] text-[#1E88E5] hover:bg-[#1E88E5] hover:text-white focus:ring-[#1E88E5]',
    ghost:
      'text-[#64748B] hover:bg-[#F5F5F5] focus:ring-[#E0E0E0]',
    danger:
      'bg-[#EF4444] text-white hover:bg-[#DC2626] focus:ring-[#EF4444]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-3.5 text-base',
    lg: 'px-6 py-3.5 text-lg',
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

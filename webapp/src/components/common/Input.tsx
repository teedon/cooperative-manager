import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[#0F172A] mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3 rounded-lg border transition-all duration-200
              bg-[#F8FAFC]
              text-[#0F172A]
              placeholder:text-[#94A3B8]
              focus:outline-none focus:ring-2 focus:ring-[#1E88E5] focus:border-transparent
              disabled:bg-[#F5F5F5] disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${error 
                ? 'border-[#EF4444] focus:ring-[#EF4444]' 
                : 'border-[#E2E8F0]'
              }
              ${className}
            `}
            {...props}
          />
          {error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AlertCircle className="w-5 h-5 text-[#EF4444]" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[#EF4444]">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-[#64748B]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

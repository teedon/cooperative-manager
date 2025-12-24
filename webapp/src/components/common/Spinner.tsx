import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Loader2
      className={`animate-spin text-[#1E88E5] ${sizes[size]} ${className}`}
    />
  );
};

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 flex flex-col items-center space-y-4">
        <Spinner size="lg" />
        {message && (
          <p className="text-[#0F172A] font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

export { Spinner, LoadingOverlay };
export default Spinner;

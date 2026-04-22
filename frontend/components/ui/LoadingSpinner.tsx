import Icon from './Icon';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const sizeMap = {
  sm: { icon: 20, text: 'text-label-md' },
  md: { icon: 28, text: 'text-body-sm' },
  lg: { icon: 40, text: 'text-body-md' },
};

export default function LoadingSpinner({
  size = 'md',
  message,
  className = '',
}: LoadingSpinnerProps) {
  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <span className="animate-spin-slow">
        <Icon name="progress_activity" size={icon} className="text-secondary" />
      </span>
      {message && (
        <p className={`${text} text-on-surface-variant animate-pulse-soft`}>
          {message}
        </p>
      )}
    </div>
  );
}

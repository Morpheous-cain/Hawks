interface LoadingPulseProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingPulse = ({ size = 'md' }: LoadingPulseProps) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className="flex gap-1 items-center">
      <div className={`${sizeClasses[size]} rounded-full bg-primary animate-pulse`} style={{ animationDelay: '0ms' }} />
      <div className={`${sizeClasses[size]} rounded-full bg-primary animate-pulse`} style={{ animationDelay: '150ms' }} />
      <div className={`${sizeClasses[size]} rounded-full bg-primary animate-pulse`} style={{ animationDelay: '300ms' }} />
    </div>
  );
};

export default LoadingPulse;

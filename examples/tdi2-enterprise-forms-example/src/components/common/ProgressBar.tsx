import React from "react";

export interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | string;
  backgroundColor?: string;
  animated?: boolean;
  striped?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'rounded' | 'pill' | 'stepped';
  steps?: number;
  pulse?: boolean;
  gradient?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  height,
  showPercentage = false,
  showLabel = false,
  label,
  color = 'primary',
  backgroundColor = '#e9ecef',
  animated = false,
  striped = false,
  size = 'medium',
  variant = 'default',
  steps,
  pulse = false,
  gradient = false,
  className = ""
}: ProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = React.useState(0);

  React.useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animated]);

  const getSizeStyles = () => {
    const sizes = {
      small: { height: 6, fontSize: '10px' },
      medium: { height: 12, fontSize: '12px' },
      large: { height: 20, fontSize: '14px' },
    };
    return sizes[size];
  };

  const getColorValue = () => {
    const colors = {
      primary: '#007bff',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8',
    };
    return colors[color] || color;
  };

  const getBorderRadius = () => {
    switch (variant) {
      case 'rounded':
        return '8px';
      case 'pill':
        return '50px';
      case 'stepped':
        return '0';
      default:
        return '4px';
    }
  };

  const getProgressGradient = () => {
    if (!gradient) return getColorValue();
    
    const baseColor = getColorValue();
    return `linear-gradient(90deg, ${baseColor}, ${baseColor}dd, ${baseColor})`;
  };

  const sizeStyles = getSizeStyles();
  const actualHeight = height || sizeStyles.height;
  const borderRadius = getBorderRadius();
  const clampedProgress = Math.max(0, Math.min(100, animatedProgress));

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    marginBottom: showLabel || showPercentage ? '8px' : '0',
  };

  const trackStyle: React.CSSProperties = {
    width: '100%',
    height: `${actualHeight}px`,
    backgroundColor,
    borderRadius,
    overflow: 'hidden',
    position: 'relative',
    ...(variant === 'stepped' && steps && {
      display: 'flex',
      gap: '2px',
    }),
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    background: getProgressGradient(),
    borderRadius: variant === 'stepped' ? '0' : borderRadius,
    transition: animated ? 'width 0.6s ease' : 'none',
    position: 'relative',
    overflow: 'hidden',
    ...(variant !== 'stepped' && {
      width: `${clampedProgress}%`,
    }),
    ...(pulse && {
      animation: 'progressPulse 2s ease-in-out infinite',
    }),
  };

  const stripedStyle: React.CSSProperties = striped ? {
    backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)`,
    backgroundSize: `${actualHeight}px ${actualHeight}px`,
    ...(animated && {
      animation: 'progressStripes 1s linear infinite',
    }),
  } : {};

  const labelContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: sizeStyles.fontSize,
    color: '#666',
    marginTop: '4px',
  };

  const percentageOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: sizeStyles.fontSize,
    fontWeight: 'bold',
    color: clampedProgress > 50 ? 'white' : '#333',
    zIndex: 1,
    textShadow: clampedProgress > 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
  };

  const renderSteppedProgress = () => {
    if (!steps) return null;
    
    const stepWidth = 100 / steps;
    const completedSteps = Math.floor(clampedProgress / stepWidth);
    const partialStep = (clampedProgress % stepWidth) / stepWidth;

    return (
      <>
        {Array.from({ length: steps }, (_, index) => {
          let stepProgress = 0;
          if (index < completedSteps) {
            stepProgress = 100;
          } else if (index === completedSteps) {
            stepProgress = partialStep * 100;
          }

          return (
            <div
              key={index}
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: backgroundColor,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  ...fillStyle,
                  width: `${stepProgress}%`,
                  ...stripedStyle,
                }}
              />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={trackStyle}>
        {variant === 'stepped' ? (
          renderSteppedProgress()
        ) : (
          <div style={{ ...fillStyle, ...stripedStyle }} />
        )}
        
        {showPercentage && variant !== 'stepped' && (
          <div style={percentageOverlayStyle}>
            {Math.round(clampedProgress)}%
          </div>
        )}
      </div>

      {(showLabel || showPercentage) && variant !== 'stepped' && (
        <div style={labelContainerStyle}>
          <span>{label || ''}</span>
          {showPercentage && (
            <span style={{ fontWeight: 'bold' }}>
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes progressStripes {
          0% { background-position: 0 0; }
          100% { background-position: ${actualHeight}px 0; }
        }
        
        @keyframes progressPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// Circular progress variant
export interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

export function CircularProgress({
  progress,
  size = 60,
  strokeWidth = 4,
  color = '#007bff',
  backgroundColor = '#e9ecef',
  showPercentage = true,
  label,
  animated = true,
  className = ""
}: CircularProgressProps) {
  const [animatedProgress, setAnimatedProgress] = React.useState(0);

  React.useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedProgress / 100) * circumference;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    fontSize: `${size * 0.2}px`,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle} className={className}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: animated ? 'stroke-dashoffset 0.6s ease' : 'none',
          }}
        />
      </svg>
      
      {(showPercentage || label) && (
        <div style={textStyle}>
          {label && <div style={{ fontSize: '0.7em', marginBottom: '2px' }}>{label}</div>}
          {showPercentage && <div>{Math.round(animatedProgress)}%</div>}
        </div>
      )}
    </div>
  );
}

// Preset progress bar variants
export const LoadingProgress = (props: Omit<ProgressBarProps, 'animated' | 'striped'>) => (
  <ProgressBar {...props} animated={true} striped={true} pulse={true} />
);

export const StepProgress = (props: Omit<ProgressBarProps, 'variant'>) => (
  <ProgressBar {...props} variant="stepped" />
);

export const GradientProgress = (props: Omit<ProgressBarProps, 'gradient'>) => (
  <ProgressBar {...props} gradient={true} />
);
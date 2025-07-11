import React from "react";

export interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'filled' | 'outlined' | 'subtle';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Alert({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  autoClose = false,
  autoCloseDelay = 5000,
  icon,
  actions,
  variant = 'filled',
  size = 'medium',
  className = ""
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleDismiss = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 200);
  };

  const getTypeConfig = () => {
    const configs = {
      success: {
        icon: "✅",
        colors: {
          filled: { bg: "#d4edda", border: "#c3e6cb", text: "#155724" },
          outlined: { bg: "#fff", border: "#28a745", text: "#28a745" },
          subtle: { bg: "#f8fff8", border: "#e6ffe6", text: "#155724" },
        }
      },
      error: {
        icon: "❌",
        colors: {
          filled: { bg: "#f8d7da", border: "#f5c6cb", text: "#721c24" },
          outlined: { bg: "#fff", border: "#dc3545", text: "#dc3545" },
          subtle: { bg: "#fff8f8", border: "#ffe6e6", text: "#721c24" },
        }
      },
      warning: {
        icon: "⚠️",
        colors: {
          filled: { bg: "#fff3cd", border: "#ffeaa7", text: "#856404" },
          outlined: { bg: "#fff", border: "#ffc107", text: "#856404" },
          subtle: { bg: "#fffef8", border: "#fff5cc", text: "#856404" },
        }
      },
      info: {
        icon: "ℹ️",
        colors: {
          filled: { bg: "#e3f2fd", border: "#b3d9ff", text: "#0d47a1" },
          outlined: { bg: "#fff", border: "#17a2b8", text: "#17a2b8" },
          subtle: { bg: "#f8feff", border: "#e6f8ff", text: "#0d47a1" },
        }
      },
    };
    return configs[type];
  };

  const getSizeStyles = () => {
    const sizes = {
      small: {
        padding: "8px 12px",
        fontSize: "12px",
        iconSize: "14px",
        titleSize: "13px",
      },
      medium: {
        padding: "15px",
        fontSize: "14px",
        iconSize: "18px",
        titleSize: "14px",
      },
      large: {
        padding: "20px",
        fontSize: "16px",
        iconSize: "24px",
        titleSize: "16px",
      },
    };
    return sizes[size];
  };

  if (!isVisible) return null;

  const typeConfig = getTypeConfig();
  const sizeStyles = getSizeStyles();
  const colors = typeConfig.colors[variant];

  const alertStyle: React.CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: size === 'small' ? "4px" : "8px",
    padding: sizeStyles.padding,
    marginBottom: "20px",
    display: "flex",
    alignItems: "flex-start",
    gap: size === 'small' ? "8px" : "12px",
    fontSize: sizeStyles.fontSize,
    color: colors.text,
    position: "relative",
    transform: isAnimating ? "scale(0.95)" : "scale(1)",
    opacity: isAnimating ? 0 : 1,
    transition: "all 0.2s ease",
    ...(variant === 'outlined' && { borderWidth: "2px" }),
  };

  const iconStyle: React.CSSProperties = {
    fontSize: sizeStyles.iconSize,
    flexShrink: 0,
    marginTop: size === 'small' ? "1px" : "2px",
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontWeight: "bold",
    fontSize: sizeStyles.titleSize,
    lineHeight: 1.4,
  };

  const messageStyle: React.CSSProperties = {
    margin: message ? "5px 0 0 0" : 0,
    fontSize: sizeStyles.fontSize,
    lineHeight: 1.4,
    opacity: 0.9,
  };

  const dismissButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: size === 'small' ? "14px" : "16px",
    color: colors.text,
    padding: "0",
    marginLeft: "8px",
    opacity: 0.7,
    transition: "opacity 0.2s ease",
    flexShrink: 0,
  };

  const actionsStyle: React.CSSProperties = {
    marginTop: size === 'small' ? "8px" : "12px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  };

  return (
    <div style={alertStyle} className={className} role="alert">
      {/* Icon */}
      <span style={iconStyle}>
        {icon || typeConfig.icon}
      </span>

      {/* Content */}
      <div style={contentStyle}>
        <p style={titleStyle}>{title}</p>
        {message && <p style={messageStyle}>{message}</p>}
        {actions && <div style={actionsStyle}>{actions}</div>}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          style={dismissButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
          }}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}

// Toast-style alerts for notifications
export interface ToastAlertProps extends Omit<AlertProps, 'dismissible' | 'autoClose'> {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastAlert({
  position = 'top-right',
  ...alertProps
}: ToastAlertProps) {
  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: "fixed",
      zIndex: 1000,
      maxWidth: "400px",
      minWidth: "300px",
    };

    const positions = {
      'top-right': { top: "20px", right: "20px" },
      'top-left': { top: "20px", left: "20px" },
      'bottom-right': { bottom: "20px", right: "20px" },
      'bottom-left': { bottom: "20px", left: "20px" },
      'top-center': { top: "20px", left: "50%", transform: "translateX(-50%)" },
      'bottom-center': { bottom: "20px", left: "50%", transform: "translateX(-50%)" },
    };

    return { ...baseStyles, ...positions[position] };
  };

  return (
    <div style={getPositionStyles()}>
      <Alert
        {...alertProps}
        dismissible={true}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </div>
  );
}

// Preset alert variants
export const SuccessAlert = (props: Omit<AlertProps, 'type'>) => (
  <Alert {...props} type="success" />
);

export const ErrorAlert = (props: Omit<AlertProps, 'type'>) => (
  <Alert {...props} type="error" />
);

export const WarningAlert = (props: Omit<AlertProps, 'type'>) => (
  <Alert {...props} type="warning" />
);

export const InfoAlert = (props: Omit<AlertProps, 'type'>) => (
  <Alert {...props} type="info" />
);
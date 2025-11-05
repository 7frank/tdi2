import React from "react";

export interface LoadingButtonProps {
  isLoading: boolean;
  loadingText: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  spinnerColor?: string;
  animateOnClick?: boolean;
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  disabled = false,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon,
  spinnerColor,
  animateOnClick = true
}: LoadingButtonProps) {
  const [isClicked, setIsClicked] = React.useState(false);

  const handleClick = () => {
    if (disabled || isLoading) return;
    
    if (animateOnClick) {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);
    }
    
    onClick?.();
  };

  const getVariantStyles = () => {
    const variants = {
      primary: {
        background: "#007bff",
        color: "white",
        border: "none",
        hoverBackground: "#0056b3",
      },
      secondary: {
        background: "white",
        color: "#6c757d",
        border: "1px solid #6c757d",
        hoverBackground: "#f8f9fa",
      },
      success: {
        background: "#28a745",
        color: "white",
        border: "none",
        hoverBackground: "#1e7e34",
      },
      danger: {
        background: "#dc3545",
        color: "white",
        border: "none",
        hoverBackground: "#c82333",
      },
      warning: {
        background: "#ffc107",
        color: "#212529",
        border: "none",
        hoverBackground: "#e0a800",
      },
      info: {
        background: "#17a2b8",
        color: "white",
        border: "none",
        hoverBackground: "#138496",
      },
    };
    return variants[variant];
  };

  const getSizeStyles = () => {
    const sizes = {
      small: {
        padding: "6px 12px",
        fontSize: "12px",
        borderRadius: "4px",
      },
      medium: {
        padding: "12px 24px",
        fontSize: "14px",
        borderRadius: "6px",
      },
      large: {
        padding: "16px 32px",
        fontSize: "16px",
        borderRadius: "8px",
      },
    };
    return sizes[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || isLoading;

  const buttonStyle: React.CSSProperties = {
    ...sizeStyles,
    background: isDisabled ? "#6c757d" : variantStyles.background,
    color: isDisabled ? "white" : variantStyles.color,
    border: variantStyles.border,
    cursor: isDisabled ? "not-allowed" : "pointer",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    outline: "none",
    width: fullWidth ? "100%" : "auto",
    transform: isClicked ? "scale(0.98)" : "scale(1)",
    opacity: isDisabled ? 0.8 : 1,
    ...(size === 'small' && { gap: "4px" }),
    ...(size === 'large' && { gap: "12px" }),
  };

  const spinnerSize = size === 'small' ? 12 : size === 'large' ? 20 : 16;
  const defaultSpinnerColor = spinnerColor || (variant === 'secondary' || variant === 'warning' ? "#333" : "#fff");

  const spinnerStyle: React.CSSProperties = {
    width: `${spinnerSize}px`,
    height: `${spinnerSize}px`,
    border: `2px solid transparent`,
    borderTop: `2px solid ${defaultSpinnerColor}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  return (
    <>
      <button
        type={type}
        onClick={handleClick}
        disabled={isDisabled}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = variantStyles.hoverBackground;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = variantStyles.background;
          }
        }}
      >
        {isLoading ? (
          <>
            <span style={spinnerStyle} />
            {loadingText}
          </>
        ) : (
          <>
            {icon && <span>{icon}</span>}
            {children}
          </>
        )}
      </button>

      {/* CSS keyframes for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// Preset button variants for common use cases
export const SubmitButton = (props: Omit<LoadingButtonProps, 'variant'>) => (
  <LoadingButton {...props} variant="primary" type="submit" />
);

export const CancelButton = (props: Omit<LoadingButtonProps, 'variant' | 'type'>) => (
  <LoadingButton {...props} variant="secondary" type="button" />
);

export const DeleteButton = (props: Omit<LoadingButtonProps, 'variant'>) => (
  <LoadingButton {...props} variant="danger" />
);

export const SaveButton = (props: Omit<LoadingButtonProps, 'variant'>) => (
  <LoadingButton {...props} variant="success" />
);
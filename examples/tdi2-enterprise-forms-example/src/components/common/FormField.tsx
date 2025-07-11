import React from "react";

export interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'password' | 'select';
  value: string | number;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  isFocused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label: string }>;
  showPasswordToggle?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
}

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  isFocused = false,
  onFocus,
  onBlur,
  disabled = false,
  maxLength,
  min,
  max,
  step,
  options = [],
  showPasswordToggle = false,
  helperText,
  icon
}: FormFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [internalFocus, setInternalFocus] = React.useState(false);

  const handleFocus = () => {
    setInternalFocus(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setInternalFocus(false);
    onBlur?.();
  };

  const isPasswordField = type === 'password';
  const actualType = isPasswordField && showPassword ? 'text' : type;
  const isActive = isFocused || internalFocus;

  const baseInputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "8px",
    marginTop: "4px",
    border: `2px solid ${error ? "#dc3545" : isActive ? "#007bff" : "#ced4da"}`,
    borderRadius: "4px",
    fontSize: "14px",
    transition: "border-color 0.2s ease",
    outline: "none",
    backgroundColor: disabled ? "#f8f9fa" : "white",
    color: disabled ? "#6c757d" : "#333",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "4px",
    fontSize: "14px",
    fontWeight: "500",
    color: error ? "#dc3545" : "#333",
  };

  const errorStyle: React.CSSProperties = {
    color: "#dc3545",
    fontSize: "12px",
    marginTop: "4px",
    display: "block",
  };

  const helperStyle: React.CSSProperties = {
    color: "#6c757d",
    fontSize: "12px",
    marginTop: "4px",
    display: "block",
  };

  const inputContainerStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  const renderInput = () => {
    const commonProps = {
      value: value || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        onChange(newValue);
      },
      onFocus: handleFocus,
      onBlur: handleBlur,
      disabled,
      placeholder,
      maxLength,
      style: baseInputStyle,
    };

    if (type === 'select') {
      return (
        <select {...commonProps}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    const inputProps = {
      ...commonProps,
      type: actualType,
      ...(type === 'number' && { min, max, step }),
    };

    return <input {...inputProps} />;
  };

  return (
    <div style={{ marginBottom: "15px" }}>
      <label style={labelStyle}>
        {icon && <span style={{ marginRight: "6px" }}>{icon}</span>}
        {label}
        {required && <span style={{ color: "#dc3545", marginLeft: "2px" }}>*</span>}
        
        <div style={inputContainerStyle}>
          {renderInput()}
          
          {/* Password toggle button */}
          {isPasswordField && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                padding: "4px",
                color: "#6c757d",
              }}
              disabled={disabled}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          )}
        </div>

        {/* Helper text */}
        {helperText && !error && (
          <span style={helperStyle}>{helperText}</span>
        )}

        {/* Error message */}
        {error && (
          <span style={errorStyle}>{error}</span>
        )}
      </label>
    </div>
  );
}
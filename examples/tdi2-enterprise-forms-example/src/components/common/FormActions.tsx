import React from "react";
import { LoadingButton } from "./LoadingButton";

export interface FormActionsProps {
  // Primary action (usually submit)
  onSubmit?: () => void;
  submitText: string;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitIcon?: React.ReactNode;
  submitVariant?: 'primary' | 'success';
  
  // Secondary actions
  onReset?: () => void;
  resetText?: string;
  showReset?: boolean;
  resetIcon?: React.ReactNode;
  
  onCancel?: () => void;
  cancelText?: string;
  showCancel?: boolean;
  cancelIcon?: React.ReactNode;
  
  // Custom actions
  customActions?: React.ReactNode;
  
  // Layout options
  layout?: 'horizontal' | 'vertical' | 'split';
  alignment?: 'left' | 'center' | 'right' | 'space-between';
  spacing?: 'compact' | 'normal' | 'loose';
  fullWidth?: boolean;
  sticky?: boolean;
  
  // Styling
  className?: string;
  variant?: 'default' | 'card' | 'floating';
}

export function FormActions({
  onSubmit,
  submitText,
  canSubmit,
  isSubmitting,
  submitIcon,
  submitVariant = 'primary',
  
  onReset,
  resetText = "Reset Form",
  showReset = true,
  resetIcon,
  
  onCancel,
  cancelText = "Cancel",
  showCancel = false,
  cancelIcon,
  
  customActions,
  
  layout = 'horizontal',
  alignment = 'left',
  spacing = 'normal',
  fullWidth = false,
  sticky = false,
  
  className = "",
  variant = 'default'
}: FormActionsProps) {
  const getSpacingValue = () => {
    const spacings = {
      compact: "8px",
      normal: "12px",
      loose: "20px",
    };
    return spacings[spacing];
  };

  const getVariantStyles = (): React.CSSProperties => {
    const variants = {
      default: {
        background: "transparent",
        border: "none",
        borderRadius: "0",
        boxShadow: "none",
        padding: "0",
      },
      card: {
        background: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        padding: "20px",
      },
      floating: {
        background: "white",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        padding: "16px 20px",
      },
    };
    return variants[variant];
  };

  const getLayoutStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      display: "flex",
      gap: getSpacingValue(),
      width: fullWidth ? "100%" : "auto",
    };

    if (layout === 'vertical') {
      return {
        ...baseStyles,
        flexDirection: "column",
        alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
      };
    }

    if (layout === 'split') {
      return {
        ...baseStyles,
        justifyContent: "space-between",
        alignItems: "center",
      };
    }

    // Horizontal layout
    const justifyContent = {
      left: "flex-start",
      center: "center",
      right: "flex-end",
      "space-between": "space-between",
    }[alignment];

    return {
      ...baseStyles,
      justifyContent,
      alignItems: "center",
      flexWrap: "wrap",
    };
  };

  const containerStyle: React.CSSProperties = {
    ...getVariantStyles(),
    ...getLayoutStyles(),
    marginTop: variant === 'default' ? "30px" : "0",
    ...(sticky && {
      position: "sticky",
      bottom: "0",
      zIndex: 10,
      backdropFilter: "blur(8px)",
    }),
  };

  const renderActions = () => {
    const actions = [];

    // Custom actions (rendered first in split layout)
    if (customActions && layout === 'split') {
      actions.push(
        <div key="custom-left" style={{ display: "flex", gap: getSpacingValue() }}>
          {customActions}
        </div>
      );
    }

    // Secondary actions group
    const secondaryActions = [];
    
    if (showCancel && onCancel) {
      secondaryActions.push(
        <LoadingButton
          key="cancel"
          onClick={onCancel}
          isLoading={false}
          loadingText=""
          variant="secondary"
          disabled={isSubmitting}
          icon={cancelIcon}
        >
          {cancelText}
        </LoadingButton>
      );
    }

    if (showReset && onReset) {
      secondaryActions.push(
        <LoadingButton
          key="reset"
          onClick={onReset}
          isLoading={false}
          loadingText=""
          variant="secondary"
          disabled={isSubmitting}
          icon={resetIcon}
        >
          {resetText}
        </LoadingButton>
      );
    }

    // Primary actions group
    const primaryActions = [];
    
    if (onSubmit) {
      primaryActions.push(
        <LoadingButton
          key="submit"
          onClick={onSubmit}
          isLoading={isSubmitting}
          loadingText="Submitting..."
          variant={submitVariant}
          disabled={!canSubmit || isSubmitting}
          type="submit"
          icon={submitIcon}
        >
          {submitText}
        </LoadingButton>
      );
    }

    // Custom actions (rendered with other actions in non-split layout)
    if (customActions && layout !== 'split') {
      if (layout === 'vertical') {
        actions.push(...secondaryActions);
        actions.push(...primaryActions);
        actions.push(
          <div key="custom" style={{ display: "flex", gap: getSpacingValue(), flexWrap: "wrap" }}>
            {customActions}
          </div>
        );
      } else {
        actions.push(...secondaryActions);
        actions.push(
          <div key="custom" style={{ display: "flex", gap: getSpacingValue() }}>
            {customActions}
          </div>
        );
        actions.push(...primaryActions);
      }
    } else {
      // Standard layout: secondary actions first, then primary
      if (layout === 'split') {
        // In split layout, group secondary and primary together on the right
        const rightGroup = [...secondaryActions, ...primaryActions];
        if (rightGroup.length > 0) {
          actions.push(
            <div key="right-group" style={{ display: "flex", gap: getSpacingValue() }}>
              {rightGroup}
            </div>
          );
        }
      } else {
        actions.push(...secondaryActions);
        actions.push(...primaryActions);
      }
    }

    return actions;
  };

  const actions = renderActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div style={containerStyle} className={className}>
      {actions}
    </div>
  );
}

// Preset form action configurations
export const BasicFormActions = (props: Pick<FormActionsProps, 'onSubmit' | 'onReset' | 'submitText' | 'canSubmit' | 'isSubmitting'>) => (
  <FormActions
    {...props}
    showReset={true}
    layout="horizontal"
    alignment="left"
  />
);

export const ModalFormActions = (props: Pick<FormActionsProps, 'onSubmit' | 'onCancel' | 'submitText' | 'canSubmit' | 'isSubmitting'>) => (
  <FormActions
    {...props}
    showCancel={true}
    showReset={false}
    layout="horizontal"
    alignment="right"
    variant="card"
  />
);

export const WizardFormActions = (props: Pick<FormActionsProps, 'onSubmit' | 'submitText' | 'canSubmit' | 'isSubmitting'> & { 
  onPrevious?: () => void;
  onNext?: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
}) => {
  const { onPrevious, onNext, showPrevious, showNext, ...formProps } = props;
  
  const customActions = (
    <>
      {showPrevious && onPrevious && (
        <LoadingButton
          onClick={onPrevious}
          isLoading={false}
          loadingText=""
          variant="secondary"
          icon="←"
        >
          Previous
        </LoadingButton>
      )}
      {showNext && onNext && (
        <LoadingButton
          onClick={onNext}
          isLoading={false}
          loadingText=""
          variant="primary"
          icon="→"
        >
          Next
        </LoadingButton>
      )}
    </>
  );

  return (
    <FormActions
      {...formProps}
      customActions={customActions}
      showReset={false}
      layout="split"
      variant="floating"
      sticky={true}
    />
  );
};

export const StickyFormActions = (props: FormActionsProps) => (
  <FormActions
    {...props}
    sticky={true}
    variant="floating"
    fullWidth={true}
    alignment="right"
  />
);
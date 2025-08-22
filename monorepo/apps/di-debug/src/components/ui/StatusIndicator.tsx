interface StatusIndicatorProps {
  connected: boolean;
  status: string;
}

export function StatusIndicator({ connected, status }: StatusIndicatorProps) {
  return (
    <div className="status-indicator">
      <div 
        className="status-dot" 
        style={{ 
          background: connected ? '#4CAF50' : '#dc3545',
          animation: connected ? 'pulse 2s infinite' : 'none'
        }}
      />
      <span>{status}</span>
    </div>
  );
}
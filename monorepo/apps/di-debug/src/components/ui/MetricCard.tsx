interface MetricCardProps {
  value: number | string;
  label: string;
}

export function MetricCard({ value, label }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}
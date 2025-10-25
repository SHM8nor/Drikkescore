import type { ReactNode } from 'react';
import '../../styles/components/chart-container.css';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  controls?: ReactNode;
}

export default function ChartContainer({ title, children, controls }: ChartContainerProps) {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2 className="chart-title">{title}</h2>
        {controls && <div className="chart-controls">{controls}</div>}
      </div>
      <div className="chart-content">{children}</div>
    </div>
  );
}

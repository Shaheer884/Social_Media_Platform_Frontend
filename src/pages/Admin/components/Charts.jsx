import React from 'react';

// 1. Sleek Line Chart (e.g., Monthly User Growth or Daily Active Users)
export const LineChart = ({ data = [], xKey = '', yKey = '', height = 200 }) => {
  if (!data || data.length === 0) return <div style={{ textAlign: 'center', padding: '20px' }}>No data available</div>;

  const padding = 40;
  const chartHeight = height - padding * 2;
  const yValues = data.map((d) => d[yKey] || 0);
  const maxY = Math.max(...yValues, 1) * 1.1; // 10% spacing above
  const minY = 0;

  // Compute points
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (400 - padding * 2);
    const val = d[yKey] || 0;
    const y = padding + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight;
    return { x, y, label: d[xKey], val };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <svg viewBox={`0 0 400 ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      {Array.from({ length: 4 }).map((_, i) => {
        const yVal = minY + (maxY - minY) * (i / 3);
        const y = padding + chartHeight - (i / 3) * chartHeight;
        return (
          <g key={i}>
            <line x1={padding} y1={y} x2={400 - padding} y2={y} className="chart-grid-line" />
            <text x={padding - 8} y={y + 4} textAnchor="end" className="chart-text">
              {Math.round(yVal)}
            </text>
          </g>
        );
      })}

      {/* Area & Path */}
      {points.length > 0 && (
        <>
          <path d={areaD} className="chart-line-area" />
          <path d={pathD} className="chart-line" />
        </>
      )}

      {/* Dots and Tooltips */}
      {points.map((p, i) => (
        <g key={i}>
          <circle 
            cx={p.x} 
            cy={p.y} 
            r="4" 
            fill="var(--admin-primary-dark)" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            style={{ cursor: 'pointer' }}
          >
            <title>{`${p.label}: ${p.val}`}</title>
          </circle>
          <text x={p.x} y={height - padding + 16} textAnchor="middle" className="chart-text">
            {p.label}
          </text>
        </g>
      ))}

      {/* Axis Lines */}
      <line x1={padding} y1={height - padding} x2={400 - padding} y2={height - padding} className="chart-axis" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chart-axis" />
    </svg>
  );
};

// 2. Bar Chart (e.g., Monthly Posts or Weekly Engagement)
export const BarChart = ({ data = [], xKey = '', yKey = '', height = 200 }) => {
  if (!data || data.length === 0) return <div style={{ textAlign: 'center', padding: '20px' }}>No data available</div>;

  const padding = 40;
  const chartHeight = height - padding * 2;
  const yValues = data.map((d) => d[yKey] || 0);
  const maxY = Math.max(...yValues, 1) * 1.1;
  const minY = 0;

  const barWidth = Math.max(10, (400 - padding * 2) / (data.length * 1.5 || 1));
  const spacing = (400 - padding * 2 - barWidth * data.length) / (data.length - 1 || 1);

  return (
    <svg viewBox={`0 0 400 ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
      {/* Grid Lines */}
      {Array.from({ length: 4 }).map((_, i) => {
        const yVal = minY + (maxY - minY) * (i / 3);
        const y = padding + chartHeight - (i / 3) * chartHeight;
        return (
          <g key={i}>
            <line x1={padding} y1={y} x2={400 - padding} y2={y} className="chart-grid-line" />
            <text x={padding - 8} y={y + 4} textAnchor="end" className="chart-text">
              {Math.round(yVal)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, index) => {
        const x = padding + index * (barWidth + spacing);
        const val = d[yKey] || 0;
        const barHeight = ((val - minY) / (maxY - minY)) * chartHeight;
        const y = padding + chartHeight - barHeight;

        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx="4"
              className="chart-bar"
            >
              <title>{`${d[xKey]}: ${val}`}</title>
            </rect>
            <text x={x + barWidth / 2} y={height - padding + 16} textAnchor="middle" className="chart-text">
              {d[xKey]}
            </text>
          </g>
        );
      })}

      {/* Axis Lines */}
      <line x1={padding} y1={height - padding} x2={400 - padding} y2={height - padding} className="chart-axis" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chart-axis" />
    </svg>
  );
};

// 3. Trending Tags Component (Horizontal rank bars)
export const TrendingTagsChart = ({ data = [] }) => {
  if (!data || data.length === 0) return <div style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: '20px' }}>No trending hashtags yet</div>;

  const maxVal = Math.max(...data.map(d => d.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((tagObj, index) => {
        const percentage = ((tagObj.count / maxVal) * 100).toFixed(0);
        return (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '80px', fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              #{tagObj.hashtag || tagObj.tag}
            </div>
            <div style={{ flex: 1, backgroundColor: 'var(--admin-border)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: 'var(--admin-primary)', 
                  height: '100%', 
                  borderRadius: '5px',
                  transition: 'width 0.5s ease-out' 
                }}
              />
            </div>
            <div style={{ width: '30px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold' }}>
              {tagObj.count}
            </div>
          </div>
        );
      })}
    </div>
  );
};

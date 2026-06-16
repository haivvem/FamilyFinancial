import React from 'react';
import type { Transaction } from '../types';

interface StatsChartProps {
  transactions: Transaction[];
}

export const StatsChart: React.FC<StatsChartProps> = ({ transactions }) => {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  // Group by category
  const categoryMap: { [key: string]: number } = {};
  expenseTransactions.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
  });

  const categories = Object.keys(categoryMap).map((cat, index) => ({
    name: cat,
    amount: categoryMap[cat],
    percentage: totalExpense > 0 ? (categoryMap[cat] / totalExpense) * 100 : 0,
    color: getCategoryColor(index)
  })).sort((a, b) => b.amount - a.amount);

  // Helper to get distinct modern colors
  function getCategoryColor(index: number): string {
    const colors = [
      '#f43f5e', // Rose
      '#fb923c', // Orange
      '#f59e0b', // Amber
      '#eab308', // Yellow
      '#84cc16', // Lime
      '#10b981', // Emerald
      '#06b6d4', // Cyan
      '#3b82f6', // Blue
      '#6366f1', // Indigo
      '#8b5cf6', // Violet
      '#d946ef', // Magenta
      '#ec4899', // Pink
      '#64748b', // Slate
    ];
    return colors[index % colors.length];
  }

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' })
      .format(val)
      .replace('LAK', '₭');
  };

  // SVG Donut calculations
  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="card" style={{ height: '100%' }}>
      <h3 className="card-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-expense)' }}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
        ສັດສ່ວນລາຍຈ່າຍຕາມໝວດໝູ່
      </h3>

      {expenseTransactions.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <p className="empty-state-icon">📊</p>
          <p>ຍັງບໍ່ມີຂໍ້ມູນລາຍຈ່າຍເພື່ອສະແດງກຣາຟ</p>
        </div>
      ) : (
        <div className="chart-container">
          <div className="chart-svg-wrapper">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={strokeWidth}
              />
              {/* Segments */}
              {categories.map((cat, idx) => {
                if (cat.amount === 0) return null;
                const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = circumference - currentOffset;
                currentOffset += (cat.percentage / 100) * circumference;

                return (
                  <circle
                    key={idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className="chart-pie-segment"
                  />
                );
              })}
              {/* Centered Total */}
              <text x="50%" y="46%" textAnchor="middle" className="text-center-lbl">
                ລາຍຈ່າຍລວມ
              </text>
              <text x="50%" y="60%" textAnchor="middle" className="text-center-val" style={{ fontSize: '14px' }}>
                {formatCurrency(totalExpense)}
              </text>
            </svg>
          </div>

          <div className="chart-details">
            {categories.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="chart-legend-item">
                <div className="chart-label-text">
                  <span className="chart-legend-color" style={{ backgroundColor: cat.color }}></span>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                    {cat.name}
                  </span>
                </div>
                <div className="chart-value-text">
                  <span>{formatCurrency(cat.amount)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                    ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
            {categories.length > 5 && (
              <div className="chart-legend-item" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <span className="chart-label-text" style={{ color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '1rem' }}>
                  ແລະ ອື່ນໆອີກ {categories.length - 5} ໝວດໝູ່...
                </span>
                <span className="chart-value-text" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(categories.slice(5).reduce((sum, c) => sum + c.amount, 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

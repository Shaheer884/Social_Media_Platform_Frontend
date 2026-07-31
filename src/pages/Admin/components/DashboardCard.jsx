import React from 'react';

const DashboardCard = ({ title, value, icon, color = '#8b5cf6' }) => {
  return (
    <div className="admin-card">
      <div className="admin-card-info">
        <span className="admin-card-title">{title}</span>
        <span className="admin-card-value">{value}</span>
      </div>
      <div 
        className="admin-card-icon" 
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        {icon}
      </div>
    </div>
  );
};

export default DashboardCard;

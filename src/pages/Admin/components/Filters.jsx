import React from 'react';

const Filters = ({ value, onChange, options = [], label = 'All' }) => {
  return (
    <select 
      className="admin-filter-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default Filters;

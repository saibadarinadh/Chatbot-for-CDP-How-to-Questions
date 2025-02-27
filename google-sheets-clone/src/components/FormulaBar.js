// src/components/FormulaBar.js

'use client';

import React from 'react';

const FormulaBar = ({ value, onChange, onSubmit, selectedCell }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSubmit();
      e.preventDefault();
    }
  };
  
  return (
    <div 
      className="formula-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px 10px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #ddd',
      }}
    >
      <div 
        className="cell-address"
        style={{
          fontWeight: 'bold',
          width: '50px',
          marginRight: '10px',
        }}
      >
        {selectedCell || ''}
      </div>
      <span 
        className="formula-icon"
        style={{
          fontWeight: 'bold',
          marginRight: '10px',
        }}
      >
        fx
      </span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter formula or value"
        style={{
          flexGrow: 1,
          padding: '5px',
          border: '1px solid #ddd',
          borderRadius: '3px',
        }}
      />
      
    </div>
  );
};

export default FormulaBar;
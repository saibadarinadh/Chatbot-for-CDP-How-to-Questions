// src/components/HeaderCell.js

'use client';

import React, { useState } from 'react';

export const ColumnHeader = ({ column, width, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, width + diff);
      onResize(column, newWidth);
      setStartX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="column-header" style={{ width: `${width}px` }}>
      {column}
      <div className="resize-handle" onMouseDown={handleResizeStart} />
    </div>
  );
};

export const RowHeader = ({ row, height, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(height);
  
  const handleResizeStart = (e) => {
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
    
    // Add global event listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    
    // Prevent text selection during resize
    e.preventDefault();
  };
  
  const handleResizeMove = (e) => {
    if (!isResizing) return;
    
    const newHeight = Math.max(15, startHeight + (e.clientY - startY));
    onResize(row, newHeight);
  };
  
  const handleResizeEnd = () => {
    setIsResizing(false);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };
  
  return (
    <div 
      className="row-header"
      style={{
        width: '30px',
        height: `${height}px`,
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #ddd',
        borderBottom: '1px solid #ddd',
        textAlign: 'center',
        fontWeight: 'bold',
        position: 'relative',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {row}
      <div
        className="resize-handle"
        style={{
          position: 'absolute',
          left: '0',
          bottom: '0',
          width: '100%',
          height: '5px',
          cursor: 'row-resize',
          zIndex: 10,
        }}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
};

export const CornerHeader = () => {
  return (
    <div 
      className="corner-header"
      style={{
        width: '30px',
        height: '22px',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #ddd',
        borderBottom: '1px solid #ddd',
      }}
    />
  );
};
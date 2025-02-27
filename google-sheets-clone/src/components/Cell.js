'use client';

import React, { useState, useRef, useEffect } from 'react';

const Cell = ({ 
  cellId, 
  cell = { value: '', style: {}, formula: '' },
  isSelected, 
  isInRange, 
  isEditing, 
  onCellClick, 
  onCellDoubleClick, 
  onCellValueChange,
  onMouseDown,
  onColumnResize,
  width
}) => {
  const [editValue, setEditValue] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (isSelected) {
      setEditValue(cell.formula || String(cell.value || ''));
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isSelected, cell]);

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setStartX(e.clientX);
    
    const handleResizeMove = (e) => {
      if (!isResizing) return;
      const diff = e.clientX - startX;
      const column = cellId.match(/[A-Z]+/)[0];
      const newWidth = Math.max(50, width + diff);
      onColumnResize(column, newWidth);
    };
    
    const handleResizeEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  const handleChange = (e) => {
    setEditValue(e.target.value);
    onCellValueChange(cellId, e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      onCellValueChange(cellId, editValue);
      const nextCellId = e.key === 'Tab' 
        ? `${String.fromCharCode(cellId.charCodeAt(0) + 1)}${cellId.slice(1)}`
        : `${cellId.charAt(0)}${parseInt(cellId.slice(1)) + 1}`;
      onCellClick(nextCellId);
    }
  };

  return (
    <div
      className={`cell ${isSelected ? 'selected' : ''} ${isInRange ? 'in-range' : ''}`}
      onClick={() => onCellClick(cellId)}
      style={{
        width: `${width}px`,
        fontWeight: cell.style?.bold ? 'bold' : 'normal',
        fontStyle: cell.style?.italic ? 'italic' : 'normal',
        fontSize: `${cell.style?.fontSize || 14}px`,
        color: cell.style?.color || '#000000',
        backgroundColor: cell.style?.backgroundColor || 'white'
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={isSelected ? editValue : (cell.value || '')}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="cell-input"
        style={{
          fontWeight: 'inherit',
          fontStyle: 'inherit',
          fontSize: 'inherit',
          color: 'inherit'
        }}
        readOnly={!isSelected}
      />
      {isSelected && (
        <div 
          className="cell-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
};

export default Cell;
'use client';

import React from 'react';

const Toolbar = ({ 
  selectedCellStyle = {}, 
  onApplyStyle, 
  onApplyDataQualityFunction, 
  onAddRow, 
  onAddColumn, 
  onDeleteRow, 
  onDeleteColumn,
  onSaveSpreadsheet,
  onFileUpload  // Add this new prop
}) => {
  return (
    <div className="toolbar">
      <div className="formatting-group">
        <button
          className={`toolbar-button ${selectedCellStyle?.bold ? 'active' : ''}`}
          onClick={() => onApplyStyle('bold', !selectedCellStyle?.bold)}
          title="Bold"
        >
          B
        </button>
        <button
        
        className={`toolbar-button ${selectedCellStyle?.italic ? 'active' : ''}`} // Add active class check
        onClick={() => onApplyStyle('italic', !selectedCellStyle?.italic)}        // Add toggle functionality
        title="Italic"
        >
          <em>I</em>
        </button>
        <select
          onChange={(e) => onApplyStyle('fontSize', parseInt(e.target.value))}
          className="toolbar-select"
        >
          {[10, 12, 14, 16, 18, 20, 24].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <input
          type="color"
          onChange={(e) => onApplyStyle('color', e.target.value)}
          className="toolbar-color"
          title="Text Color"
        />
      </div>

      <div className="toolbar-divider" />

      {/* Mathematical Functions */}
      <div className="math-functions-group">
        <button
          onClick={() => onApplyDataQualityFunction('=SUM()')}
          className="toolbar-button"
          title="Sum"
        >
          Σ
        </button>
        <button
          onClick={() => onApplyDataQualityFunction('=AVERAGE()')}
          className="toolbar-button"
          title="Average"
        >
          AVG
        </button>
        <button
          onClick={() => onApplyDataQualityFunction('=MAX()')}
          className="toolbar-button"
          title="Maximum"
        >
          MAX
        </button>
        <button
          onClick={() => onApplyDataQualityFunction('=MIN()')}
          className="toolbar-button"
          title="Minimum"
        >
          MIN
        </button>
        <button
          onClick={() => onApplyDataQualityFunction('=COUNT()')}
          className="toolbar-button"
          title="Count Numbers"
        >
          #
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Data Quality Functions */}
      <div className="data-quality-group">
        <button
          onClick={() => onApplyDataQualityFunction('TRIM')}
          className="toolbar-button"
          title="Trim Whitespace"
        >
          Trim
        </button>
        <button
          onClick={() => onApplyDataQualityFunction('UPPER')}
          className="toolbar-button"
          title="Uppercase"
        >
          ABC
        </button>
        <button
          onClick={() => onApplyDataQualityFunction('LOWER')}
          className="toolbar-button"
          title="Lowercase"
        >
          abc
        </button>
        <button
          onClick={() => onApplyDataQualityFunction('REMOVE_DUPLICATES')}
          className="toolbar-button"
          title="Remove Duplicates"
        >
          Unique
        </button>
        <button
          onClick={() => onApplyDataQualityFunction('FIND_AND_REPLACE')}
          className="toolbar-button"
          title="Find and Replace"
        >
          Find
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Row/Column Operations */}
      <div className="structure-group">
        <button
          onClick={onAddRow}
          className="toolbar-button"
          title="Add Row"
        >
          + Row
        </button>
        <button
          onClick={onAddColumn}
          className="toolbar-button"
          title="Add Column"
        >
          + Col
        </button>
        <button
          onClick={onDeleteRow}
          className="toolbar-button"
          title="Delete Row"
        >
          - Row
        </button>
        <button
          onClick={onDeleteColumn}
          className="toolbar-button"
          title="Delete Column"
        >
          - Col
        </button>
      </div>

      <div className="toolbar-divider" />
      
      {/* Update file operations group */}
      <div className="file-operations-group">
        <input
          type="file"
          id="file-upload"
          accept=".xlsx,.xls"
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => document.getElementById('file-upload').click()}
          className="toolbar-button"
          title="Upload Excel"
        >
          Upload
        </button>
        <button
          onClick={onSaveSpreadsheet}
          className="toolbar-button"
          title="Save as Excel"
        >
          Save
        </button>
      </div>
    </div>
  );
};

const applyDataQualityFunction = (functionName) => {
  if (!state.selectedRange || state.selectedRange.length === 0) return;
  
  if (functionName.startsWith('=')) {
    const range = state.selectedRange.length === 1 
      ? state.selectedRange[0] 
      : `${state.selectedRange[0]}:${state.selectedRange[state.selectedRange.length - 1]}`;
    
    const formula = functionName.replace('()', `(${range})`);
    commitCellEdit(state.selectedCell, formula);
  } else {
    const newData = dataQualityFunctions[functionName](
      state.data,
      state.selectedRange
    );
    
    setState(prev => ({
      ...prev,
      data: newData
    }));
  }
};

const handleCellClick = (cellId) => {
  setState((prevState) => ({
    ...prevState,
    selectedCell: cellId,
    selectedRange: [cellId], // Ensure selectedRange is always an array
    formulaBarValue: prevState.data[cellId]?.value || '',
  }));
};

export default Toolbar;

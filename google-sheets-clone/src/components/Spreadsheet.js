// src/components/Spreadsheet.js

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Cell from './Cell';
import FormulaBar from './FormulaBar';
import Toolbar from './Toolbar';
import { ColumnHeader, RowHeader, CornerHeader } from './HeaderCell';
import FindReplaceDialog from './FindReplaceDialog';
import {
  createInitialState,
  getCellId,
  parseCellId,
  parseRange,
  groupRangeByRows
} from '../utils/helpers';
import {
  evaluateFormula,
  updateCellDependencies,
  updateDependentCells,
  dataQualityFunctions
} from '../utils/spreadsheetFunctions';
import * as XLSX from 'xlsx';

const Spreadsheet = () => {
  const [state, setState] = useState(() => createInitialState());
  const [editingCell, setEditingCell] = useState(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [showFindReplaceDialog, setShowFindReplaceDialog] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const spreadsheetRef = useRef(null);

  useEffect(() => {
    if (state.selectedCell) {
      const cell = state.data[state.selectedCell];
      if (cell) {
        setFormulaBarValue(cell.formula || (cell.value !== null ? String(cell.value) : ''));
      }
    } else {
      setFormulaBarValue('');
    }
  }, [state.selectedCell, state.data]);

  // Function to handle cell clicks
  const handleCellClick = (cellId) => {
    if (editingCell && editingCell !== cellId) {
      commitCellEdit(editingCell, formulaBarValue);
    }
    
    setEditingCell(cellId);
    setState(prev => ({
      ...prev,
      selectedCell: cellId,
      selectedRange: [cellId]
    }));

    // Update formula bar with cell value
    const cell = state.data[cellId];
    if (cell) {
      setFormulaBarValue(cell.formula || String(cell.value || ''));
    } else {
      setFormulaBarValue('');
    }
  };

  // Function to handle double clicks (start editing)
  const handleCellDoubleClick = (cellId) => {
    setEditingCell(cellId);
    setState(prev => ({
      ...prev,
      selectedCell: cellId,
      selectedRange: [cellId]
    }));
  };

  // Function to update cell value
  const handleCellValueChange = (cellId, value) => {
    setFormulaBarValue(value);
    commitCellEdit(cellId, value);
  };

  // Function to commit cell edits
  const commitCellEdit = (cellId, value) => {
    setState(prev => {
      const newData = { ...prev.data };
      let newValue = value;
      let formula = '';

      // Check if the value is a formula
      if (value.toString().startsWith('=')) {
        formula = value;
        try {
          newValue = evaluateFormula(value, prev.data);
        } catch (error) {
          newValue = '#ERROR!';
        }
      }

      newData[cellId] = {
        ...newData[cellId],
        value: newValue,
        formula: formula,
        style: newData[cellId]?.style || {}
      };

      return {
        ...prev,
        data: newData
      };
    });

    setEditingCell(null);
  };

  // Handler for formula bar changes
  const handleFormulaBarChange = (value) => {
    setFormulaBarValue(value);
    if (state.selectedCell) {
      commitCellEdit(state.selectedCell, value);
    }
  };

  // Handler for formula bar submission
  const handleFormulaBarSubmit = () => {
    if (state.selectedCell) {
      commitCellEdit(state.selectedCell, formulaBarValue);
    }
  };

  // Handler for cell selection with mouse
  const handleCellMouseDown = (cellId, e) => {
    // If shift is pressed, extend the current selection
    if (e.shiftKey && state.selectedCell) {
      const selectionEndCellId = cellId;
      
      // Parse coordinates
      const startCoords = parseCellId(state.selectedCell);
      const endCoords = parseCellId(selectionEndCellId);
      
      // Get min/max ranges
      const startRow = Math.min(startCoords.row, endCoords.row);
      const endRow = Math.max(startCoords.row, endCoords.row);
      const startCol = Math.min(startCoords.col, endCoords.col);
      const endCol = Math.max(startCoords.col, endCoords.col);
      
      // Generate all cell IDs in the range
      const selectedRange = [];
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          selectedRange.push(getCellId(row, col));
        }
      }
      
      setState((prevState) => ({
        ...prevState,
        selectedRange,
      }));
    } else {
      // Start a new selection
      setSelectionStart(cellId);
      setState((prevState) => ({
        ...prevState,
        selectedCell: cellId,
        selectedRange: [cellId],
      }));
    }
    
    // Add event listeners for drag selection
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handler for mouse move (for selection dragging)
  const handleMouseMove = (e) => {
    if (!selectionStart) return;
    
    // Get the element under the cursor
    const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);
    const cellElement = elementsUnderCursor.find(el => el.classList.contains('cell'));
    
    if (cellElement) {
      const cellId = cellElement.getAttribute('data-cell-id');
      if (cellId) {
        // Update the selection
        const startCoords = parseCellId(selectionStart);
        const currentCoords = parseCellId(cellId);
        
        // Get min/max ranges
        const startRow = Math.min(startCoords.row, currentCoords.row);
        const endRow = Math.max(startCoords.row, currentCoords.row);
        const startCol = Math.min(startCoords.col, currentCoords.col);
        const endCol = Math.max(startCoords.col, currentCoords.col);
        
        // Generate all cell IDs in the range
        const selectedRange = [];
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            selectedRange.push(getCellId(row, col));
          }
        }
        
        setState((prevState) => ({
          ...prevState,
          selectedRange,
        }));
      }
    }
  };

  // Handler for mouse up (end selection)
  const handleMouseUp = () => {
    setSelectionStart(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Add this function to handle cell resizing
  const handleCellResize = (cellId, newWidth) => {
    const column = cellId.match(/[A-Z]+/)[0];
    setState(prev => ({
      ...prev,
      columnWidths: {
        ...prev.columnWidths,
        [column]: newWidth
      }
    }));
  };

  // Update the handleApplyStyle function
  const handleApplyStyle = (styleProperty, value) => {
    if (!state.selectedRange || state.selectedRange.length === 0) return;
    
    setState(prev => {
      const newData = { ...prev.data };
      state.selectedRange.forEach(cellId => {
        const currentCell = newData[cellId] || { value: '', style: {}, formula: '' };
        const currentStyle = currentCell.style || {};
        
        // Toggle boolean styles like bold and italic
        const newValue = styleProperty === 'bold' || styleProperty === 'italic' 
          ? !currentStyle[styleProperty]
          : value;
        
        newData[cellId] = {
          ...currentCell,
          style: {
            ...currentStyle,
            [styleProperty]: newValue,
          },
        };
      });
      
      return { ...prev, data: newData };
    });
  };

  // Handler for column resize
  const handleColumnResize = (column, newWidth) => {
  setState(prev => ({
    ...prev,
    columnWidths: {
      ...prev.columnWidths,
      [column]: newWidth
    }
  }));
};

  // Handler for row resize
  const handleRowResize = (row, newHeight) => {
    setState((prevState) => ({
      ...prevState,
      rowHeights: {
        ...prevState.rowHeights,
        [row]: newHeight,
      },
    }));
  };

  // Handler for find and replace
  const handleFindReplace = (findText, replaceText) => {
    if (!state.selectedRange || state.selectedRange.length === 0) return;
    
    const newData = dataQualityFunctions.FIND_AND_REPLACE(
      state.data,
      state.selectedRange,
      findText,
      replaceText
    );
    
    setState((prevState) => ({
      ...prevState,
      data: newData,
    }));
    
    setShowFindReplaceDialog(false);
  };

  // Helper function to handle data quality function application
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

  const handleApplyDataQualityFunction = (functionName) => {
    if (!state.selectedRange || state.selectedRange.length === 0) return;

    if (functionName === 'TRIM') {
      const newData = dataQualityFunctions.TRIM(state.data, state.selectedRange);
      setState(prev => ({
        ...prev,
        data: newData
      }));
    }
    // ...existing code for other functions...
  };

  // Handler for adding rows
  const handleAddRow = () => {
    if (!state.selectedCell) return;
    
    const { row } = parseCellId(state.selectedCell);
    const targetRow = row + 1; // Insert after the selected row
    
    setState(prev => {
      const newData = { ...prev.data };
      
      // Shift all rows down from the insertion point
      for (let r = prev.rowCount; r >= targetRow; r--) {
        for (let col = 0; col < prev.columnCount; col++) {
          const colLetter = String.fromCharCode(65 + col);
          const currentCellId = `${colLetter}${r}`;
          const prevCellId = `${colLetter}${r - 1}`;
          newData[`${colLetter}${r + 1}`] = newData[currentCellId] || { value: '', formula: '', style: {} };
        }
      }
      
      // Add empty cells for the new row
      for (let col = 0; col < prev.columnCount; col++) {
        const colLetter = String.fromCharCode(65 + col);
        newData[`${colLetter}${targetRow}`] = {
          value: '',
          formula: '',
          style: {},
        };
      }

      return {
        ...prev,
        data: newData,
        rowCount: prev.rowCount + 1,
        rowHeights: {
          ...prev.rowHeights,
          [targetRow]: 25
        }
      };
    });
  };

  // Handler for adding columns
  const handleAddColumn = () => {
    if (!state.selectedCell) return;
    
    const { col } = parseCellId(state.selectedCell);
    const targetCol = col + 1; // Insert after the selected column
    
    setState(prev => {
      const newData = { ...prev.data };
      
      // Shift all columns right from the insertion point
      for (let c = prev.columnCount - 1; c >= targetCol; c--) {
        const currentColLetter = String.fromCharCode(65 + c);
        const nextColLetter = String.fromCharCode(65 + c + 1);
        
        for (let row = 1; row <= prev.rowCount; row++) {
          newData[`${nextColLetter}${row}`] = newData[`${currentColLetter}${row}`] || { value: '', formula: '', style: {} };
        }
      }
      
      // Add empty cells for the new column
      const newColLetter = String.fromCharCode(65 + targetCol);
      for (let row = 1; row <= prev.rowCount; row++) {
        newData[`${newColLetter}${row}`] = {
          value: '',
          formula: '',
          style: {},
        };
      }

      return {
        ...prev,
        data: newData,
        columnCount: prev.columnCount + 1,
        columnWidths: {
          ...prev.columnWidths,
          [newColLetter]: 100
        }
      };
    });
  };

  // Handler for deleting rows
  const handleDeleteRow = () => {
    if (!state.selectedCell) return;
    
    const { row } = parseCellId(state.selectedCell);
    const targetRow = row + 1;
    
    setState(prev => {
      const newData = { ...prev.data };
      
      // Shift all rows up
      for (let r = targetRow; r < prev.rowCount; r++) {
        for (let col = 0; col < prev.columnCount; col++) {
          const colLetter = String.fromCharCode(65 + col);
          const currentCellId = `${colLetter}${r}`;
          const nextCellId = `${colLetter}${r + 1}`;
          newData[currentCellId] = newData[nextCellId] || { value: '', formula: '', style: {} };
        }
      }
      
      // Remove the last row
      for (let col = 0; col < prev.columnCount; col++) {
        const colLetter = String.fromCharCode(65 + col);
        delete newData[`${colLetter}${prev.rowCount}`];
      }
      
      return {
        ...prev,
        data: newData,
        rowCount: prev.rowCount - 1,
        selectedCell: null,
        selectedRange: null
      };
    });
  };

  // Handler for deleting columns
  const handleDeleteColumn = () => {
    if (!state.selectedCell) return;

    const { col } = parseCellId(state.selectedCell);
    const targetCol = col;
    const colLetterToDelete = String.fromCharCode(65 + targetCol);

    setState(prev => {
      const newData = { ...prev.data };

      // Shift all columns left from the deletion point
      for (let c = targetCol; c < prev.columnCount - 1; c++) {
        const currentColLetter = String.fromCharCode(65 + c);
        const nextColLetter = String.fromCharCode(65 + c + 1);

        for (let row = 1; row <= prev.rowCount; row++) {
          const currentCellId = `${currentColLetter}${row}`;
          const nextCellId = `${nextColLetter}${row}`;
          newData[currentCellId] = newData[nextCellId] || { value: '', formula: '', style: {} };
        }
      }

      // Remove the last column
      const lastColLetter = String.fromCharCode(65 + prev.columnCount - 1);
      for (let row = 1; row <= prev.rowCount; row++) {
        delete newData[`${lastColLetter}${row}`];
      }

      // Update column widths
      const newColumnWidths = { ...prev.columnWidths };
      delete newColumnWidths[lastColLetter];

      return {
        ...prev,
        data: newData,
        columnCount: prev.columnCount - 1,
        selectedCell: null,
        selectedRange: null,
        columnWidths: newColumnWidths
      };
    });
  };

  const getSelectedCellStyle = () => {
    const selectedCell = state.selectedCell;
    if (!selectedCell || !state.data[selectedCell]) {
      return {
        bold: false,
        italic: false,
        fontSize: 14,
        color: '#000000',
        backgroundColor: '#ffffff'
      };
    }
    return state.data[selectedCell].style || {};
  };

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < state.rowCount; i++) {
      const cells = [];
      for (let j = 0; j < state.columnCount; j++) {
        const column = String.fromCharCode(65 + j);
        const cellId = `${column}${i + 1}`;
        cells.push(
          <Cell
            key={cellId}
            cellId={cellId}
            cell={state.data[cellId]}
            isSelected={state.selectedCell === cellId}
            isInRange={state.selectedRange?.includes(cellId)}
            isEditing={editingCell === cellId}
            onCellClick={handleCellClick}
            onCellDoubleClick={handleCellDoubleClick}
            onCellValueChange={handleCellValueChange}
            onColumnResize={handleColumnResize}
            width={state.columnWidths[column] || 100}
          />
        );
      }
      rows.push(
        <div key={i} className="row">
          <RowHeader row={i + 1} />
          {cells}
        </div>
      );
    }
    return rows;
  };

  // Add this function inside your Spreadsheet component
  const handleSaveSpreadsheet = () => {
    // Create a data array for the worksheet
    const wsData = [];
    
    // Initialize the array with empty rows and columns
    for (let i = 0; i < state.rowCount; i++) {
      wsData[i] = [];
      for (let j = 0; j < state.columnCount; j++) {
        const colLetter = String.fromCharCode(65 + j);
        const cellId = `${colLetter}${i + 1}`;
        const cell = state.data[cellId];
        
        // Add cell value or empty string if cell doesn't exist
        wsData[i][j] = cell ? cell.value : '';
      }
    }

    // Create worksheet from the data array
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Add styling information
    Object.entries(state.data).forEach(([cellId, cell]) => {
      if (cell.style && Object.keys(cell.style).length > 0) {
        const match = cellId.match(/([A-Z]+)(\d+)/);
        if (match) {
          const col = match[1];
          const row = parseInt(match[2]) - 1;
          const cellRef = XLSX.utils.encode_cell({ c: XLSX.utils.decode_col(col), r: row });
          
          if (!worksheet[cellRef]) worksheet[cellRef] = {};
          worksheet[cellRef].s = convertStyleToXLSX(cell.style);
        }
      }
    });

    // Set column widths
    worksheet['!cols'] = Array.from({ length: state.columnCount }).map((_, i) => ({
      wch: (state.columnWidths[String.fromCharCode(65 + i)] || 100) / 8
    }));

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Save file
    XLSX.writeFile(workbook, 'spreadsheet.xlsx');
  };

  // Add this helper function to convert styles
  const convertStyleToXLSX = (style) => {
    if (!style) return {};
    
    return {
      font: {
        bold: style.bold || false,
        italic: style.italic || false,
        sz: style.fontSize || 11,
        color: { rgb: style.color?.replace('#', '') || '000000' }
      },
      fill: style.backgroundColor ? {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { rgb: style.backgroundColor.replace('#', '') }
      } : undefined
    };
  };

  // Add this function inside your Spreadsheet component
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get the first worksheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert the worksheet to an array of arrays
      const wsData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Calculate new dimensions
      const rowCount = wsData.length;
      const columnCount = Math.max(...wsData.map(row => row.length));
      
      // Convert the data to our spreadsheet format
      const newData = {};
      wsData.forEach((row, i) => {
        row.forEach((cell, j) => {
          const colLetter = String.fromCharCode(65 + j);
          const cellId = `${colLetter}${i + 1}`;
          
          // Get cell style if available
          const xlsxCell = worksheet[XLSX.utils.encode_cell({ r: i, c: j })];
          const style = xlsxCell?.s ? convertXLSXStyle(xlsxCell.s) : {};
          
          newData[cellId] = {
            value: cell,
            formula: '',
            style
          };
        });
      });
  
      // Update state with new data
      setState(prev => ({
        ...prev,
        data: newData,
        rowCount: Math.max(rowCount, prev.rowCount),
        columnCount: Math.max(columnCount, prev.columnCount)
      }));
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // Add this helper function to convert XLSX styles to our format
  const convertXLSXStyle = (xlsxStyle) => {
    const style = {};
    
    if (xlsxStyle.font) {
      if (xlsxStyle.font.bold) style.bold = true;
      if (xlsxStyle.font.italic) style.italic = true;
      if (xlsxStyle.font.sz) style.fontSize = xlsxStyle.font.sz;
      if (xlsxStyle.font.color?.rgb) style.color = `#${xlsxStyle.font.color.rgb}`;
    }
    
    if (xlsxStyle.fill?.fgColor?.rgb) {
      style.backgroundColor = `#${xlsxStyle.fill.fgColor.rgb}`;
    }
    
    return style;
  };

  return (
    <div className="spreadsheet-container">
      <Toolbar
        selectedCellStyle={getSelectedCellStyle()}
        onApplyStyle={handleApplyStyle}
        onApplyDataQualityFunction={applyDataQualityFunction}
        onAddRow={handleAddRow}
        onAddColumn={handleAddColumn}
        onDeleteRow={handleDeleteRow}
        onDeleteColumn={handleDeleteColumn}
        onSaveSpreadsheet={handleSaveSpreadsheet} // Add this line
        onFileUpload={handleFileUpload}  // Add this line
      />
      <FormulaBar
        value={formulaBarValue}
        onChange={handleFormulaBarChange}
        onSubmit={handleFormulaBarSubmit}
        selectedCell={state.selectedCell}
      />
      <div className="grid-container" ref={spreadsheetRef}>
        <div className="spreadsheet-grid">
          <div className="header-row">
            <CornerHeader />
            {Array.from({ length: state.columnCount }).map((_, i) => (
              <ColumnHeader
                key={i}
                column={String.fromCharCode(65 + i)}
                width={state.columnWidths[String.fromCharCode(65 + i)] || 100}
                onResize={handleColumnResize}
              />
            ))}
          </div>
          {renderGrid()}
        </div>
      </div>
    </div>
  );
};

export default Spreadsheet;
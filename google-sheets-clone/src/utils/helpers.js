// src/utils/helpers.js

// Create an empty cell with default properties
export const createEmptyCell = () => ({
    value: null,
    formula: '',
    style: {
      bold: false,
      italic: false,
      fontSize: 14,
      color: '#000000',
      backgroundColor: '#ffffff',
    },
    dependencies: [],
    dependents: [],
  });
  
// Create initial spreadsheet state
export const createInitialState = (rows = 100, cols = 26) => {
  return {
    data: {},
    selectedCell: null,
    selectedRange: [], // Initialize as empty array instead of null
    rowCount: rows,
    columnCount: cols,
    columnWidths: {},
    rowHeights: {}
  };
};

// Function to get a cell ID from row and column indices
export const getCellId = (row, col) => {
  const colLetter = String.fromCharCode(65 + col);
  return `${colLetter}${row + 1}`;
};

// Function to parse a cell ID into row and column indices
export const parseCellId = (cellId) => {
  const match = cellId.match(/([A-Z]+)(\d+)/);
  if (!match) {
    throw new Error(`Invalid cell ID: ${cellId}`);
  }
  
  const colStr = match[1];
  const rowStr = match[2];
  
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  
  return {
    row: parseInt(rowStr, 10) - 1,
    col: col - 1,
  };
};

// Helper function to parse a range like "A1:B5" into an array of cell ids
export const parseRange = (rangeStr) => {
  const [start, end] = rangeStr.split(':');
  const startCoords = parseCellId(start);
  const endCoords = parseCellId(end);
  
  const startRow = Math.min(startCoords.row, endCoords.row);
  const endRow = Math.max(startCoords.row, endCoords.row);
  const startCol = Math.min(startCoords.col, endCoords.col);
  const endCol = Math.max(startCoords.col, endCoords.col);
  
  const cells = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      cells.push(getCellId(row, col));
    }
  }
  
  return cells;
};

// Group a range of cells by rows (for operations like REMOVE_DUPLICATES)
export const groupRangeByRows = (cellIds) => {
  // Find row boundaries
  const { minRow, maxRow } = cellIds.reduce((acc, cellId) => {
    const { row } = parseCellId(cellId);
    return {
      minRow: Math.min(acc.minRow, row),
      maxRow: Math.max(acc.maxRow, row),
    };
  }, { minRow: Infinity, maxRow: -Infinity });
  
  // Group cells by row
  const rows = [];
  for (let row = minRow; row <= maxRow; row++) {
    const rowCells = cellIds.filter(cellId => {
      const { row: cellRow } = parseCellId(cellId);
      return cellRow === row;
    }).sort((a, b) => {
      // Sort by column
      const { col: colA } = parseCellId(a);
      const { col: colB } = parseCellId(b);
      return colA - colB;
    });
    
    if (rowCells.length > 0) {
      rows.push(rowCells);
    }
  }
  
  return rows;
};
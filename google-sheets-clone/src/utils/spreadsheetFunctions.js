// src/utils/spreadsheetFunctions.js

import { parseRange } from './helpers';

// Helper function to extract numeric values from a range of cells
export const getNumericValues = (data, cellIds) => {
  return cellIds
    .map(id => data[id]?.value)
    .filter(value => typeof value === 'number');
};

// Mathematical Functions
export const functions = {
  // SUM: Calculates the sum of a range of cells
  SUM: (data, cellIds) => {
    const numbers = getNumericValues(data, cellIds);
    return numbers.reduce((sum, value) => sum + value, 0);
  },

  // AVERAGE: Calculates the average of a range of cells
  AVERAGE: (data, cellIds) => {
    const numbers = getNumericValues(data, cellIds);
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  },

  // MAX: Returns the maximum value from a range of cells
  MAX: (data, cellIds) => {
    const numbers = getNumericValues(data, cellIds);
    if (numbers.length === 0) return 0;
    return Math.max(...numbers);
  },

  // MIN: Returns the minimum value from a range of cells
  MIN: (data, cellIds) => {
    const numbers = getNumericValues(data, cellIds);
    if (numbers.length === 0) return 0;
    return Math.min(...numbers);
  },

  // COUNT: Counts the number of cells containing numerical values in a range
  COUNT: (data, cellIds) => {
    return getNumericValues(data, cellIds).length;
  }
};

// Data Quality Functions
export const dataQualityFunctions = {
  TRIM: (data, range) => {
    // Create a deep copy of the data
    const newData = { ...data };
    
    // Guard clause for invalid range
    if (!range || range.length === 0) return newData;

    // Process each cell in the range
    range.forEach(cellId => {
      if (newData[cellId] && newData[cellId].value != null) {
        const cellValue = String(newData[cellId].value); // Convert to string
        newData[cellId] = {
          ...newData[cellId],
          value: cellValue.trim()
        };
      }
    });

    return newData;
  },

  UPPER: (data, range) => {
    const newData = { ...data };
    range.forEach(cellId => {
      const cell = newData[cellId];
      if (cell && typeof cell.value === 'string') {
        newData[cellId] = {
          ...cell,
          value: cell.value.toUpperCase()
        };
      }
    });
    return newData;
  },

  LOWER: (data, range) => {
    const newData = { ...data };
    range.forEach(cellId => {
      const cell = newData[cellId];
      if (cell && typeof cell.value === 'string') {
        newData[cellId] = {
          ...cell,
          value: cell.value.toLowerCase()
        };
      }
    });
    return newData;
  },

  // REMOVE_DUPLICATES: Removes duplicate rows from a selected range
  REMOVE_DUPLICATES: (data, range) => {
    if (!range || !Array.isArray(range)) return data;
    const seen = new Set();
    const uniqueValues = {};
    
    range.forEach(cellId => {
      const value = data[cellId]?.value;
      if (!seen.has(value)) {
        seen.add(value);
        uniqueValues[cellId] = data[cellId];
      }
    });
    
    return uniqueValues;
  },

  // FIND_AND_REPLACE: Allows users to find and replace specific text within a range of cells
  FIND_AND_REPLACE: (data, cellIds, find, replace) => {
    const newData = { ...data };
    
    for (const cellId of cellIds) {
      const cell = newData[cellId];
      if (cell && typeof cell.value === 'string') {
        newData[cellId] = {
          ...cell,
          value: cell.value.replaceAll(find, replace)
        };
      }
    }
    
    return newData;
  }
};

// Parse and evaluate cell references in a formula
const parseCellReferences = (formula, data) => {
  // Check for cell ranges like "A1:A5"
  const rangeRegex = /([A-Z]+\d+):([A-Z]+\d+)/g;
  let match;
  let processedFormula = formula;
  
  while ((match = rangeRegex.exec(formula)) !== null) {
    const range = match[0];
    const cells = parseRange(range);
    // Replace with the actual cell references
    processedFormula = processedFormula.replace(range, cells.join(','));
  }
  
  return processedFormula;
};

// Parse a cell reference from a string like "A1" to the cell's value
const getCellValueFromRef = (cellRef, data) => {
  const cell = data[cellRef];
  if (!cell || cell.value === null || cell.value === undefined) {
    return 0;
  }
  return cell.value;
};

// Helper function to parse a cell like "A1" into row and column indices
const parseRangeCell = (cell) => {
  const match = cell.match(/([A-Z]+)(\d+)/);
  if (!match) {
    throw new Error(`Invalid cell reference: ${cell}`);
  }
  
  const colStr = match[1];
  const rowStr = match[2];
  
  // Convert column letters to index (A=0, B=1, ...)
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  
  return {
    row: parseInt(rowStr, 10) - 1,
    col: col - 1,
  };
};

// Formula evaluation
export const evaluateFormula = (formula, data) => {
  if (!formula.startsWith('=')) return formula;

  const formulaContent = formula.substring(1).trim().toUpperCase();
  const functionMatch = formulaContent.match(/^([A-Z]+)\((.*)\)$/);

  if (!functionMatch) return '#ERROR!';

  const [_, functionName, params] = functionMatch;
  const range = params.split(':');
  
  // Get all values in the range
  const values = getCellValuesFromRange(range[0], range[1] || range[0], data)
    .map(v => Number(v))
    .filter(v => !isNaN(v));

  if (values.length === 0) return 0;

  switch (functionName) {
    case 'SUM':
      return values.reduce((sum, val) => sum + val, 0);
    case 'AVERAGE':
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    case 'MAX':
      return Math.max(...values);
    case 'MIN':
      return Math.min(...values);
    case 'COUNT':
      return values.length;
    default:
      return '#ERROR!';
  }
};

// Helper function to get cell values from a range
const getCellValuesFromRange = (start, end, data) => {
  const startCol = start.match(/[A-Z]+/)[0];
  const startRow = parseInt(start.match(/\d+/)[0]);
  const endCol = end.match(/[A-Z]+/)[0];
  const endRow = parseInt(end.match(/\d+/)[0]);

  const values = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
      const cellId = `${String.fromCharCode(col)}${row}`;
      const value = data[cellId]?.value;
      if (value !== undefined && value !== null && value !== '') {
        values.push(value);
      }
    }
  }
  return values;
};

// Helper function to parse cell coordinates
const parseCellCoords = (cellId) => {
  const col = cellId.match(/[A-Z]+/)[0];
  const row = parseInt(cellId.match(/\d+/)[0]) - 1;
  return {
    col: col.split('').reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1,
    row
  };
};

// Function to update cell dependencies
export const updateCellDependencies = (cellId, formula, data) => {
  const newData = { ...data };
  const cell = newData[cellId];
  
  // Clear old dependencies
  for (const depCellId of cell.dependencies) {
    const depCell = newData[depCellId];
    if (depCell) {
      newData[depCellId] = {
        ...depCell,
        dependents: depCell.dependents.filter(id => id !== cellId)
      };
    }
  }
  
  // Find new dependencies
  const dependencies = new Set();
  const cellRefs = formula.match(/[A-Z]+\d+/g) || [];
  
  for (const cellRef of cellRefs) {
    dependencies.add(cellRef);
    
    // Update the dependent cell
    if (newData[cellRef]) {
      newData[cellRef] = {
        ...newData[cellRef],
        dependents: [...new Set([...newData[cellRef].dependents, cellId])]
      };
    }
  }
  
  // Update the current cell's dependencies
  newData[cellId] = {
    ...cell,
    dependencies: Array.from(dependencies)
  };
  
  return newData;
};

// Function to update dependent cells when a cell value changes
export const updateDependentCells = (changedCellId, data) => {
  const newData = { ...data };
  const visited = new Set();
  
  // Helper function for DFS traversal of dependent cells
  const updateDependents = (cellId) => {
    if (visited.has(cellId)) return;
    visited.add(cellId);
    
    const cell = newData[cellId];
    for (const depCellId of cell.dependents) {
      const depCell = newData[depCellId];
      if (depCell && depCell.formula) {
        // Re-evaluate the formula
        newData[depCellId] = {
          ...depCell,
          value: evaluateFormula(depCell.formula, newData)
        };
        
        // Recursively update this cell's dependents
        updateDependents(depCellId);
      }
    }
  };
  
  // Start the update from the changed cell
  updateDependents(changedCellId);
  
  return newData;
};
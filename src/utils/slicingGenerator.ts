// src/utils/slicingGenerator.ts

export type SlicingType = 'block' | 'row' | 'col';

export interface SlicingProblem {
  grid: (number | null)[]; // 81 length
  targetNum: number;
  targetIndex: number; // The correct answer index (0-80)
  type: SlicingType;
}

export function generateSlicingProblem(type: SlicingType): SlicingProblem {
  const grid = new Array(81).fill(null);
  const targetNum = Math.floor(Math.random() * 9) + 1;
  
  // Helpers
  const getIndex = (r: number, c: number) => r * 9 + c;

  // Track occupied positions to avoid conflicts
  const isSafe = (r: number, c: number, num: number) => {
    // Check row
    for (let i = 0; i < 9; i++) if (grid[r * 9 + i] === num) return false;
    // Check col
    for (let i = 0; i < 9; i++) if (grid[i * 9 + c] === num) return false;
    // Check block
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (grid[(br + i) * 9 + (bc + j)] === num) return false;
    return true;
  };

  const placeNum = (r: number, c: number, num: number) => {
    grid[r * 9 + c] = num;
  };

  let targetIndex = -1;

  if (type === 'block') {
    // 1. Pick a block
    const blockRowStart = Math.floor(Math.random() * 3) * 3;
    const blockColStart = Math.floor(Math.random() * 3) * 3;
    
    // 2. Pick a target cell in this block
    const tr = blockRowStart + Math.floor(Math.random() * 3);
    const tc = blockColStart + Math.floor(Math.random() * 3);
    targetIndex = getIndex(tr, tc);

    // 3. Fill some other cells in the block with random distractions (optional)
    // To make it pure slicing, maybe we don't fill inside? 
    // User requirement: "Exclude using other numbers". 
    // If we rely ONLY on external numbers, we need to cover ALL other 8 cells.
    // Let's try to cover all other 8 cells with external numbers (Rows and Cols).
    
    // Rows to cover: The 2 rows in block that are NOT tr.
    const rowsToCover = [0, 1, 2].map(x => blockRowStart + x).filter(r => r !== tr);
    // Cols to cover: The 2 cols in block that are NOT tc.
    const colsToCover = [0, 1, 2].map(x => blockColStart + x).filter(c => c !== tc);

    // Place targetNum in rowsToCover
    for (const r of rowsToCover) {
      // Try to place in a column NOT in the current block
      // And ensure no column conflict with already placed numbers
      const validCols = [0,1,2,3,4,5,6,7,8].filter(c => 
        (c < blockColStart || c >= blockColStart + 3) && // Outside block
        isSafe(r, c, targetNum)
      );
      
      if (validCols.length > 0) {
        const c = validCols[Math.floor(Math.random() * validCols.length)];
        placeNum(r, c, targetNum);
      }
    }

    // Place targetNum in colsToCover
    for (const c of colsToCover) {
      // Try to place in a row NOT in the current block
      const validRows = [0,1,2,3,4,5,6,7,8].filter(r => 
        (r < blockRowStart || r >= blockRowStart + 3) && // Outside block
        isSafe(r, c, targetNum)
      );
      
      if (validRows.length > 0) {
        const r = validRows[Math.floor(Math.random() * validRows.length)];
        placeNum(r, c, targetNum);
      }
    }

  } else if (type === 'row') {
    // 1. Pick row
    const r = Math.floor(Math.random() * 9);
    // 2. Pick target cell
    const c = Math.floor(Math.random() * 9);
    targetIndex = getIndex(r, c);

    // 3. We need to eliminate all other columns in this row
    // Or fill them with numbers.
    // Strategy: Randomly fill 3-5 cells in this row with other numbers.
    // Then eliminate the REST with column slicers.
    
    const otherCols = [0,1,2,3,4,5,6,7,8].filter(col => col !== c);
    // Shuffle
    otherCols.sort(() => Math.random() - 0.5);
    
    const filledCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 filled
    const colsToFill = otherCols.slice(0, filledCount);
    const colsToSlice = otherCols.slice(filledCount);

    // Fill with random numbers
    for (const col of colsToFill) {
      let n = Math.floor(Math.random() * 9) + 1;
      while (n === targetNum || !isSafe(r, col, n)) {
        n = Math.floor(Math.random() * 9) + 1;
        // Safety break
        if (Math.random() > 0.9) break; 
      }
      placeNum(r, col, n);
    }

    // Slice the rest
    for (const col of colsToSlice) {
      const validRows = [0,1,2,3,4,5,6,7,8].filter(row => row !== r && isSafe(row, col, targetNum));
      if (validRows.length > 0) {
        const row = validRows[Math.floor(Math.random() * validRows.length)];
        placeNum(row, col, targetNum);
      }
    }
  } else if (type === 'col') {
    // Similar to row
    const c = Math.floor(Math.random() * 9);
    const r = Math.floor(Math.random() * 9);
    targetIndex = getIndex(r, c);

    const otherRows = [0,1,2,3,4,5,6,7,8].filter(row => row !== r);
    otherRows.sort(() => Math.random() - 0.5);

    const filledCount = Math.floor(Math.random() * 3) + 2;
    const rowsToFill = otherRows.slice(0, filledCount);
    const rowsToSlice = otherRows.slice(filledCount);

    for (const row of rowsToFill) {
      let n = Math.floor(Math.random() * 9) + 1;
      while (n === targetNum || !isSafe(row, c, n)) {
        n = Math.floor(Math.random() * 9) + 1;
        if (Math.random() > 0.9) break;
      }
      placeNum(row, c, n);
    }

    for (const row of rowsToSlice) {
      const validCols = [0,1,2,3,4,5,6,7,8].filter(col => col !== c && isSafe(row, col, targetNum));
      if (validCols.length > 0) {
        const col = validCols[Math.floor(Math.random() * validCols.length)];
        placeNum(row, col, targetNum);
      }
    }
  }

  // Add some random noise to the rest of the board to make it look fuller?
  // User said "interference numbers can appear anywhere".
  // Let's add 10-15 random numbers that are safe.
  for (let k = 0; k < 15; k++) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    const idx = r * 9 + c;
    
    // CRITICAL FIX: Never place a noise number in the target cell!
    if (idx === targetIndex) continue;

    if (grid[idx] === null) {
      const n = Math.floor(Math.random() * 9) + 1;
      if (n !== targetNum && isSafe(r, c, n)) { // Don't place targetNum randomly, only as slicers
        placeNum(r, c, n);
      }
    }
  }

  return { grid, targetNum, targetIndex, type };
}

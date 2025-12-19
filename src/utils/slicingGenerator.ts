// src/utils/slicingGenerator.ts

export type SlicingType = 'block' | 'row' | 'col';

export interface SlicingProblem {
  grid: (number | null)[]; // 81 length
  targetNum: number;
  targetIndex: number; // The correct answer index (0-80)
  type: SlicingType;
}

export function generateSlicingProblem(type: SlicingType, useIntersection: boolean = false): SlicingProblem {
  let attempt = 0;
  // Try up to 20 times to generate a valid puzzle with unique solution
  while (attempt < 20) {
    attempt++;
    const result = tryGenerate(type, useIntersection);
    if (result) return result;
  }
  
  // Fallback: if intersection logic fails too many times, return a simpler valid one
  // or just return the last attempt even if it might be imperfect (though tryGenerate checks validity)
  return tryGenerate(type, false)!;
}

function tryGenerate(type: SlicingType, useIntersection: boolean): SlicingProblem | null {
  const grid = new Array(81).fill(null);
  const targetNum = Math.floor(Math.random() * 9) + 1;
  
  const getIndex = (r: number, c: number) => r * 9 + c;

  const isSafe = (r: number, c: number, num: number) => {
    for (let i = 0; i < 9; i++) if (grid[r * 9 + i] === num) return false;
    for (let i = 0; i < 9; i++) if (grid[i * 9 + c] === num) return false;
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
  let targetRow = -1;
  let targetCol = -1;

  // --- Generation Logic ---

  if (type === 'block') {
    // 1. Pick a block
    const br = Math.floor(Math.random() * 3) * 3;
    const bc = Math.floor(Math.random() * 3) * 3;
    
    // 2. Pick target cell
    targetRow = br + Math.floor(Math.random() * 3);
    targetCol = bc + Math.floor(Math.random() * 3);
    targetIndex = getIndex(targetRow, targetCol);

    // 3. To require Intersection (Pointing/Claiming), we need to eliminate candidate positions
    // NOT by direct numbers in rows/cols, but by "Virtual" restrictions.
    // However, generating a specific Pointing Pair puzzle from scratch is complex.
    // Simpler approach:
    //    a. Eliminate some neighbors in the block with "Block Slicing" (rows/cols outside)
    //    b. If useIntersection is true, we purposely DON'T put a direct slicer in one row/col,
    //       but instead place a structure that creates a Pointing Pair in a neighboring block/line.
    
    // For now, let's stick to the "Generate -> Validate" approach.
    // We generate a board with random "slicers" (TargetNum in other rows/cols).
    // If useIntersection is TRUE, we might need FEWER direct slicers, 
    // relying on implicit elimination.

    const rowsToCover = [0, 1, 2].map(x => br + x).filter(r => r !== targetRow);
    const colsToCover = [0, 1, 2].map(x => bc + x).filter(c => c !== targetCol);

    // Randomly decide which row/col to SKIP direct covering if we want intersection logic
    // (This increases chance that a solver MUST use intersection to solve it)
    let skipRow = -1;
    let skipCol = -1;
    
    if (useIntersection) {
      if (Math.random() > 0.5 && rowsToCover.length > 0) {
        skipRow = rowsToCover[Math.floor(Math.random() * rowsToCover.length)];
      } else if (colsToCover.length > 0) {
        skipCol = colsToCover[Math.floor(Math.random() * colsToCover.length)];
      }
    }

    // Place Slicers (TargetNum)
    for (const r of rowsToCover) {
      if (r === skipRow) continue; // Skip placing direct slicer here
      
      const validCols = [0,1,2,3,4,5,6,7,8].filter(c => 
        (c < bc || c >= bc + 3) && isSafe(r, c, targetNum)
      );
      if (validCols.length > 0) {
        placeNum(r, validCols[Math.floor(Math.random() * validCols.length)], targetNum);
      }
    }

    for (const c of colsToCover) {
      if (c === skipCol) continue;
      
      const validRows = [0,1,2,3,4,5,6,7,8].filter(r => 
        (r < br || r >= br + 3) && isSafe(r, c, targetNum)
      );
      if (validRows.length > 0) {
        placeNum(validRows[Math.floor(Math.random() * validRows.length)], c, targetNum);
      }
    }

    // If we skipped a row/col, we MUST ensure that the TargetNum is eliminated from that row/col
    // via an Intersection (Pointing Pair).
    // E.g., if we skipped `skipRow`, we need another block in `skipRow` where TargetNum 
    // is restricted to `skipRow` (Claiming) or a block where TargetNum is restricted to `skipRow` (Pointing).
    // This is hard to construct deterministically.
    // Instead, we will rely on "Noise" (Random TargetNums placed elsewhere) to potentially create these structures,
    // and then the Solver will validate if it's uniquely solvable.
    
    // To increase chances of Intersection:
    // Place more TargetNums in other blocks to restrict candidates.
    if (useIntersection) {
        // Try to place a few more TargetNums in random safe spots
        for(let k=0; k<3; k++) {
            let r = Math.floor(Math.random() * 9);
            let c = Math.floor(Math.random() * 9);
            if(isSafe(r, c, targetNum)) placeNum(r, c, targetNum);
        }
    }

  } else {
    // Row/Col Logic (Simpler, mostly keeping existing logic but validating later)
    if (type === 'row') {
        targetRow = Math.floor(Math.random() * 9);
        targetCol = Math.floor(Math.random() * 9);
    } else {
        targetRow = Math.floor(Math.random() * 9);
        targetCol = Math.floor(Math.random() * 9);
    }
    targetIndex = getIndex(targetRow, targetCol);
    
    // Standard filling for Row/Col type... (simplified from original for brevity)
    // For Row type: eliminate other columns
    if (type === 'row') {
        const otherCols = [0,1,2,3,4,5,6,7,8].filter(c => c !== targetCol);
        // Fill some with noise numbers
        const fillCount = 3;
        const colsToFill = otherCols.slice(0, fillCount);
        const colsToSlice = otherCols.slice(fillCount); // Place TargetNum here
        
        for(const c of colsToFill) {
            let n = (targetNum % 9) + 1; // Simple different num
            if(isSafe(targetRow, c, n)) placeNum(targetRow, c, n);
        }
        for(const c of colsToSlice) {
             const validRows = [0,1,2,3,4,5,6,7,8].filter(r => r !== targetRow && isSafe(r, c, targetNum));
             if(validRows.length) placeNum(validRows[0], c, targetNum);
        }
    } else {
        // Col type
        const otherRows = [0,1,2,3,4,5,6,7,8].filter(r => r !== targetRow);
        const fillCount = 3;
        const rowsToFill = otherRows.slice(0, fillCount);
        const rowsToSlice = otherRows.slice(fillCount);
        
        for(const r of rowsToFill) {
             let n = (targetNum % 9) + 1;
             if(isSafe(r, targetCol, n)) placeNum(r, targetCol, n);
        }
        for(const r of rowsToSlice) {
             const validCols = [0,1,2,3,4,5,6,7,8].filter(c => c !== targetCol && isSafe(r, c, targetNum));
             if(validCols.length) placeNum(r, validCols[0], targetNum);
        }
    }
  }

  // Add Noise (Interference)
  // Crucial: Noise helps form Blocks for Intersection logic.
  // We place 10-20 random numbers.
  for (let k = 0; k < 20; k++) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    const idx = r * 9 + c;
    
    if (idx === targetIndex) continue;

    if (grid[idx] === null) {
      const n = Math.floor(Math.random() * 9) + 1;
      // If we want to encourage Intersection logic for TargetNum, 
      // we should NOT place TargetNum randomly as noise too often (it might over-simplify).
      // But we DO need TargetNum to form the restricting blocks.
      // Strategy: 20% chance to place TargetNum, 80% other numbers.
      
      const placeTarget = Math.random() < 0.2;
      const numToPlace = placeTarget ? targetNum : (Math.floor(Math.random() * 9) + 1);

      if (isSafe(r, c, numToPlace)) {
        if (numToPlace === targetNum) {
            // Only place if it doesn't invalidate our target position (already checked by isSafe for row/col/block)
            // But isSafe checks grid state.
            placeNum(r, c, numToPlace);
        } else {
            placeNum(r, c, numToPlace);
        }
      }
    }
  }

  // --- VALIDATION STEP ---
  const uniqueSolution = solve(grid, targetNum, targetIndex);
  
  // If we require intersection, we must ensure that BASIC slicing is NOT enough.
  // i.e., Solve with ONLY basic logic should fail (return false or multiple candidates),
  // while Solve with Intersection should succeed.
  
  if (useIntersection) {
     const solvedWithBasic = solveBasic(grid, targetNum, targetIndex);
     // We want: Basic fails (returns false/null), but Advanced (solve) succeeds.
     if (!solvedWithBasic && uniqueSolution) {
         return { grid, targetNum, targetIndex, type };
     }
     return null; // Failed requirements
  }

  // Normal mode: Just needs to be uniquely solvable (Basic logic is fine)
  if (uniqueSolution) {
      return { grid, targetNum, targetIndex, type };
  }

  return null;
}

// --- SOLVER LOGIC ---

// Returns true if TargetIndex is the ONLY possible place for TargetNum
function solve(grid: (number|null)[], targetNum: number, targetIndex: number): boolean {
    // 1. Initialize Candidates
    // candidates[i] = true means cell i CAN contain targetNum
    let candidates = new Array(81).fill(true);
    
    // Initial elimination based on existing numbers
    for(let i=0; i<81; i++) {
        if (grid[i] !== null) {
            candidates[i] = false; // Occupied
            if (grid[i] === targetNum) {
                // Eliminate peer candidates
                eliminatePeers(candidates, i);
            }
        }
    }

    let changed = true;
    while(changed) {
        changed = false;
        
        // Strategy 1: Hidden Singles (Basic Slicing) - applied implicitly by eliminatePeers check?
        // Actually eliminatePeers just removes candidates. We need to check if any unit has only 1 spot.
        // But for "Pointing/Claiming", we need to run that logic explicitly.
        
        // Apply Pointing/Claiming (Intersection)
        if (applyIntersection(candidates)) changed = true;
        
        // Apply Hidden Singles? 
        // If we find a Hidden Single that is NOT our target, we should "fill" it virtually?
        // For this specific puzzle type, we only care about TargetNum's positions.
        // We assume the user is only looking for TargetNum.
        // So we just iterate reducing candidates for TargetNum.
    }
    
    // Check if TargetIndex is the unique candidate
    // Actually, we need to check if TargetIndex is the ONLY candidate left in the whole board? 
    // No, just in its Row, Col, or Block.
    // If in the Target's Block, only TargetIndex is true, then it's solved.
    
    const tr = Math.floor(targetIndex / 9);
    const tc = targetIndex % 9;
    
    // Final Verification:
    // We must ensure that targetIndex is the ONLY forced move on the entire board for targetNum.
    // "Forced move" means a Hidden Single in some unit (Block, Row, or Col).
    
    let forcedPositions = new Set<number>();
    
    for (let idx = 0; idx < 81; idx++) {
        if (!candidates[idx]) continue;
        
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        const br = Math.floor(r/3)*3;
        const bc = Math.floor(c/3)*3;
        
        // Check if unique in Row
        let uniqueInRow = true;
        for(let k=0; k<9; k++) if(k !== c && candidates[r*9 + k]) { uniqueInRow = false; break; }
        
        // Check if unique in Col
        let uniqueInCol = true;
        for(let k=0; k<9; k++) if(k !== r && candidates[k*9 + c]) { uniqueInCol = false; break; }
        
        // Check if unique in Block
        let uniqueInBlock = true;
        for(let i=0; i<3; i++)
            for(let j=0; j<3; j++) {
                const bIdx = (br+i)*9 + (bc+j);
                if(bIdx !== idx && candidates[bIdx]) { uniqueInBlock = false; break; } // break inner loop? needs label or flag
            }
        // Correct block check logic with label or simpler structure
        if (uniqueInBlock) {
             // double check
             let count = 0;
             for(let i=0; i<3; i++)
                for(let j=0; j<3; j++)
                    if(candidates[(br+i)*9 + (bc+j)]) count++;
             if (count !== 1) uniqueInBlock = false;
        }

        if (uniqueInRow || uniqueInCol || uniqueInBlock) {
            forcedPositions.add(idx);
        }
    }
    
    // There must be EXACTLY ONE forced position, and it must be our target.
    return forcedPositions.size === 1 && forcedPositions.has(targetIndex);
}

// Basic Solver (No Intersection)
function solveBasic(grid: (number|null)[], targetNum: number, targetIndex: number): boolean {
    let candidates = new Array(81).fill(true);
    for(let i=0; i<81; i++) {
        if (grid[i] !== null) {
            candidates[i] = false;
            if (grid[i] === targetNum) eliminatePeers(candidates, i);
        }
    }
    
    let forcedPositions = new Set<number>();
    
    for (let idx = 0; idx < 81; idx++) {
        if (!candidates[idx]) continue;
        
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        const br = Math.floor(r/3)*3;
        const bc = Math.floor(c/3)*3;
        
        // Check if unique in Row
        let uniqueInRow = true;
        for(let k=0; k<9; k++) if(k !== c && candidates[r*9 + k]) { uniqueInRow = false; break; }
        
        // Check if unique in Col
        let uniqueInCol = true;
        for(let k=0; k<9; k++) if(k !== r && candidates[k*9 + c]) { uniqueInCol = false; break; }
        
        // Check if unique in Block
        let count = 0;
        for(let i=0; i<3; i++)
            for(let j=0; j<3; j++)
                if(candidates[(br+i)*9 + (bc+j)]) count++;
        const uniqueInBlock = (count === 1);

        if (uniqueInRow || uniqueInCol || uniqueInBlock) {
            forcedPositions.add(idx);
        }
    }
    
    return forcedPositions.size === 1 && forcedPositions.has(targetIndex);
}

function eliminatePeers(candidates: boolean[], idx: number) {
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const br = Math.floor(r/3)*3;
    const bc = Math.floor(c/3)*3;
    
    // Row
    for(let i=0; i<9; i++) candidates[r*9 + i] = false;
    // Col
    for(let i=0; i<9; i++) candidates[i*9 + c] = false;
    // Block
    for(let i=0; i<3; i++)
        for(let j=0; j<3; j++)
            candidates[(br+i)*9 + (bc+j)] = false;
}

function applyIntersection(candidates: boolean[]): boolean {
    let changed = false;
    
    // 1. Pointing (Block -> Row/Col)
    for (let b = 0; b < 9; b++) {
        const br = Math.floor(b / 3) * 3;
        const bc = (b % 3) * 3;
        
        const indices = [];
        for(let i=0; i<3; i++)
            for(let j=0; j<3; j++) {
                const idx = (br+i)*9 + (bc+j);
                if(candidates[idx]) indices.push({r: br+i, c: bc+j});
            }
            
        if (indices.length <= 1) continue; // 0 or 1 candidate, nothing to point
        
        // Check Row Pointing
        const firstR = indices[0].r;
        if (indices.every(p => p.r === firstR)) {
            // All candidates in this block are in row firstR
            // Eliminate others in this row
            for(let c=0; c<9; c++) {
                if (c < bc || c >= bc + 3) { // Outside block
                    const idx = firstR*9 + c;
                    if (candidates[idx]) {
                        candidates[idx] = false;
                        changed = true;
                    }
                }
            }
        }
        
        // Check Col Pointing
        const firstC = indices[0].c;
        if (indices.every(p => p.c === firstC)) {
            for(let r=0; r<9; r++) {
                if (r < br || r >= br + 3) { // Outside block
                    const idx = r*9 + firstC;
                    if (candidates[idx]) {
                        candidates[idx] = false;
                        changed = true;
                    }
                }
            }
        }
    }
    
    // 2. Claiming (Row/Col -> Block) - Can be added if needed, but Pointing is most common
    
    return changed;
}

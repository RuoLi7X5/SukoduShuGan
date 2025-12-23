
export type SlicingType = 'block' | 'row' | 'col';

export interface SlicingProblem {
  grid: (number | null)[]; // 81 length
  targetNum: number;
  targetIndex: number; // The correct answer index (0-80)
  type: SlicingType;
}

// 权重随机辅助函数
function weightedChoice<T>(options: { item: T; weight: number }[]): T {
  let totalWeight = 0;
  for (const opt of options) totalWeight += opt.weight;
  
  let random = Math.random() * totalWeight;
  for (const opt of options) {
    random -= opt.weight;
    if (random <= 0) return opt.item;
  }
  return options[options.length - 1].item;
}

export function generateSlicingProblem(type: SlicingType, useIntersection: boolean = false): SlicingProblem {
  let attempt = 0;
  // Increase attempts significantly to ensure we find a valid puzzle
  // especially given the strict global uniqueness check.
  const maxAttempts = useIntersection ? 200 : 100;

  while (attempt < maxAttempts) {
    attempt++;
    const result = tryGenerate(type, useIntersection);
    if (result) return result;
  }

  // If we fail to generate intersection puzzle, fallback to standard unique puzzle
  if (useIntersection) {
    console.warn("Failed to generate intersection puzzle, falling back to standard unique puzzle.");
    return generateSlicingProblem(type, false);
  }
  
  // If we fail standard puzzle, this is critical. 
  // Try one last time with a very simple block configuration that is almost guaranteed to work.
  // Or just return the last result if we could track "best effort".
  // For now, let's try a simpler type if original failed.
  if (type !== 'block') {
      const fallback = tryGenerate('block', false);
      if (fallback) return fallback;
  }

  throw new Error("Failed to generate puzzle after multiple attempts");
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

  // 1. 确定目标位置
  let targetRow = -1;
  let targetCol = -1;
  
  if (type === 'block') {
    const br = Math.floor(Math.random() * 3) * 3;
    const bc = Math.floor(Math.random() * 3) * 3;
    targetRow = br + Math.floor(Math.random() * 3);
    targetCol = bc + Math.floor(Math.random() * 3);
  } else {
    targetRow = Math.floor(Math.random() * 9);
    targetCol = Math.floor(Math.random() * 9);
  }
  
  const targetIndex = getIndex(targetRow, targetCol);
  const targetBr = Math.floor(targetRow / 3) * 3;
  const targetBc = Math.floor(targetCol / 3) * 3;

  const protectedIndices = new Set<number>();
  protectedIndices.add(targetIndex);

  // --- 构造核心：确保 TargetIndex 至少是一个解 ---
  
  if (type === 'block') {
    const rowsToCover = [0, 1, 2].map(x => targetBr + x).filter(r => r !== targetRow);
    const colsToCover = [0, 1, 2].map(x => targetBc + x).filter(c => c !== targetCol);

    let intersectRow = -1;
    let intersectCol = -1;

    if (useIntersection) {
      if (Math.random() > 0.5 && rowsToCover.length > 0) {
        intersectRow = weightedChoice(rowsToCover.map(r => ({ item: r, weight: 1 })));
      } else if (colsToCover.length > 0) {
        intersectCol = weightedChoice(colsToCover.map(c => ({ item: c, weight: 1 })));
      }
    }

    // 行 Slicers
    for (const r of rowsToCover) {
      if (r === intersectRow) {
        // Pointing Pair Logic (Force TargetNum in neighbor block to be in Row r)
        const neighborBc = (targetBc + 3) % 9;
        const otherRowsInBand = [targetBr, targetBr+1, targetBr+2].filter(row => row !== r);
        
        for (const or of otherRowsInBand) {
            for (let k = 0; k < 3; k++) {
                const nc = neighborBc + k;
                if (!isSafe(or, nc, targetNum)) continue;
                // MUST fill with noise
                let placed = false;
                const start = Math.floor(Math.random() * 9) + 1;
                for(let offset = 0; offset < 9; offset++) {
                    const n = ((start + offset - 1) % 9) + 1;
                    if (n !== targetNum && isSafe(or, nc, n)) {
                        placeNum(or, nc, n);
                        placed = true;
                        break;
                    }
                }
                if (!placed) return null; // Can't construct pointing pair
            }
        }
      } else {
        // Direct Slicer: MUST place TargetNum
        const validCols = [0,1,2,3,4,5,6,7,8].filter(c => 
          (c < targetBc || c >= targetBc + 3) && isSafe(r, c, targetNum)
        );
        if (validCols.length > 0) {
           const chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
           placeNum(r, chosenCol, targetNum);
        } else {
           return null;
        }
      }
    }

    // 列 Slicers
    for (const c of colsToCover) {
      if (c === intersectCol) {
         const neighborBr = (targetBr + 3) % 9;
         const otherColsInStack = [targetBc, targetBc+1, targetBc+2].filter(col => col !== c);
         for (const oc of otherColsInStack) {
             for (let k = 0; k < 3; k++) {
                 const nr = neighborBr + k;
                 if (!isSafe(nr, oc, targetNum)) continue;
                 let placed = false;
                 const start = Math.floor(Math.random() * 9) + 1;
                 for (let offset = 0; offset < 9; offset++) {
                     const n = ((start + offset - 1) % 9) + 1;
                     if (n !== targetNum && isSafe(nr, oc, n)) {
                         placeNum(nr, oc, n);
                         placed = true;
                         break;
                     }
                 }
                 if (!placed) return null;
             }
         }
      } else {
        const validRows = [0,1,2,3,4,5,6,7,8].filter(r => 
          (r < targetBr || r >= targetBr + 3) && isSafe(r, c, targetNum)
        );
        if (validRows.length > 0) {
           const chosenRow = validRows[Math.floor(Math.random() * validRows.length)];
           placeNum(chosenRow, c, targetNum);
        } else {
           return null; 
        }
      }
    }
  } else {
    // Row/Col Constructive Logic
    if (type === 'row') {
        const otherCols = [0,1,2,3,4,5,6,7,8].filter(c => c !== targetCol);
        for (const c of otherCols) {
             if (Math.random() > 0.5) {
                 const validRows = [0,1,2,3,4,5,6,7,8].filter(r => r !== targetRow && isSafe(r, c, targetNum));
                 if (validRows.length > 0) {
                     placeNum(validRows[Math.floor(Math.random() * validRows.length)], c, targetNum);
                 } else {
                     let placed = false;
                     const start = Math.floor(Math.random() * 9) + 1;
                     for(let offset = 0; offset < 9; offset++) {
                        const n = ((start + offset - 1) % 9) + 1;
                        if (n !== targetNum && isSafe(targetRow, c, n)) {
                            placeNum(targetRow, c, n);
                            placed = true;
                            break;
                        }
                     }
                     if (!placed) return null;
                 }
             } else {
                 let placed = false;
                 const start = Math.floor(Math.random() * 9) + 1;
                 for(let offset = 0; offset < 9; offset++) {
                    const n = ((start + offset - 1) % 9) + 1;
                    if (n !== targetNum && isSafe(targetRow, c, n)) {
                        placeNum(targetRow, c, n);
                        placed = true;
                        break;
                    }
                 }
                 if (!placed) {
                     const validRows = [0,1,2,3,4,5,6,7,8].filter(r => r !== targetRow && isSafe(r, c, targetNum));
                     if (validRows.length > 0) {
                         placeNum(validRows[Math.floor(Math.random() * validRows.length)], c, targetNum);
                     } else {
                         return null;
                     }
                 }
             }
        }
    } else {
        const otherRows = [0,1,2,3,4,5,6,7,8].filter(r => r !== targetRow);
        for (const r of otherRows) {
             if (Math.random() > 0.5) {
                 const validCols = [0,1,2,3,4,5,6,7,8].filter(c => c !== targetCol && isSafe(r, c, targetNum));
                 if (validCols.length > 0) {
                     placeNum(r, validCols[Math.floor(Math.random() * validCols.length)], targetNum);
                 } else {
                     let placed = false;
                     const start = Math.floor(Math.random() * 9) + 1;
                     for(let offset = 0; offset < 9; offset++) {
                        const n = ((start + offset - 1) % 9) + 1;
                        if (n !== targetNum && isSafe(r, targetCol, n)) {
                            placeNum(r, targetCol, n);
                            placed = true;
                            break;
                        }
                     }
                     if (!placed) return null;
                 }
             } else {
                 let placed = false;
                 const start = Math.floor(Math.random() * 9) + 1;
                 for(let offset = 0; offset < 9; offset++) {
                    const n = ((start + offset - 1) % 9) + 1;
                    if (n !== targetNum && isSafe(r, targetCol, n)) {
                        placeNum(r, targetCol, n);
                        placed = true;
                        break;
                    }
                 }
                 if (!placed) {
                     const validCols = [0,1,2,3,4,5,6,7,8].filter(c => c !== targetCol && isSafe(r, c, targetNum));
                     if (validCols.length > 0) {
                         placeNum(r, validCols[Math.floor(Math.random() * validCols.length)], targetNum);
                     } else {
                         return null;
                     }
                 }
             }
        }
    }
  }

  // --- 2. 性能核心：消除全盘其他 Hidden Singles ---
  
  for (let iter = 0; iter < 5; iter++) { 
      const candidates = new Array(81).fill(true);
      for(let i=0; i<81; i++) {
        if (grid[i] !== null) {
            candidates[i] = false;
            if (grid[i] === targetNum) eliminatePeers(candidates, i);
        }
      }
      
      let unintendedFound = false;
      const safeIndices = []; 
      
      for (let idx = 0; idx < 81; idx++) {
        if (!candidates[idx]) continue;
        if (idx === targetIndex) continue;
        
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        const br = Math.floor(r/3)*3;
        const bc = Math.floor(c/3)*3;
        
        let uniqueInRow = true;
        for(let k=0; k<9; k++) if(k !== c && candidates[r*9 + k]) { uniqueInRow = false; break; }
        
        let uniqueInCol = true;
        for(let k=0; k<9; k++) if(k !== r && candidates[k*9 + c]) { uniqueInCol = false; break; }
        
        let count = 0;
        for(let i=0; i<3; i++)
            for(let j=0; j<3; j++)
                if(candidates[(br+i)*9 + (bc+j)]) count++;
        const uniqueInBlock = (count === 1);

        if (uniqueInRow || uniqueInCol || uniqueInBlock) {
            safeIndices.push(idx);
            unintendedFound = true;
        }
      }
      
      if (!unintendedFound) break; 
      
      for (const idx of safeIndices) {
          const r = Math.floor(idx / 9);
          const c = idx % 9;
          let placed = false;
          const start = Math.floor(Math.random() * 9) + 1;
          for(let offset = 0; offset < 9; offset++) {
             const n = ((start + offset - 1) % 9) + 1;
             if (n !== targetNum && isSafe(r, c, n)) {
                 placeNum(r, c, n);
                 placed = true;
                 break;
             }
          }
          if (!placed) {
              return null;
          }
      }
  }

  // 3. 填充额外噪音 (Decor)
  const noiseCount = useIntersection ? 15 : 10;
  for (let k = 0; k < noiseCount; k++) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    const idx = r * 9 + c;
    
    if (protectedIndices.has(idx)) continue;
    if (idx === targetIndex) continue;
    if (grid[idx] !== null) continue;

    if (r >= targetBr && r < targetBr + 3 && c >= targetBc && c < targetBc + 3) {
        if (Math.random() > 0.2) continue; 
    }

    const placeTarget = Math.random() < 0.1;
    const numToPlace = placeTarget ? targetNum : (Math.floor(Math.random() * 9) + 1);

    if (isSafe(r, c, numToPlace)) {
      placeNum(r, c, numToPlace);
    }
  }

  // --- 验证步骤 ---
  const uniqueSolution = solve(grid, targetNum, targetIndex);
  
  if (useIntersection) {
     const solvedWithBasic = solveBasic(grid, targetNum, targetIndex);
     if (!solvedWithBasic && uniqueSolution) {
         return { grid, targetNum, targetIndex, type };
     }
     return null;
  }

  if (uniqueSolution) {
      if (type === 'row' || type === 'col') {
         const candidates = new Array(81).fill(true);
         for(let i=0; i<81; i++) {
             if (grid[i] !== null) {
                 candidates[i] = false;
                 if (grid[i] === targetNum) eliminatePeers(candidates, i);
             }
         }
         if (useIntersection) {
             let changed = true;
             while(changed) {
                 changed = false;
                 if (applyIntersection(candidates)) changed = true;
             }
         }

         const r = Math.floor(targetIndex / 9);
         const c = targetIndex % 9;

         if (type === 'row') {
             let uniqueInRow = true;
             for(let k=0; k<9; k++) if(k !== c && candidates[r*9 + k]) { uniqueInRow = false; break; }
             if (!uniqueInRow) return null;
         } else {
             let uniqueInCol = true;
             for(let k=0; k<9; k++) if(k !== r && candidates[k*9 + c]) { uniqueInCol = false; break; }
             if (!uniqueInCol) return null;
         }
      }

      return { grid, targetNum, targetIndex, type };
  }

  return null;
}

// --- 求解器逻辑 ---

function solve(grid: (number|null)[], targetNum: number, targetIndex: number): boolean {
    let candidates = new Array(81).fill(true);
    
    // 初始化候选数
    for(let i=0; i<81; i++) {
        if (grid[i] !== null) {
            candidates[i] = false;
            if (grid[i] === targetNum) eliminatePeers(candidates, i);
        }
    }

    let changed = true;
    while(changed) {
        changed = false;
        // 应用交集逻辑 (Pointing/Claiming)
        if (applyIntersection(candidates)) changed = true;
    }
    
    return checkUniqueForTarget(candidates, targetIndex);
}

function solveBasic(grid: (number|null)[], targetNum: number, targetIndex: number): boolean {
    let candidates = new Array(81).fill(true);
    for(let i=0; i<81; i++) {
        if (grid[i] !== null) {
            candidates[i] = false;
            if (grid[i] === targetNum) eliminatePeers(candidates, i);
        }
    }
    // 不应用 applyIntersection，只看基本排除
    return checkUniqueForTarget(candidates, targetIndex);
}

function checkUniqueForTarget(candidates: boolean[], targetIndex: number): boolean {
    let forcedPositions = new Set<number>();
    
    for (let idx = 0; idx < 81; idx++) {
        if (!candidates[idx]) continue;
        
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        const br = Math.floor(r/3)*3;
        const bc = Math.floor(c/3)*3;
        
        // 检查行唯一 (Unique in Row)
        let uniqueInRow = true;
        for(let k=0; k<9; k++) if(k !== c && candidates[r*9 + k]) { uniqueInRow = false; break; }
        
        // 检查列唯一 (Unique in Col)
        let uniqueInCol = true;
        for(let k=0; k<9; k++) if(k !== r && candidates[k*9 + c]) { uniqueInCol = false; break; }
        
        // 检查宫唯一 (Unique in Block)
        let count = 0;
        for(let i=0; i<3; i++)
            for(let j=0; j<3; j++)
                if(candidates[(br+i)*9 + (bc+j)]) count++;
        const uniqueInBlock = (count === 1);

        if (uniqueInRow || uniqueInCol || uniqueInBlock) {
            forcedPositions.add(idx);
        }
    }
    
    // 关键修复：
    // 必须确保全盘只有一个位置是“必须填”的（Hidden Single），且该位置就是我们的 targetIndex。
    // 如果 forcedPositions.size > 1，说明有多个位置都可以通过排除法得出，这是多解（对于寻找特定数字的任务来说）。
    return forcedPositions.size === 1 && forcedPositions.has(targetIndex);
}

function eliminatePeers(candidates: boolean[], idx: number) {
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const br = Math.floor(r/3)*3;
    const bc = Math.floor(c/3)*3;
    
    for(let i=0; i<9; i++) candidates[r*9 + i] = false;
    for(let i=0; i<9; i++) candidates[i*9 + c] = false;
    for(let i=0; i<3; i++)
        for(let j=0; j<3; j++)
            candidates[(br+i)*9 + (bc+j)] = false;
}

function applyIntersection(candidates: boolean[]): boolean {
    let changed = false;
    
    // 1. Pointing (宫 -> 行/列)
    for (let b = 0; b < 9; b++) {
        const br = Math.floor(b / 3) * 3;
        const bc = (b % 3) * 3;
        
        const indices = [];
        for(let i=0; i<3; i++)
            for(let j=0; j<3; j++) {
                const idx = (br+i)*9 + (bc+j);
                if(candidates[idx]) indices.push({r: br+i, c: bc+j});
            }
            
        if (indices.length <= 1) continue;
        
        // 行 Pointing
        const firstR = indices[0].r;
        if (indices.every(p => p.r === firstR)) {
            for(let c=0; c<9; c++) {
                if (c < bc || c >= bc + 3) { 
                    const idx = firstR*9 + c;
                    if (candidates[idx]) {
                        candidates[idx] = false;
                        changed = true;
                    }
                }
            }
        }
        
        // 列 Pointing
        const firstC = indices[0].c;
        if (indices.every(p => p.c === firstC)) {
            for(let r=0; r<9; r++) {
                if (r < br || r >= br + 3) {
                    const idx = r*9 + firstC;
                    if (candidates[idx]) {
                        candidates[idx] = false;
                        changed = true;
                    }
                }
            }
        }
    }
    return changed;
}

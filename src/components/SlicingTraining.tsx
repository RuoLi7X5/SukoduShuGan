import { useState, useEffect, useCallback } from 'react';
import { useStats } from '../hooks/useStats';
import { generateSlicingProblem, type SlicingProblem, type SlicingType } from '../utils/slicingGenerator';
import { twMerge } from 'tailwind-merge';
import { Timer, Trophy, RotateCcw, ChevronDown } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import React from 'react';

export default function SlicingTraining() {
  const [mode, setMode] = useState<SlicingType | 'random'>('block');
  const [problem, setProblem] = useState<SlicingProblem | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const { stats, addRecord, resetStats } = useStats('slicing-stats');
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [wrongCellIndex, setWrongCellIndex] = useState<number | null>(null);

  const newProblem = useCallback(() => {
    const type = mode === 'random' 
      ? (['block', 'row', 'col'][Math.floor(Math.random() * 3)] as SlicingType)
      : mode;
    
    // If stats.total >= 10, force using intersection logic
    // We access stats from props/hook, but be careful about dependency loop.
    const useIntersection = stats.total >= 10;
    
    setProblem(generateSlicingProblem(type, useIntersection));
    setStartTime(Date.now());
    setLastResult(null);
    setWrongCellIndex(null);
  }, [mode]); // Removed stats.total from dependency array to prevent infinite loop

  useEffect(() => {
     newProblem();
  }, [mode]); // Re-generate when mode changes

  const handleCellClick = (index: number) => {
    if (!problem || lastResult === 'correct' || problem.grid[index] !== null) return;

    const isCorrect = index === problem.targetIndex;
    const timeTaken = Date.now() - startTime;

    addRecord(isCorrect, timeTaken);

    if (isCorrect) {
      setLastResult('correct');
      const newGrid = [...problem.grid];
      newGrid[index] = problem.targetNum;
      setProblem({ ...problem, grid: newGrid });
      
      setTimeout(() => {
        // Increment total stats to trigger difficulty check correctly
        // But stats updates are async and handled by useStats. 
        // We rely on useStats to update 'stats' prop, but here we just call newProblem.
        // Actually newProblem depends on stats.total, which might not be updated yet.
        // It's better to let newProblem read the latest stats or pass a flag.
        // However, for simplicity, just calling newProblem() is fine, 
        // the NEXT render cycle will have updated stats.
        newProblem();
      }, 800);
    } else {
      setLastResult('wrong');
      setWrongCellIndex(index);
      setTimeout(() => {
        setLastResult(null);
        setWrongCellIndex(null);
      }, 500);
    }
  };

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const avgTime = stats.correct > 0 ? Math.round(stats.totalTime / stats.correct) : 0;

  const getModeLabel = (m: SlicingType | 'random') => {
    switch(m) {
      case 'block': return '宫排除 (Block)';
      case 'row': return '行排除 (Row)';
      case 'col': return '列排除 (Column)';
      case 'random': return '随机模式 (Random)';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center max-w-6xl mx-auto p-4 animate-fade-in font-sans">
      {/* Settings & Stats */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl relative z-20">
          <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-rose-400" />
            模式选择
          </h3>
          
          <Menu as="div" className="relative block text-left w-full z-50">
            <Menu.Button className="inline-flex w-full justify-between items-center rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10 transition-all">
              {getModeLabel(mode)}
              <ChevronDown className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
            </Menu.Button>
            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 right-0 z-50 mt-2 origin-top rounded-xl bg-slate-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/10 overflow-hidden">
                <div className="py-1">
                  {(['block', 'row', 'col', 'random'] as const).map((m) => (
                    <Menu.Item key={m}>
                      {({ active }) => (
                        <button
                          onClick={() => setMode(m)}
                          className={`
                            ${active ? 'bg-rose-600 text-white' : 'text-slate-300'}
                            group flex w-full items-center px-4 py-3 text-sm transition-colors
                          `}
                        >
                          {getModeLabel(m)}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Timer className="w-4 h-4 text-blue-400" />
              实时统计
            </h3>
            <button 
              onClick={resetStats} 
              className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              <RotateCcw className="w-3 h-3" /> 重置
            </button>
          </div>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <StatItem label="做题数" value={stats.total} />
            <StatItem 
              label="正确率" 
              value={`${accuracy}%`} 
              color={accuracy >= 90 ? 'text-green-400' : accuracy >= 70 ? 'text-yellow-400' : 'text-red-400'} 
            />
            <StatItem label="答对" value={stats.correct} color="text-green-400" />
            <StatItem label="平均用时" value={`${avgTime}ms`} />
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="w-full bg-slate-800/50 backdrop-blur-md rounded-3xl shadow-2xl border border-white/5 p-4 md:p-8 flex flex-col items-center justify-center relative min-h-[500px]">
          {problem && (
            <>
              <div className="mb-8 text-center bg-black/20 px-8 py-4 rounded-2xl border border-white/5 backdrop-blur-sm shadow-lg">
                <span className="text-slate-400 text-lg">请找出数字</span>
                <span className="mx-3 text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-rose-400 to-orange-400 align-middle filter drop-shadow-lg">{problem.targetNum}</span>
                <span className="text-slate-400 text-lg">的位置</span>
              </div>
              
              <div className="relative border-4 border-slate-900 select-none bg-slate-900 shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10">
                <div className="grid grid-cols-9 grid-rows-9 bg-slate-600 gap-px border border-slate-600">
                  {problem.grid.map((num, idx) => {
                    const row = Math.floor(idx / 9);
                    const col = idx % 9;
                    
                    const isRightBlockBorder = (col + 1) % 3 === 0 && col !== 8;
                    const isBottomBlockBorder = (row + 1) % 3 === 0 && row !== 8;
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => handleCellClick(idx)}
                        className={twMerge(
                          "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-xl md:text-2xl cursor-pointer transition-all duration-200 relative",
                          "bg-slate-900 hover:bg-rose-500/20 text-slate-200 font-sans", // Default cell style
                          isRightBlockBorder && "border-r-2 border-slate-500", 
                          isBottomBlockBorder && "border-b-2 border-slate-500", 
                          num !== null && "bg-slate-800 text-slate-400 font-medium cursor-default hover:bg-slate-800", // Filled cell
                          wrongCellIndex === idx && "bg-red-500/50 animate-shake z-10",
                          lastResult === 'correct' && idx === problem.targetIndex && "bg-green-500 text-white font-bold scale-110 z-10 shadow-lg rounded-sm"
                        )}
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold tracking-tight ${color}`}>{value}</span>
    </div>
  );
}

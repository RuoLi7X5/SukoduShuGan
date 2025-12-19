import { useState, useEffect, useCallback } from 'react';
import { useStats } from '../hooks/useStats';
import { Timer, Trophy, RotateCcw, AlertCircle, ChevronDown } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import React from 'react';

type Mode = 'random' | 'block' | 'row' | 'col';

interface Problem {
  grid: (number | null)[];
  answer: number;
  type: 'block' | 'row' | 'col';
}

export default function LastDigitTraining() {
  const [mode, setMode] = useState<Mode>('block');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const { stats, addRecord, resetStats } = useStats('last-digit-stats');
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);

  const generateProblem = useCallback(() => {
    let currentType: 'block' | 'row' | 'col' = mode === 'random' 
      ? (['block', 'row', 'col'][Math.floor(Math.random() * 3)] as any)
      : mode;

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    const missingIndex = Math.floor(Math.random() * 9);
    const answer = numbers[missingIndex];
    const grid: (number | null)[] = [...numbers];
    grid[missingIndex] = null;

    setProblem({
      grid,
      answer,
      type: currentType
    });
    setStartTime(Date.now());
    setLastResult(null);
  }, [mode]);

  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  const handleInput = useCallback((num: number) => {
    if (!problem) return;

    const timeTaken = Date.now() - startTime;
    const isCorrect = num === problem.answer;

    addRecord(isCorrect, timeTaken);
    
    if (isCorrect) {
      setLastResult('correct');
      generateProblem();
    } else {
      setLastResult('wrong');
      generateProblem(); 
    }
  }, [problem, startTime, addRecord, generateProblem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        handleInput(num);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const avgTime = stats.correct > 0 ? Math.round(stats.totalTime / stats.correct) : 0;

  const getModeLabel = (m: Mode) => {
    switch(m) {
      case 'block': return '宫唯余 (Block)';
      case 'row': return '行唯余 (Row)';
      case 'col': return '列唯余 (Column)';
      case 'random': return '随机模式 (Random)';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start justify-center max-w-6xl mx-auto p-2 md:p-4 animate-fade-in font-sans">
      {/* Settings & Stats - Left */}
      <div className="w-full lg:w-72 space-y-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl relative z-20">
          <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-blue-400" />
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
                  {(['block', 'row', 'col', 'random'] as Mode[]).map((m) => (
                    <Menu.Item key={m}>
                      {({ active }) => (
                        <button
                          onClick={() => setMode(m)}
                          className={`
                            ${active ? 'bg-blue-600 text-white' : 'text-slate-300'}
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

      {/* Game Area - Center */}
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="w-full bg-slate-800/50 backdrop-blur-md rounded-3xl shadow-2xl border border-white/5 p-6 md:p-12 min-h-[350px] md:min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden group">
          
          <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 text-slate-500 text-sm flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-white/5 whitespace-nowrap z-10">
            <AlertCircle className="w-4 h-4" />
            <span>请找出缺失的数字</span>
          </div>

          {/* Status Feedback Overlay */}
          {lastResult && (
            <div className={`absolute top-16 md:top-20 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold shadow-lg animate-fade-in z-20 backdrop-blur-sm border ${
              lastResult === 'correct' 
                ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              {lastResult === 'correct' ? 'Correct!' : 'Wrong!'}
            </div>
          )}

          {problem && (
            <div className={`transition-all duration-200 mt-8 md:mt-0 ${lastResult === 'wrong' ? 'animate-shake' : ''}`}>
               <GridDisplay grid={problem.grid} type={problem.type} />
            </div>
          )}
          
        </div>
      </div>

      {/* Keypad - Right */}
      <div className="w-full lg:w-56 mt-2 md:mt-0">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleInput(num)}
                className="
                  aspect-square rounded-xl text-xl font-bold transition-all duration-100 relative overflow-hidden group
                  bg-white/5 text-blue-400 border border-white/10 shadow-lg
                  hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:scale-105 hover:shadow-blue-500/30
                  active:scale-95 active:bg-blue-700
                "
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {num}
              </button>
            ))}
          </div>
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

function GridDisplay({ grid, type }: { grid: (number | null)[], type: 'block' | 'row' | 'col' }) {
  // Styles based on type
  const containerClass = type === 'block' 
    ? "grid grid-cols-3 gap-2 p-2 bg-slate-900 rounded-2xl shadow-inner border border-white/10" 
    : type === 'row'
      ? "grid grid-cols-9 gap-0 p-2 bg-slate-900 rounded-2xl shadow-inner border border-white/10 max-w-full overflow-hidden"
      : "grid grid-rows-9 grid-flow-col gap-0 p-2 bg-slate-900 rounded-2xl shadow-inner border border-white/10 max-h-[60vh] overflow-hidden"; // col

  // Dynamic cell size based on type
  const cellSize = type === 'block' 
    ? "w-20 h-20 sm:w-24 sm:h-24 text-4xl sm:text-5xl" 
    : "w-10 h-10 sm:w-14 sm:h-14 text-2xl sm:text-3xl";

  return (
    <div className={`${containerClass} font-sans`}>
      {grid.map((num, idx) => (
        <div 
          key={idx}
          className={`
            flex items-center justify-center 
            font-bold rounded-lg
            ${cellSize}
            transition-all duration-300
            border-[0.5px] border-slate-700/50
            ${num === null 
              ? 'bg-blue-500/10 !border-2 !border-dashed !border-blue-500/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' 
              : 'bg-slate-800 text-slate-200 !border-white/5 shadow-lg'
            }
          `}
        >
          {num}
        </div>
      ))}
    </div>
  );
}

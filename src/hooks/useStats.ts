import { useState, useEffect } from 'react';

export interface Stats {
  total: number;
  correct: number;
  totalTime: number; // in milliseconds
}

export function useStats(storageKey: string) {
  const [stats, setStats] = useState<Stats>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : { total: 0, correct: 0, totalTime: 0 };
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(stats));
  }, [stats, storageKey]);

  const addRecord = (isCorrect: boolean, timeTaken: number) => {
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      totalTime: prev.totalTime + timeTaken
    }));
  };

  const resetStats = () => {
    setStats({ total: 0, correct: 0, totalTime: 0 });
  };

  return { stats, addRecord, resetStats };
}

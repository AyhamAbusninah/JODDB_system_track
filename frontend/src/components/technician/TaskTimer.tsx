import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { type Task } from '../../services/api';

interface TaskTimerProps {
  task: Task;
}

/**
 * Task Timer Widget - Visual countdown timer with color coding
 * Shows elapsed time vs standard time with efficiency indicator
 * Colors: Green (on track), Yellow (approaching limit), Red (over time)
 */
export const TaskTimer: React.FC<TaskTimerProps> = ({ task }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [efficiency, setEfficiency] = useState(100);

  useEffect(() => {
    if (!task.start_time || task.status !== 'in_progress') {
      return;
    }

    // Calculate initial elapsed time
    const startTime = new Date(task.start_time).getTime();
    const now = Date.now();
    const initialElapsed = Math.floor((now - startTime) / 1000);
    setElapsedSeconds(initialElapsed);

    // Update timer every second
    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(currentElapsed);

      // Calculate efficiency
      if (task.standard_time_seconds) {
        const currentEfficiency = (task.standard_time_seconds / currentElapsed) * 100;
        setEfficiency(Math.round(currentEfficiency));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [task.start_time, task.status, task.standard_time_seconds]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine color based on efficiency
  const getColorClass = () => {
    if (efficiency >= 90) return 'bg-green-500';
    if (efficiency >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColorClass = () => {
    if (efficiency >= 90) return 'text-green-700';
    if (efficiency >= 75) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getBgColorClass = () => {
    if (efficiency >= 90) return 'bg-green-50 border-green-200';
    if (efficiency >= 75) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // Calculate progress percentage
  const progressPercent = task.standard_time_seconds 
    ? Math.min((elapsedSeconds / task.standard_time_seconds) * 100, 100)
    : 0;

  return (
    <div className={`rounded-lg border-2 shadow-lg p-4 ${getBgColorClass()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${getTextColorClass()}`} />
          <span className="font-bold text-gray-800">Active Task Timer</span>
        </div>
        <div className="flex items-center gap-2">
          {efficiency >= 90 ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          )}
          <span className={`font-bold text-lg ${getTextColorClass()}`}>
            {efficiency}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${getColorClass()}`}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>

      {/* Time Display */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-mono font-bold text-gray-800">
            {formatTime(elapsedSeconds)}
          </div>
          <div className="text-xs text-gray-600 uppercase font-semibold mt-1">
            Elapsed Time
          </div>
        </div>
        <div>
          <div className="text-2xl font-mono font-bold text-gray-800">
            {formatTime(task.standard_time_seconds || 0)}
          </div>
          <div className="text-xs text-gray-600 uppercase font-semibold mt-1">
            Standard Time
          </div>
        </div>
      </div>

      {/* Task Info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Operation:</span> {task.operation_name}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Device:</span> {task.device_serial || `#${task.device}`}
        </p>
      </div>
    </div>
  );
};

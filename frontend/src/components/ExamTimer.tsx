import React, { useState, useEffect, useCallback, useRef } from 'react';

interface ExamTimerProps {
  timeLimitMinutes?: number;
  initialRemainingSeconds?: number; // 支持传入初始剩余秒数（用于恢复会话）
  onTimeUp?: () => void;
  onTimeWarning?: (minutesLeft: number) => void;
  className?: string;
}

const ExamTimer: React.FC<ExamTimerProps> = ({
  timeLimitMinutes = 0,
  initialRemainingSeconds,
  onTimeUp,
  onTimeWarning,
  className = ''
}) => {
  const isInitialized = useRef(false);
  
  // 优先使用 initialRemainingSeconds，否则使用 timeLimitMinutes
  const [timeLeft, setTimeLeft] = useState(() => {
    if (initialRemainingSeconds !== undefined && initialRemainingSeconds >= 0) {
      return initialRemainingSeconds;
    }
    return timeLimitMinutes * 60;
  });
  const [isActive, setIsActive] = useState(true); // 直接激活
  const [warningsShown, setWarningsShown] = useState<Set<number>>(new Set());

  // 当服务器时间首次到达时，更新倒计时
  useEffect(() => {
    if (!isInitialized.current && initialRemainingSeconds !== undefined && initialRemainingSeconds >= 0) {
      console.log('ExamTimer: Initializing with server time:', initialRemainingSeconds);
      setTimeLeft(initialRemainingSeconds);
      isInitialized.current = true;
    }
  }, [initialRemainingSeconds]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerColor = useCallback((seconds: number) => {
    if (seconds <= 60) return 'text-red-600'; // Last minute
    if (seconds <= 300) return 'text-orange-600'; // Last 5 minutes
    if (seconds <= 600) return 'text-yellow-600'; // Last 10 minutes
    return 'text-gray-700';
  }, []);

  const getTimerBgColor = useCallback((seconds: number) => {
    if (seconds <= 60) return 'bg-red-50 border-red-200'; // Last minute
    if (seconds <= 300) return 'bg-orange-50 border-orange-200'; // Last 5 minutes
    if (seconds <= 600) return 'bg-yellow-50 border-yellow-200'; // Last 10 minutes
    return 'bg-gray-50 border-gray-200';
  }, []);

  // 不需要额外的初始化 useEffect，useState 已经处理了初始值

  useEffect(() => {
    // 只在组件挂载时创建一次 interval
    if (!isActive || timeLimitMinutes <= 0) {
      return;
    }

    console.log('ExamTimer: Creating interval');
    
    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        console.log('Timer tick:', newTime);

        // Check for warnings - 只在整分钟时触发
        const minutesLeft = Math.floor(newTime / 60);
        const secondsLeft = newTime % 60;
        
        if (secondsLeft === 0) {
          const warningTimes = [10, 5, 1]; // Minutes
          
          if (warningTimes.includes(minutesLeft)) {
            setWarningsShown(prev => {
              if (!prev.has(minutesLeft)) {
                console.log('Triggering warning for', minutesLeft, 'minutes');
                onTimeWarning?.(minutesLeft);
                return new Set(prev).add(minutesLeft);
              }
              return prev;
            });
          }
        }

        // Time's up
        if (newTime <= 0) {
          console.log('Time is up!');
          onTimeUp?.();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      console.log('ExamTimer: Clearing interval on unmount');
      clearInterval(interval);
    };
  }, []); // 空依赖数组，只在挂载时运行一次

  // Don't render if no time limit is set
  if (timeLimitMinutes <= 0) {
    return null;
  }

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getTimerBgColor(timeLeft)} ${className}`}>
      <svg className={`w-5 h-5 ${getTimerColor(timeLeft)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`font-mono font-medium ${getTimerColor(timeLeft)}`}>
        {formatTime(timeLeft)}
      </span>
      {timeLeft <= 300 && ( // Show warning icon in last 5 minutes
        <svg className="w-4 h-4 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
};

export default ExamTimer;
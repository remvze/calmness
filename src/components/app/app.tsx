import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import styles from './app.module.css';
import { cn } from '@/helpers/styles';
import { Container } from '../container';

export type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export interface InfiniteBoxBreathingProps {
  autoStart?: boolean;
  className?: string;
  exhale?: number;
  hold1?: number;
  hold2?: number;
  inhale?: number;
  onCycle?: () => void;
  size?: number;
  strokeWidth?: number;
}

const defaultDurations = {
  exhale: 4000,
  hold1: 4000,
  hold2: 4000,
  inhale: 4000,
};

const easeInOutSine = (x: number): number => {
  return -(Math.cos(Math.PI * x) - 1) / 2;
};

export function App({
  autoStart = true,
  className = '',
  exhale = defaultDurations.exhale,
  hold1 = defaultDurations.hold1,
  hold2 = defaultDurations.hold2,
  inhale = defaultDurations.inhale,
  onCycle,
  size = 250,
  strokeWidth = 12,
}: InfiniteBoxBreathingProps) {
  const [phase, setPhase] = useState<Phase>('inhale');
  const [running, setRunning] = useState<boolean>(autoStart);
  const [timeLeft, setTimeLeft] = useState<number>(inhale);
  const [cycleCount, setCycleCount] = useState<number>(0);

  const getPhaseDuration = useCallback(
    (p: Phase) => {
      switch (p) {
        case 'inhale':
          return inhale;
        case 'hold1':
          return hold1;
        case 'exhale':
          return exhale;
        case 'hold2':
          return hold2;
      }
    },
    [inhale, hold1, exhale, hold2],
  );

  const progress = 1 - timeLeft / getPhaseDuration(phase);
  const rafRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  const nextPhase = (p: Phase): Phase => {
    switch (p) {
      case 'inhale':
        return 'hold1';
      case 'hold1':
        return 'exhale';
      case 'exhale':
        return 'hold2';
      case 'hold2':
        return 'inhale';
    }
  };

  const getCurrentScale = () => {
    const easedProgress = easeInOutSine(progress);

    switch (phase) {
      case 'inhale':
        return 0.5 + 0.5 * easedProgress;
      case 'exhale':
        return 1.0 - 0.5 * easedProgress;
      case 'hold1':
        return 1.0;
      case 'hold2':
        return 0.5;
      default:
        return 0.5;
    }
  };

  useEffect(() => {
    if (liveRef.current) {
      const secondsLeft = Math.ceil(timeLeft / 1000);
      liveRef.current.textContent = `${phase.replace(/\d/, '')} — ${secondsLeft}s`;
    }
  }, [timeLeft, phase]);

  useEffect(() => {
    if (!running) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      prevTimeRef.current = null;
      return;
    }

    const loop = (now: number) => {
      if (!prevTimeRef.current) prevTimeRef.current = now;
      const delta = now - prevTimeRef.current;
      prevTimeRef.current = now;

      setTimeLeft(prev => {
        const next = Math.max(0, prev - delta);
        return next;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      prevTimeRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;

    if (timeLeft <= 0) {
      setPhase(p => {
        const np = nextPhase(p);
        if (p === 'hold2') {
          setCycleCount(c => c + 1);

          if (onCycle) onCycle();
        }

        setTimeLeft(getPhaseDuration(np));
        return np;
      });
    }
  }, [timeLeft, running, getPhaseDuration, onCycle]);

  useEffect(() => {
    setTimeLeft(getPhaseDuration(phase));
  }, [getPhaseDuration, phase]);

  const radius = (size - strokeWidth) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setRunning(r => !r);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={styles.circle} style={{ height: size, width: size }}>
        <svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
          <defs>
            <linearGradient id="gb" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#fd746c" />
              <stop offset="100%" stopColor="#ff9068" />
            </linearGradient>
          </defs>
          <g transform={`translate(${size / 2}, ${size / 2})`}>
            <circle
              fill="transparent"
              r={radius}
              stroke="var(--color-neutral-100)"
              strokeWidth={strokeWidth}
            />
            <motion.circle
              animate={{ strokeDashoffset: dashOffset }}
              fill="transparent"
              r={radius}
              stroke="url(#gb)"
              strokeDasharray={circumference}
              strokeLinecap="round"
              strokeWidth={strokeWidth}
              style={{ rotate: -90, transformOrigin: 'center' }}
              transition={{ duration: 0, ease: 'linear' }}
            />
          </g>
        </svg>

        <div className={styles.controls}>
          <motion.div
            animate={{ scale: getCurrentScale() }}
            aria-hidden
            transition={{ duration: 0 }}
            style={{
              height: size * 0.75,
              width: size * 0.75,
            }}
          />
        </div>

        <div className={styles.state}>
          <div className={styles.phase}>
            {phase.replace(/\d/, '').replace(/^(.)/, s => s.toUpperCase())}
          </div>
        </div>

        <div className={styles.time}>
          {formatSeconds(timeLeft)} <span /> Cycle {cycleCount}
        </div>
      </div>

      <div className={styles.info}>
        <Container>
          <div className={styles.buttons}>
            <button onClick={() => setRunning(prev => !prev)}>
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                setRunning(false);
                setPhase('inhale');
                setTimeLeft(inhale);
                setCycleCount(0);
              }}
            >
              Reset
            </button>
          </div>

          <div className={styles.tip}>
            Tip: Press <kbd>Space</kbd> to toggle start/pause
          </div>
        </Container>
      </div>

      <div
        aria-atomic
        aria-live="polite"
        className={styles.srOnly}
        ref={liveRef}
      />
    </div>
  );
}

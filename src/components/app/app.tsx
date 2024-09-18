import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoIosPlay, IoIosRefresh } from 'react-icons/io';

import { Container } from '../container';

import { padNumber } from '@/helpers/number';

import styles from './app.module.css';

type Exercise = 'Box Breathing' | 'Resonant Breathing' | '4-7-8 Breathing';
type Phase = 'inhale' | 'exhale' | 'holdInhale' | 'holdExhale';

const EXERCISE_PHASES: Record<Exercise, Phase[]> = {
  '4-7-8 Breathing': ['inhale', 'holdInhale', 'exhale'],
  'Box Breathing': ['inhale', 'holdInhale', 'exhale', 'holdExhale'],
  'Resonant Breathing': ['inhale', 'exhale'],
};

const EXERCISE_DURATIONS: Record<Exercise, Partial<Record<Phase, number>>> = {
  '4-7-8 Breathing': { exhale: 8, holdInhale: 7, inhale: 4 },
  'Box Breathing': { exhale: 4, holdExhale: 4, holdInhale: 4, inhale: 4 },
  'Resonant Breathing': { exhale: 5, inhale: 5 },
};

const PHASE_LABELS: Record<Phase, string> = {
  exhale: 'Exhale',
  holdExhale: 'Hold',
  holdInhale: 'Hold',
  inhale: 'Inhale',
};

const DESC: Record<Exercise, string> = {
  '4-7-8 Breathing':
    'Inhale for 4 seconds, hold the breath for 7 seconds, and exhale for 8 seconds. This technique helps reduce stress and promote relaxation.',
  'Box Breathing':
    'Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, and hold again for 4 seconds. It enhances focus and calms the mind.',
  'Resonant Breathing':
    'Breathe in and out evenly, usually around 6 breaths per minute. This method balances the nervous system and improves emotional well-being.',
};

export function App() {
  const [selectedExercise, setSelectedExercise] =
    useState<Exercise>('4-7-8 Breathing');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [running, setRunning] = useState(false); // State to control start/reset
  const [timer, setTimer] = useState(0);

  const phases = useMemo(
    () => EXERCISE_PHASES[selectedExercise],
    [selectedExercise],
  );
  const durations = useMemo(
    () => EXERCISE_DURATIONS[selectedExercise],
    [selectedExercise],
  );

  const currentPhase = phases[phaseIndex];

  const animationVariants = useMemo(
    () => ({
      exhale: {
        transform: 'translate(-50%, -50%) scale(1)',
        transition: { duration: durations.exhale },
      },
      holdExhale: {
        transform: 'translate(-50%, -50%) scale(1)',
        transition: { duration: durations.holdExhale },
      },
      holdInhale: {
        transform: 'translate(-50%, -50%) scale(1.5)',
        transition: { duration: durations.holdInhale },
      },
      inhale: {
        transform: 'translate(-50%, -50%) scale(1.5)',
        transition: { duration: durations.inhale },
      },
    }),
    [durations],
  );

  const resetExercise = useCallback(() => {
    setPhaseIndex(0);
    setRunning(false);
  }, []);

  const updatePhase = useCallback(() => {
    if (running) {
      setPhaseIndex(prevIndex => (prevIndex + 1) % phases.length);
    }
  }, [phases.length, running]);

  useEffect(() => {
    resetExercise();
  }, [selectedExercise, resetExercise]);

  useEffect(() => {
    if (running) {
      const intervalDuration = (durations[currentPhase] || 4) * 1000;
      const interval = setInterval(updatePhase, intervalDuration);

      return () => clearInterval(interval);
    }
  }, [running, currentPhase, durations, updatePhase]);

  useEffect(() => {
    if (running) {
      const interval = setInterval(() => setTimer(prev => prev + 1), 1000);

      return () => clearInterval(interval);
    }
  }, [running]);

  return (
    <Container>
      <div className={styles.exercise}>
        <div className={styles.timer}>
          {padNumber(Math.floor(timer / 60))}:{padNumber(timer % 60)}
        </div>

        {running && (
          <motion.div
            animate={currentPhase}
            className={styles.circle}
            key={selectedExercise}
            variants={animationVariants}
          />
        )}

        <p className={styles.phase}>
          {running ? PHASE_LABELS[currentPhase] : 'Paused'}
        </p>

        <div className={styles.selectWrapper}>
          <select
            className={styles.selectBox}
            disabled={running} // Disable while running
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value as Exercise)}
          >
            {Object.keys(EXERCISE_PHASES).map(exercise => (
              <option key={exercise} value={exercise}>
                {exercise}
              </option>
            ))}
          </select>

          <button
            className={styles.controlButton}
            onClick={() => {
              if (running) {
                resetExercise();
              } else {
                setRunning(true);
              }
            }}
          >
            {running ? <IoIosRefresh /> : <IoIosPlay />}
          </button>
        </div>
      </div>

      <div className={styles.desc}>
        <span>{selectedExercise}:</span> {DESC[selectedExercise]}
      </div>
    </Container>
  );
}

import { useMemo, useCallback, useEffect } from 'react';

export function useSound(url: string, volume: number = 0.5) {
  const audio = useMemo(() => {
    if (typeof window !== 'undefined') return new Audio(url);

    return null;
  }, [url]);

  useEffect(() => {
    if (audio) {
      audio.volume = volume;
    }
  }, [volume, audio]);

  const play = useCallback(() => {
    if (audio) audio.play();
  }, [audio]);

  return play;
}

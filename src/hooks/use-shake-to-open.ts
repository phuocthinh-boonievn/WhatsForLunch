import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { isShake, type Vec3 } from '../lib/surprises';

/** Opens the case on a firm shake. Skipped on web and when reduced motion is on. */
export function useShakeToOpen(enabled: boolean, onShake: () => void) {
  const callback = useRef(onShake);
  callback.current = onShake;

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let previous: Vec3 | null = null;
    let last = 0;
    Accelerometer.setUpdateInterval(80);
    const subscription = Accelerometer.addListener((next) => {
      if (!previous) {
        previous = next;
        return;
      }
      const now = Date.now();
      if (isShake(previous, next) && now - last > 1600) {
        last = now;
        callback.current();
      }
      previous = next;
    });
    return () => subscription.remove();
  }, [enabled]);
}

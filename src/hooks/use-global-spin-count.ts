import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { COUNTER_API } from '../lib/theme';

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

export function useGlobalSpinCount() {
  const [count, setCount] = useState<number | null>(null);
  const alive = useRef(true);

  const accept = useCallback((data: { count?: unknown }) => {
    if (
      alive.current &&
      typeof data.count === 'number' &&
      Number.isSafeInteger(data.count) &&
      data.count >= 0
    ) {
      const value = data.count;
      setCount((previous) => Math.max(previous ?? 0, value));
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    const refresh = async () => {
      if (AppState.currentState !== 'active') return;
      const { signal, cancel } = timeoutSignal(4000);
      try {
        const response = await fetch(COUNTER_API, { cache: 'no-store', signal });
        if (response.ok) accept(await response.json());
      } catch {
        /* A counter outage must not interrupt opening a case. */
      } finally {
        cancel();
      }
    };
    void refresh();
    const interval = setInterval(() => void refresh(), 30000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      alive.current = false;
      clearInterval(interval);
      sub.remove();
    };
  }, [accept]);

  const recordSpin = useCallback(
    async (id: string) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const { signal, cancel } = timeoutSignal(4000);
        try {
          const response = await fetch(COUNTER_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
            signal,
          });
          if (response.ok) {
            accept(await response.json());
            cancel();
            return;
          }
          if (response.status < 500 && response.status !== 429) {
            cancel();
            return;
          }
        } catch {
          /* Retry the same ID: the server counts it only once. */
        } finally {
          cancel();
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
    },
    [accept],
  );

  return { count, enabled: true, recordSpin };
}

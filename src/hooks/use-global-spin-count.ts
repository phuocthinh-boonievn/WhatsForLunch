import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { COUNTER_ENDPOINTS } from '../lib/theme';

export type SpinRecord = {
  id: string;
  food?: { name: string; price: number; image: number; kind: string };
  settings?: { budget: number | null; budgetSlot: string; kind: string; vegetarian: boolean };
};

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

let preferred = 0;

async function readCount(index: number) {
  const { signal, cancel } = timeoutSignal(8000);
  try {
    const response = await fetch(COUNTER_ENDPOINTS[index], { cache: 'no-store', signal });
    if (!response.ok) return null;
    const data = (await response.json()) as { count?: unknown };
    if (typeof data.count === 'number' && Number.isSafeInteger(data.count) && data.count >= 0) {
      return data.count;
    }
    return null;
  } catch {
    return null;
  } finally {
    cancel();
  }
}

export function useGlobalSpinCount() {
  const [count, setCount] = useState<number | null>(null);
  const alive = useRef(true);

  const accept = useCallback((value: number) => {
    if (!alive.current) return;
    setCount((previous) => Math.max(previous ?? 0, value));
  }, []);

  useEffect(() => {
    alive.current = true;
    const refresh = async () => {
      if (AppState.currentState !== 'active') return;
      const first = await readCount(preferred);
      if (first != null) {
        accept(first);
        return;
      }
      const other = preferred === 0 ? 1 : 0;
      const second = await readCount(other);
      if (second != null) {
        preferred = other;
        accept(second);
      }
    };
    void refresh();
    const interval = setInterval(() => void refresh(), 10000);
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
    async (record: SpinRecord) => {
      const order = preferred === 0 ? [0, 1] : [1, 0];
      for (const index of order) {
        const { signal, cancel } = timeoutSignal(8000);
        const modern = index === 0;
        try {
          const response = await fetch(COUNTER_ENDPOINTS[index], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
              modern
                ? { id: record.id, food: record.food, settings: record.settings }
                : { id: record.id },
            ),
            signal,
          });
          if (response.ok) {
            const data = (await response.json()) as { count?: unknown };
            if (typeof data.count === 'number' && Number.isSafeInteger(data.count) && data.count >= 0) {
              accept(data.count);
            }
            preferred = index;
            cancel();
            return;
          }
          if (response.status < 500 && response.status !== 429) {
            cancel();
            continue;
          }
        } catch {
          /* Try the other counter. A failed tally must not block the reveal. */
        } finally {
          cancel();
        }
      }
    },
    [accept],
  );

  return { count, enabled: true, recordSpin };
}

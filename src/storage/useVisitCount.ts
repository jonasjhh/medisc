import { useEffect, useState } from "react";
import { getItem, setItem } from "./localStore";

const VISIT_COUNT_KEY = "visitCount";

// Demonstrates that data set through localforage survives reloads and
// works offline once the service worker has cached the app shell.
export function useVisitCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const previous = (await getItem<number>(VISIT_COUNT_KEY)) ?? 0;
      const next = previous + 1;
      await setItem(VISIT_COUNT_KEY, next);
      if (!cancelled) {
        setCount(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}

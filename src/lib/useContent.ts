import { useEffect, useRef, useState } from 'react';

/**
 * Loads a page's content once from the data layer (src/data). Returns
 * undefined until it arrives, so pages can show a loading state.
 */
export function useContent<T>(load: () => Promise<T>): T | undefined {
  const [data, setData] = useState<T>();
  // Read the loader once: pages pass an inline function.
  const loader = useRef(load);
  useEffect(() => {
    let live = true;
    loader.current().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, []);
  return data;
}

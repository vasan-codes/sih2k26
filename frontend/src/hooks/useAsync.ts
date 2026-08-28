import { useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const counter = useRef(0);

  const load = () => {
    const id = ++counter.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => {
        if (id === counter.current) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (id === counter.current) setState({ data: null, loading: false, error: err.message });
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, deps);

  return { ...state, reload: load };
}

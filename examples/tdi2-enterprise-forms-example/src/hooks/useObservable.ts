import { useState, useEffect } from "react";
import { Observable } from "rxjs";

export function useObservable<T>(observable$: Observable<T>): T {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    const sub = observable$.subscribe(setValue);
    return () => sub.unsubscribe();
  }, [observable$]);
  return value;
}
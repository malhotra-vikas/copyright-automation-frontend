import { DependencyList, useEffect } from "react";

function useEffectAsync(
  effect: () => Promise<void>,
  deps?: DependencyList,
  destructor?: () => void,
): void {
  return useEffect(() => {
    effect();

    return destructor;
  }, deps);
}

export { useEffectAsync };

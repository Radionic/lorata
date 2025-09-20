import { useRef, useMemo } from "react";

export function useHistory<T>() {
  const history = useRef<T[][]>([[]]);
  const historyStep = useRef(0);

  const saveToHistory = (newState: T[]) => {
    // Remove all states after current step
    history.current = history.current.slice(0, historyStep.current + 1);
    // Push the new state
    history.current = history.current.concat([newState]);
    historyStep.current += 1;
  };

  const undo = () => {
    if (historyStep.current === 0) {
      return;
    }
    historyStep.current -= 1;
    const previous = history.current[historyStep.current];
    return previous;
  };

  const redo = () => {
    if (historyStep.current === history.current.length - 1) {
      return;
    }
    historyStep.current += 1;
    const next = history.current[historyStep.current];
    return next;
  };

  const canUndo = useMemo(() => historyStep.current > 0, [historyStep.current]);
  const canRedo = useMemo(
    () => historyStep.current < history.current.length - 1,
    [historyStep.current, history.current.length]
  );

  return {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

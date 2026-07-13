import { useEffect } from "react";

export const useMDTKeyboard = (handlers: {
  onDispatch?: () => void;
  onBroadcast?: () => void;
  onSearch?: () => void;
  onMap?: () => void;
  onAnalytics?: () => void;
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // skip if focused in input/textarea
      const tgt = e.target as HTMLElement;
      if (tgt?.tagName === "INPUT" || tgt?.tagName === "TEXTAREA" || tgt?.isContentEditable) {
        if (e.key === "/" && tgt?.tagName !== "INPUT" && tgt?.tagName !== "TEXTAREA") {
          e.preventDefault();
          handlers.onSearch?.();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "d":
          e.preventDefault();
          handlers.onDispatch?.();
          break;
        case "b":
          e.preventDefault();
          handlers.onBroadcast?.();
          break;
        case "/":
          e.preventDefault();
          handlers.onSearch?.();
          break;
        case "m":
          e.preventDefault();
          handlers.onMap?.();
          break;
        case "a":
          e.preventDefault();
          handlers.onAnalytics?.();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlers]);
};

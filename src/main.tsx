import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isChunkLoadError, reloadForChunkError } from "@/utils/chunkReload";
import { SpeedInsights } from "@vercel/speed-insights/react";

const handleChunkError = (msg: string) => {
  if (isChunkLoadError(msg)) reloadForChunkError();
};
window.addEventListener("error", (e) => handleChunkError(e.message || ""));
window.addEventListener("unhandledrejection", (e) =>
  handleChunkError(String(e.reason?.message || e.reason || ""))
);
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  reloadForChunkError();
});

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SpeedInsights />
  </>
);

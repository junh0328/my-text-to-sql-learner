"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "google_ai_api_key";

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useApiKey() {
  const apiKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    window.dispatchEvent(new Event("storage"));
  }, []);

  const removeApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("storage"));
  }, []);

  return {
    apiKey,
    setApiKey,
    removeApiKey,
    needsApiKey: !apiKey,
  };
}

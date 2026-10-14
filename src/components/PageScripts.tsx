"use client";

import { useEffect } from "react";
import { initSite } from "@/lib/site";

type Listener = EventListenerOrEventListenerObject;

/**
 * Runs an export's inline script once the server-rendered markup is in the DOM.
 * The scripts were written for a classic page load, so DOMContentLoaded/load
 * listeners they register are invoked right after the script has run.
 */
function runInlineScript(code: string) {
  const pending: Array<() => void> = [];
  const defer = (target: Document | Window, type: string, listener: Listener) =>
    pending.push(() => {
      const event = new Event(type);
      if (typeof listener === "function") listener.call(target, event);
      else listener.handleEvent(event);
    });

  const docAdd = document.addEventListener;
  const winAdd = window.addEventListener;
  document.addEventListener = function (type: string, listener: Listener, options?: boolean | AddEventListenerOptions) {
    if (type === "DOMContentLoaded") return defer(document, type, listener);
    return docAdd.call(document, type, listener, options);
  } as typeof document.addEventListener;
  window.addEventListener = function (type: string, listener: Listener, options?: boolean | AddEventListenerOptions) {
    if (type === "DOMContentLoaded" || type === "load") return defer(window, type, listener);
    return winAdd.call(window, type, listener, options);
  } as typeof window.addEventListener;

  try {
    const script = document.createElement("script");
    script.text = code;
    document.body.appendChild(script);
  } finally {
    document.addEventListener = docAdd;
    window.addEventListener = winAdd;
  }
  pending.forEach((run) => run());
}

export default function PageScripts({ page, code, title }: { page: string; code: string; title?: string }) {
  useEffect(() => {
    // Pages are full reloads (plain links inside the exported markup); guard against Strict Mode double effects.
    const w = window as Window & { __baiedorPage?: string };
    if (w.__baiedorPage === page) return;
    w.__baiedorPage = page;

    if (title) document.title = `${title} • Hôtel Baie d'Or`;
    if (code.trim()) runInlineScript(code);
    initSite(page);
  }, [page, code, title]);

  return null;
}

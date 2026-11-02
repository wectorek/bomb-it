"use client";

import { useLayoutEffect, useRef } from "react";

// Ref trzyma najnowszą wartość zanim odpalą się efekty i timery.
export function useLatest(value) {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

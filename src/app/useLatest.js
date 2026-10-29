"use client";

import { useRef } from "react";

export function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

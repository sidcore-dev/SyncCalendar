"use client";

import type { MemberSession } from "./types";

const key = (planId: string) => `sync:member:${planId}`;

/** Reads the current browser's identity for a given plan out of localStorage. */
export function getMemberSession(planId: string): MemberSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(planId));
    if (!raw) return null;
    return JSON.parse(raw) as MemberSession;
  } catch {
    return null;
  }
}

export function setMemberSession(session: MemberSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(session.planId), JSON.stringify(session));
}

export function clearMemberSession(planId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(planId));
}

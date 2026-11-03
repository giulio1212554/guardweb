import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskSecret(value: string, visible = 4): string {
  if (!value || value.length <= visible * 2) {
    return "****";
  }
  return `${value.slice(0, visible)}****${value.slice(-visible)}`;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

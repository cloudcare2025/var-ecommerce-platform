"use client";

import { create } from "zustand";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";

interface ToastStore {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export const useToast = create<ToastStore>((set) => ({
  message: null,
  show: (message: string) => {
    set({ message });
    setTimeout(() => set({ message: null }), 3000);
  },
  hide: () => set({ message: null }),
}));

export function Toast() {
  const { message } = useToast();

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] bg-[#1F2929] text-white px-5 py-3.5 rounded-lg shadow-xl flex items-center gap-3 animate-slide-in-right">
      <CheckCircle className="w-5 h-5 text-[#22C55E]" />
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
}

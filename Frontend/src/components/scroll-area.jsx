import React from "react";
import { cn } from "../lib/utils";

/**
 * Đơn giản hóa: chỉ là wrapper overflow-auto với scrollbar mảnh.
 * Có thể thay bằng lib khác nếu bạn muốn scrollbars tuỳ biến.
 */
export function ScrollArea({ className, children }) {
  return (
    <div
      className={cn(
        "overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/70 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/80",
        className
      )}
    >
      {children}
    </div>
  );
}

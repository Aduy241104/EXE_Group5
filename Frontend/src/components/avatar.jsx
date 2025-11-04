import React from "react";
import { cn } from "../lib/utils";

export function Avatar({ className, children }) {
  return (
    <div className={cn("relative inline-flex h-10 w-10 overflow-hidden rounded-full bg-slate-200", className)}>
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt }) {
  return <img src={src} alt={alt} className="h-full w-full object-cover" />;
}

export function AvatarFallback({ children, className }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center text-sm font-medium text-slate-600",
        className
      )}
    >
      {children}
    </div>
  );
}

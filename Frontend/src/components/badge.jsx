import React from "react";
import { cn } from "../lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors";
  const styles = {
    default: "bg-orange-500 text-white border-transparent",
    secondary: "bg-slate-100 text-slate-900 border-slate-200",
    outline: "bg-transparent text-slate-700 border-slate-300",
    destructive: "bg-red-500 text-white border-transparent",
  };
  return <span className={cn(base, styles[variant], className)} {...props} />;
}

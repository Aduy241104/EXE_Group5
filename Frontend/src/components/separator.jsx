import React from "react";
import { cn } from "../lib/utils";

export function Separator({ className, orientation = "horizontal" }) {
  const classes =
    orientation === "vertical"
      ? "h-full w-px bg-slate-200"
      : "h-px w-full bg-slate-200";
  return <div className={cn(classes, className)} role="separator" />;
}

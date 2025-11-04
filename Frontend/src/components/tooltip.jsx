import React, { useState, createContext, useContext, cloneElement } from "react";
import { cn } from "../lib/utils";

const Ctx = createContext(null);

export function TooltipProvider({ children }) {
  return <>{children}</>;
}

export function Tooltip({ children }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function TooltipTrigger({ asChild = false, children }) {
  const { setOpen } = useContext(Ctx);
  const props = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };
  return asChild ? cloneElement(children, props) : <button {...props}>{children}</button>;
}

export function TooltipContent({ className, children }) {
  const { open } = useContext(Ctx);
  if (!open) return null;
  return (
    <div
      role="tooltip"
      className={cn(
        "z-50 -mt-1 w-max rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

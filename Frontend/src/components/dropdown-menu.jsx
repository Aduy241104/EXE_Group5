import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { cn } from "../lib/utils";

const Ctx = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
    </div>
  );
}

export function DropdownMenuTrigger({ asChild = false, children }) {
  const { open, setOpen } = useContext(Ctx);
  const props = { onClick: () => setOpen(!open) };
  return asChild ? React.cloneElement(children, props) : <button {...props}>{children}</button>;
}

export function DropdownMenuContent({ children, align = "start", className }) {
  const { open } = useContext(Ctx);
  if (!open) return null;

  const alignClass =
    align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left";

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[12rem] rounded-md border border-slate-200 bg-white p-1 shadow-md focus:outline-none",
        alignClass,
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, className }) {
  return (
    <div className={cn("px-2 py-1.5 text-xs font-semibold text-slate-500", className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px w-full bg-slate-200" />;
}

export function DropdownMenuItem({ children, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100",
        className
      )}
    >
      {children}
    </button>
  );
}

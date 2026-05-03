import * as React from "react";
import { cn } from "@/src/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  key?: React.Key;
}

export function GlassCard({ children, className, glow = false, ...props }: GlassCardProps) {
  return (
    <div 
      {...props}
      className={cn(
        "surface-glass glass-stroke rounded-aura-card p-6 overflow-hidden relative group",
        glow && "shadow-[0_0_50px_rgba(99,102,241,0.1)]",
        className
      )}
    >
      <div className="relative z-10">
        {children}
      </div>
      {/* Subtle interior glow */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-aura-primary/5 blur-[80px] pointer-events-none group-hover:bg-aura-primary/10 transition-colors duration-700" />
    </div>
  );
}

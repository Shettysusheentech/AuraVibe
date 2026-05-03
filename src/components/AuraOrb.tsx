import { motion } from "motion/react";

export function AuraOrb({ className, pulse = true }: { className?: string; pulse?: boolean }) {
  return (
    <div className={className}>
      <motion.div
        animate={pulse ? {
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.8, 0.6],
        } : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-full h-full relative"
      >
        {/* Deep Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-aura-primary/30 via-indigo-600/20 to-aura-tertiary/20 rounded-full blur-[80px]" />
        
        {/* Core Orb */}
        <div className="absolute inset-4 bg-gradient-to-br from-aura-primary/50 via-aura-primary-container/40 to-aura-secondary/30 rounded-full opacity-50 mix-blend-screen" />
        
        {/* Surface Highlight */}
        <div className="absolute inset-10 bg-white/5 rounded-full blur-2xl" />
      </motion.div>
    </div>
  );
}

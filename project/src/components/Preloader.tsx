import React from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';

export const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-md-surface-container flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-24 h-24 bg-md-primary/10 rounded-[32px] flex items-center justify-center relative overflow-hidden backdrop-blur-xl border border-white/10">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3,
              ease: "easeInOut" 
            }}
          >
            <FileText size={48} className="text-md-primary" />
          </motion.div>
          
          {/* Animated fill effect */}
          <motion.div 
            className="absolute bottom-0 left-0 w-full bg-md-primary/20"
            initial={{ height: "0%" }}
            animate={{ height: "100%" }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-md-primary rounded-full shadow-[0_0_8px_rgba(var(--color-md-primary),0.5)]"
            animate={{
              rotate: 360,
              x: [40 * Math.cos(i * 120 * Math.PI / 180), 40 * Math.cos((i * 120 + 360) * Math.PI / 180)],
              y: [40 * Math.sin(i * 120 * Math.PI / 180), 40 * Math.sin((i * 120 + 360) * Math.PI / 180)],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-8 text-center"
      >
        <h1 className="text-2xl font-bold text-md-on-surface tracking-tight">DEV NOTE</h1>
        <p className="text-sm text-md-on-surface-variant font-medium mt-1 opacity-60">Initializing secure storage...</p>
      </motion.div>
      
      <div className="absolute bottom-12 w-48 h-1 bg-md-outline-variant/20 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-md-primary rounded-full"
          initial={{ width: "0%", x: "-100%" }}
          animate={{ width: "40%", x: "250%" }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};

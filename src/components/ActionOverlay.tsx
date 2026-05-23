import React from 'react';
import { motion } from 'motion/react';

export const ActionOverlay: React.FC<{ message?: string }> = ({ message = 'Processing...' }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-black/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-md-surface-container-high p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-white/10"
      >
        <div className="relative w-12 h-12">
          <motion.div
            className="absolute inset-0 border-4 border-md-primary/20 rounded-full"
          />
          <motion.div
            className="absolute inset-0 border-4 border-t-md-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <span className="text-sm font-bold text-md-on-surface tracking-wide">{message}</span>
      </motion.div>
    </div>
  );
};

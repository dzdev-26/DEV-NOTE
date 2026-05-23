import React from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';

export const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#f8e488] flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-28 h-28 bg-[#f5d661] rounded-[40px] flex items-center justify-center relative shadow-lg">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut" 
            }}
          >
            <FileText size={56} className="text-[#5c4a1a]" strokeWidth={2.5} />
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-10 text-center"
      >
        <h1 className="text-3xl font-black text-[#42340d] tracking-tight">DEV NOTE</h1>
        <p className="text-[13px] text-[#42340d]/60 font-bold mt-2">Initializing secure storage...</p>
      </motion.div>
      
      <div className="absolute bottom-20 w-40 h-1 bg-[#42340d]/10 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-[#42340d]/30 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
};

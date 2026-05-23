import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';

interface SecurityLockProps {
  correctPin: string;
  onUnlock: () => void;
}

export function SecurityLock({ correctPin, onUnlock }: SecurityLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeypad = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="absolute inset-0 bg-md-surface flex flex-col items-center justify-center z-[100] p-6 animate-in fade-in">
      <div className="mb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-md-primary-container rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-md-on-primary-container" />
        </div>
        <h2 className="text-2xl font-medium text-md-on-surface">Lock Screen</h2>
        <p className="text-md-on-surface-variant mt-2 text-center">
          Enter 4-digit PIN to access your notes
        </p>
      </div>

      <div className={`flex gap-4 mb-16 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i}
            className={`w-4 h-4 rounded-full border-2 border-md-primary transition-all duration-200 ${
              pin.length > i ? 'bg-md-primary scale-110' : 'bg-transparent'
            } ${error ? 'border-md-error bg-md-error' : ''}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button 
            key={num}
            onClick={() => handleKeypad(num)}
            className="w-16 h-16 rounded-full bg-md-surface-container-high text-xl font-medium text-md-on-surface active:bg-md-primary-container active:scale-90 transition-all flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        <div />
        <button 
          onClick={() => handleKeypad('0')}
          className="w-16 h-16 rounded-full bg-md-surface-container-high text-xl font-medium text-md-on-surface active:bg-md-primary-container active:scale-90 transition-all flex items-center justify-center"
        >
          0
        </button>
        <button 
          onClick={handleDelete}
          className="w-16 h-16 rounded-full flex items-center justify-center text-md-on-surface-variant active:scale-90 transition-all"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}} />
    </div>
  );
}

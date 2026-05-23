import React from 'react';
import { ArrowLeft, Lock, Type, AlignLeft, Layout } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onUpdate: (partial: Partial<AppSettings>) => void;
}

export function SettingsModal({ settings, onClose, onUpdate }: SettingsModalProps) {
  const handlePinToggle = () => {
    if (settings.pin) {
      onUpdate({ pin: null });
    } else {
      const pin = prompt('Enter a 4-digit PIN:');
      if (pin && /^\d{4}$/.test(pin)) {
        onUpdate({ pin });
      } else if (pin) {
        alert('Invalid PIN. Must be 4 digits.');
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-md-surface z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      <header className="h-14 px-2 flex items-center border-b border-md-outline-variant/30 shrink-0">
        <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-md-on-surface" />
        </button>
        <h2 className="text-[18px] font-normal leading-7 ml-2 text-md-on-surface">Settings</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
        {/* Security */}
        <section>
          <h3 className="text-sm font-medium text-md-primary mb-4 uppercase tracking-wider">Security</h3>
          <button 
            onClick={handlePinToggle}
            className="w-full flex items-center justify-between p-4 bg-md-surface-container-high rounded-2xl hover:bg-md-primary-container transition-colors"
          >
            <div className="flex items-center gap-4">
              <Lock className="w-5 h-5 text-md-on-surface-variant" />
              <span className="font-medium text-md-on-surface">PIN Lock Protection</span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.pin ? 'bg-md-primary' : 'bg-md-outline'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.pin ? 'left-7' : 'left-1'}`} />
            </div>
          </button>
        </section>

        {/* Typography */}
        <section>
          <h3 className="text-sm font-medium text-md-primary mb-4 uppercase tracking-wider">Typography</h3>
          <div className="space-y-4">
            <div className="p-4 bg-md-surface-container-high rounded-2xl space-y-4">
              <div className="flex items-center gap-4 text-md-on-surface-variant">
                <Type className="w-5 h-5" />
                <span className="font-medium flex-1">Font Size: {settings.fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="24" 
                step="1"
                value={settings.fontSize}
                onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                className="w-full accent-md-primary"
              />
            </div>

            <div className="p-4 bg-md-surface-container-high rounded-2xl space-y-4">
              <div className="flex items-center gap-4 text-md-on-surface-variant">
                <AlignLeft className="w-5 h-5" />
                <span className="font-medium">Line Spacing</span>
              </div>
              <div className="flex gap-2">
                {(['normal', 'relaxed', 'loose'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => onUpdate({ lineSpacing: style })}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium capitalize transition-colors ${
                      settings.lineSpacing === style 
                        ? 'bg-md-primary text-md-on-primary' 
                        : 'bg-md-surface-container text-md-on-surface-variant'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Visualization */}
        <section>
          <h3 className="text-sm font-medium text-md-primary mb-4 uppercase tracking-wider">Interface</h3>
          <button 
            onClick={() => onUpdate({ showLines: !settings.showLines })}
            className="w-full flex items-center justify-between p-4 bg-md-surface-container-high rounded-2xl hover:bg-md-primary-container transition-colors"
          >
            <div className="flex items-center gap-4">
              <Layout className="w-5 h-5 text-md-on-surface-variant" />
              <span className="font-medium text-md-on-surface">Notebook Lines Backdrop</span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.showLines ? 'bg-md-primary' : 'bg-md-outline'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.showLines ? 'left-7' : 'left-1'}`} />
            </div>
          </button>
        </section>
      </div>
    </div>
  );
}

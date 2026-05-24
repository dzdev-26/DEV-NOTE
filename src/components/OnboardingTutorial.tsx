import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Folder, CheckSquare, AlignJustify, Lock, RotateCcw, 
  ArrowRight, Check, X, Plus, Wand2, Clock, Play, HelpCircle
} from 'lucide-react';
import { AppSettings } from '../types';

interface OnboardingTutorialProps {
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onClose: () => void;
  allNotesCount: number;
}

export function OnboardingTutorial({ settings, onUpdateSettings, onClose, allNotesCount }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Guided Steps Config - with Dual Bangla & English real-time directions
  const steps = [
    {
      targetId: 'tour-intro', // centers on screen
      title: 'DEV NOTE লাইভ টিউটোরিয়াল 🎉',
      descBn: 'স্বাগতম! আসুন ১ মিনিটে এই মিনিমাল অফলাইন নোটপ্যাড অ্যাপটির চমৎকার ফিচারগুলো বাস্তবে ঘুরে চিনে নিই।',
      descEn: 'Welcome! Let\'s take a 1-minute live interactive tour of your offline workspace in real-time.',
      actionLabelBn: 'চলুন শুরু করি ➜',
      actionLabelEn: 'Start Tour ➜'
    },
    {
      targetId: 'tour-hamburger',
      title: 'সাইডবার ক্যাটাগরি মেনু 📂',
      descBn: 'এই মেনুটি চেপে বিভিন্ন ক্যাটাগরি তৈরি, লোকাল ড্রাফট ব্যাকআপ এবং রিসাইকেল বিন অ্যাক্সেস করতে পারবেন।',
      descEn: 'Tap the Menu icon to create categories, restore from trash, or export offline backups.',
      actionLabelBn: 'সাইডবার ওপেন করুন',
      actionLabelEn: 'Open Sidebar',
      onBefore: () => {
        // Just make sure editor is not open
      },
      onAdvance: () => {
        // Auto open sidebar if not already open
        document.getElementById('tour-hamburger')?.click();
      }
    },
    {
      targetId: 'tour-sidebar-new-category',
      title: 'ক্যাটাগরি তৈরি করুন ➕',
      descBn: 'সাইডবারের এখান থেকে বিভিন্ন ফোল্ডার তৈরি করে আপনার নোটগুলো আলাদা ক্যাটাগরিতে সাজিয়ে রাখুন।',
      descEn: 'Create folders like "Finance", "Study", or "Drafts" to easily categorize your listings.',
      actionLabelBn: 'পরবর্তী ধাপ ➜',
      actionLabelEn: 'Next Feature ➜',
      onBefore: () => {
        // Auto open if sidebar closed
        if (!document.getElementById('tour-sidebar-new-category')) {
          document.getElementById('tour-hamburger')?.click();
        }
      }
    },
    {
      targetId: 'tour-sidebar-keywords',
      title: 'কিওয়ার্ড ড্যাশবোর্ড 🏷️',
      descBn: 'এখান থেকে শর্টকাট কিওয়ার্ড অ্যাড, এডিট, ডিলিট এবং এডিটর বারে এদের ভিজিবিলিটি অন-অফ করতে পারবেন।',
      descEn: 'Add, edit, delete, and control accessibility of custom shortcut keywords on the editor bar.',
      actionLabelBn: 'পরবর্তী ধাপ ➜',
      actionLabelEn: 'Next Feature ➜',
      onBefore: () => {
        // Auto open if sidebar closed
        if (!document.getElementById('tour-sidebar-keywords')) {
          document.getElementById('tour-hamburger')?.click();
        }
      }
    },
    {
      targetId: 'tour-view-mode',
      title: 'ভিউ লেআউট পরিবর্তন 📊',
      descBn: 'আপনার ইচ্ছে অনুযায়ী নোটের তালিকা লিস্ট, গ্রিড বা বড় কার্ড ভিউতে পরিবর্তন করে সাজিয়ে রাখুন।',
      descEn: 'Convert note listings into Detail rows, standard Grid squares, or Large card styles instantly.',
      actionLabelBn: 'লেআউট পরিবর্তন করুন',
      actionLabelEn: 'Switch Layout',
      onBefore: () => {
        // Close sidebar if open so we can see the header clearly
        const backdrop = document.querySelector('.bg-black\\/60');
        if (backdrop) {
          (backdrop as HTMLDivElement).click();
        }
      },
      onAdvance: () => {
        document.getElementById('tour-view-mode')?.click();
      }
    },
    {
      targetId: 'tour-search',
      title: 'স্মার্ট অফলাইন সার্চ 🔍',
      descBn: 'যেকোনো সময় অফলাইনে সুরক্ষিতভাবে নোটের টাইটেল, কন্টেন্ট বা ট্যাগ সার্চ করে বের করতে পারবেন।',
      descEn: 'Instantly search through offline text, titles, or tag groupings without server latency.',
      actionLabelBn: 'পরবর্তী ধাপ ➜',
      actionLabelEn: 'Next Feature ➜',
      onBefore: () => {
        // close layout menu if still rendering
        const clickOff = document.querySelector('.fixed.inset-0.z-\\[60\\]');
        if (clickOff) (clickOff as HTMLDivElement).click();
      }
    },
    {
      targetId: 'tour-fab-new',
      title: 'নতুন নোট তৈরি ✍️',
      descBn: 'এই ফ্লোটিং প্লাস বাটনটি ক্লিক করে তাৎক্ষণিক ফুল-স্ক্রিন রাইটিং এডিটর চালু করতে পারবেন।',
      descEn: 'Ready to write? Click the Plus action button to jump directly into the writing editor.',
      actionLabelBn: 'নোটবুক ওপেন করুন',
      actionLabelEn: 'Open Writer',
      onAdvance: () => {
        // Trigger create note
        document.getElementById('tour-fab-new')?.click();
      }
    },
    {
      targetId: 'tour-note-title',
      title: 'ডিসট্র্যাকশন-ফ্রি ওয়ার্কস্পেস 🎯',
      descBn: 'সম্পূর্ণ পিসফুল রাইটিং জোন। আপনার লেখার প্রতিটা ক্যারেক্টার তাৎক্ষণিকভাবে সুরক্ষিতভাবে অটো-সেভ হয়!',
      descEn: 'A pristine writing center. Words typed here autosave to secure local storage immediately.',
      actionLabelBn: 'পরবর্তী এডিটর ফিচার ➜',
      actionLabelEn: 'Keep Going ➜',
      onBefore: () => {
        // Auto open creator if not open
        if (!document.getElementById('tour-note-title')) {
          document.getElementById('tour-fab-new')?.click();
        }
      }
    },
    {
      targetId: 'tour-preview-toggle',
      title: 'প্রিভিউ ও রিড মোড 👁️',
      descBn: 'প্রিভিউ বা রিড মোডে ডিস্ট্র্যাকশন-ফ্রি রিডিং করুন। এই মোডে টেক্সট খুব সহজে সিলেক্ট ও কপি করা যায়!',
      descEn: 'Toggle Preview & Read Mode to view notes cleanly. Select and copy text directly without editing overlays.',
      actionLabelBn: 'পরবর্তী ধাপ ➜',
      actionLabelEn: 'Next Feature ➜',
      onBefore: () => {
        if (!document.getElementById('tour-note-title')) {
          document.getElementById('tour-fab-new')?.click();
        }
      }
    },
    {
      targetId: 'tour-magic-format',
      title: 'ম্যাজিক ফরম্যাটিং ও কারেকশন 🪄',
      descBn: 'এই জাদুকরী বাটনটি দিয়ে অতিরিক্ত স্পেস বা ডাবল স্পেস সংস্কার করে সুন্দরভাবে লেখা ফর্ম্যাট করুন!',
      descEn: 'This magic formatting wizard automatically cleans up extra spacing and formats paragraphs instantly.',
      actionLabelBn: 'পরবর্তী ধাপ ➜',
      actionLabelEn: 'Next Tool ➜'
    },
    {
      targetId: 'tour-revision-history',
      title: '১৫টি ড্রাফট রিভিশন হিস্টোরি ⏳',
      descBn: 'ভুল করে কিছু মুছে ফেলছেন? হিস্টোরি বাটনটি দিয়ে নোটের যেকোনো পূর্ববর্তী সংস্করণ বা ড্রাফট ১৫বার পর্যন্ত ফিরিয়ে আনতে পারবেন!',
      descEn: 'Accidentally overwrote a plan? Restore and trace up to 15 historic snapshot versions with single-tap rollbacks.',
      actionLabelBn: 'পরবর্তী ধাপ ➜',
      actionLabelEn: 'Next Feature ➜'
    },
    {
      targetId: 'tour-save-note',
      title: 'সহজ সেভ ও রিটার্ন ✅',
      descBn: 'আপনার লেখা নোটটি চূড়ান্তভাবে তালিকায় যোগ করতে টিকচিহ্ন বাটনটি চাপুন বা ব্যাক অ্যারো কী দিন। আপনার গাইড কমপ্লিট!',
      descEn: 'Hit this check mark or tap the back arrow when you are and then your checklist is logged and updated!',
      actionLabelBn: 'টিউটোরিয়াল শেষ করুন 🎉',
      actionLabelEn: 'Finish Guide 🎉',
      onAdvance: () => {
        document.getElementById('tour-save-note')?.click();
      }
    }
  ];

  const currentStepDef = steps[currentStep];

  // Dynamic positioning tracker for the highlighted spotlight rectangle
  useEffect(() => {
    let active = true;

    const findAndSetTarget = () => {
      if (!active) return;
      if (currentStepDef.targetId === 'tour-intro' || currentStepDef.targetId === 'tour-conclude') {
        setCoords(null);
        return;
      }

      // Check step before callback
      if (currentStepDef.onBefore) {
        currentStepDef.onBefore();
      }

      let element = document.getElementById(currentStepDef.targetId);
      if (!element) {
        element = document.querySelector(`[title="${currentStepDef.targetId}"]`);
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        const container = containerRef.current || document.body;
        const containerRect = container.getBoundingClientRect();

        // Calculate positions relative to the max-w-lg container frame
        setCoords({
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          w: rect.width,
          h: rect.height
        });
      } else {
        setCoords(null);
      }
    };

    findAndSetTarget();

    const interval = setInterval(findAndSetTarget, 200);
    window.addEventListener('resize', findAndSetTarget);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('resize', findAndSetTarget);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStepDef.onAdvance) {
      currentStepDef.onAdvance();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSpotlightClick = () => {
    // Forward click to actual DOM element inside spotlight zone
    const element = document.getElementById(currentStepDef.targetId);
    if (element) {
      element.click();
      // Auto-advance some steps on direct interactions to feel fully alive!
      if (['tour-hamburger', 'tour-fab-new', 'tour-save-note'].includes(currentStepDef.targetId)) {
        setTimeout(() => {
          setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
        }, 300);
      }
    }
  };

  // Dimensions of container standard limits
  const width = containerRef.current?.clientWidth || 390;
  const height = containerRef.current?.clientHeight || 800;

  // Render SVG spotlight mask cutout path
  const maskPath = coords ? (
    `M 0,0 L ${width},0 L ${width},${height} L 0,${height} Z ` +
    `M ${coords.x - 6},${coords.y - 6} ` +
    `L ${coords.x - 6},${coords.y + coords.h + 6} ` +
    `L ${coords.x + coords.w + 6},${coords.y + coords.h + 6} ` +
    `L ${coords.x + coords.w + 6},${coords.y - 6} Z`
  ) : `M 0,0 L ${width},0 L ${width},${height} L 0,${height} Z`;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-[110] flex flex-col pointer-events-none overflow-hidden select-none"
    >
      {/* Darkened SVG mask with transparent spotlight hole */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <path 
          d={maskPath} 
          fill="rgba(0, 0, 0, 0.72)" 
          fillRule="evenodd"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Target spotlight glowing ripple ring */}
      {coords && (
        <button
          onClick={handleSpotlightClick}
          className="absolute border-2 border-dashed border-yellow-400 bg-transparent rounded-xl pointer-events-auto cursor-pointer animate-pulse transition-all duration-300 ease-out flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)] bg-yellow-400/10"
          style={{
            left: `${coords.x - 8}px`,
            top: `${coords.y - 8}px`,
            width: `${coords.w + 16}px`,
            height: `${coords.h + 16}px`,
          }}
          title="Click to interact"
        >
          {/* Internal ripple ring */}
          <span className="absolute animate-ping inline-flex h-full w-full rounded-xl bg-yellow-400 opacity-20"></span>
        </button>
      )}

      {/* FLOATING TOUR CARD DESIGN (Material You) */}
      <div 
        className="absolute w-[92%] left-[4%] bg-md-surface-container rounded-2xl p-4 sm:p-5 shadow-2xl border border-md-outline/10 pointer-events-auto flex flex-col transition-all duration-300 z-50 animate-in zoom-in-95 duration-200"
        style={(() => {
          if (!coords) return { top: '30%' };
          
          if (coords.y > height / 2) {
            // Highlighted element is in the lower half of the screen.
            // Position the floating tour card securely at the very top of the screen (top: 8px to give max gap).
            return { top: '8px' };
          } else {
            // Highlighted element is in the upper half of the screen.
            // Position the floating tour card securely at the bottom of the screen.
            return { bottom: '8px' };
          }
        })()}
      >
        {/* Banner with Progress Bar */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="text-[11px] bg-yellow-400/20 text-yellow-500 font-black rounded-lg px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
              <Play size={9} fill="currentColor" /> Live Interactive
            </div>
            <span className="text-[10px] text-md-on-surface-variant font-bold opacity-70">
              ({currentStep + 1}/{steps.length})
            </span>
          </div>

          <button 
            id="btn-skip-guided-tour"
            onClick={onClose}
            className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 hover:bg-black/10 text-md-on-surface-variant font-semibold transition-all flex items-center gap-0.5"
          >
            Skip <X size={10} />
          </button>
        </div>

        {/* Dynamic Horizontal Progress Bar */}
        <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden mb-2.5">
          <div 
            className="h-full bg-md-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Text Area */}
        <div className="space-y-1.5 mb-3">
          <h2 className="text-xs sm:text-sm font-black text-md-on-surface flex items-center gap-1.5">
            {currentStepDef.title}
          </h2>
          <div className="text-[11px] sm:text-[12px] leading-relaxed text-md-on-surface p-2.5 sm:p-3 bg-md-surface rounded-xl border border-black/5">
            {/* Bangla Direction Translation - Very clear, simple, human-like */}
            <p className="font-semibold text-md-on-surface mb-1.5 pb-1 border-b border-black/5">
              🇧🇩 {currentStepDef.descBn}
            </p>
            {/* English Direction Translation fallback */}
            <p className="text-[10px] sm:text-[11px] text-md-on-surface-variant italic opacity-85">
              🇬🇧 {currentStepDef.descEn}
            </p>
          </div>
        </div>

        {/* Call to Actions controls */}
        <div className="flex items-center justify-between font-bold text-xs shrink-0 pt-2 border-t border-black/5">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="py-1.5 sm:py-2.5 px-3 bg-black/5 hover:bg-black/10 active:bg-black/15 text-md-on-surface rounded-lg sm:rounded-xl transition-all text-[11px] sm:text-xs"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={handleNext}
              className="py-1.5 sm:py-2.5 px-3.5 bg-md-primary text-md-on-primary rounded-lg sm:rounded-xl transition-all hover:brightness-110 active:scale-95 flex items-center gap-1 shadow-md text-[11px] sm:text-xs"
            >
              {currentStepDef.actionLabelBn} <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Interaction Guide indicator */}
        {coords && (
          <div className="text-[9px] text-center text-yellow-600 font-bold tracking-tight uppercase flex items-center justify-center gap-0.5 mt-1.5 opacity-80 animate-pulse">
            <HelpCircle size={9} /> সরাসরি বাটনেও ক্লিক করতে পারেন!
          </div>
        )}
      </div>
    </div>
  );
}

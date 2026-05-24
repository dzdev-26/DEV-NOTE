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
      descBn: 'স্বাগতম! আসুন ১ মিনিটে এই মিনিমাল অফলাইন নোটপ্যাড অ্যাপটির প্রতিটা বাটন ও ফিচার বাস্তবে ঘুরে ঘুরে চিনে নিই।',
      descEn: 'Welcome! Let\'s take a 1-minute live interactive simulation of your offline workspace elements in real-time.',
      actionLabelBn: 'চলুন শুরু করি ➜',
      actionLabelEn: 'Start Tour ➜'
    },
    {
      targetId: 'tour-hamburger',
      title: 'সাইডবার ক্যাটাগরি মেনু 📂',
      descBn: 'এই মেনুটি চেপে ফোল্ডার তৈরি, ব্যাকআপ সেভ Export এবং রিসাইকেল বিন দেখতে পারবেন। বাটনটিতে সরাসরি ক্লিক করুন অথবা "Next" চাপুন।',
      descEn: 'Tap the Folder Menu icon to create categories, restore from trash, or run offline backups. Click it now or tap Next to auto-open!',
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
      descBn: 'সাইডবারের এখান থেকে "Personal", "Work" ইত্যাদি ফোল্ডার তৈরি করে নোটগুলো সাজিয়ে রাখতে পারবেন।',
      descEn: 'Create folders like "Finance", "Study", or "Drafts" inside the drawer to easily categorize lists.',
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
      targetId: 'tour-view-mode',
      title: 'ভিউ লেআউট পরিবর্তন 📊',
      descBn: 'আপনার ইচ্ছে অনুযায়ী নোটগুলো "লিস্ট", "গ্রিড" কিংবা আরও বড় থাম্বনেইল লেআউটে সাজিয়ে দেখতে পারেন এই বাটনটি দিয়ে।',
      descEn: 'Convert note listings into Detail rows, standard Grid squares, or Large card styles instantly depending on your eye comfort.',
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
      descBn: 'যেকোনো সময় খুব সহজে নোটের ভেতরের টেক্সট বা ট্যাগ মুহূর্তেই খুঁজে পেতে এই সার্চ বাটনটি ব্যবহার করুন।',
      descEn: 'Instantly search through offline text, titles, or tag groupings without latency or remote servers.',
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
      descBn: 'সবচেয়ে আকর্ষণীয় অংশ! আপনার নোটবুক খোলাই রয়েছে। এই ফ্লোটিং প্লাস বাটনটি চাপলে ডিসট্র্যাকশন-ফ্রি রাইটিং মোড চালু হবে। বাটনটি চাপুন অথবা "Next" চাপুন।',
      descEn: 'Ready to write? Click the Plus action button to jump directly into the full screen rich writing editor.',
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
      descBn: 'টাইটেল ও লেখার একদম অফলাইন পরিবেশ। আপনি যা লিখবেন, তার প্রতিটা অক্ষর সেকেন্ডের ভগ্নাংশের মধ্যেই অটো-সেভ হয়ে যাবে!',
      descEn: 'A pristine writing center. Words typed here autosave to secure IndexedDB local storage immediately.',
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
      targetId: 'tour-magic-format',
      title: 'ম্যাজিক ফরম্যাটিং ও কারেকশন 🪄',
      descBn: 'লেখার নিচের এই জাদুকরী বাটনটি চেপে আপনি খসড়ার সব অতিরিক্ত স্পেস, বড় হাতের অক্ষর বা প্যারাগ্রাফ অটো-সাইজ বা ফরম্যাট করে নিতে পারেন!',
      descEn: 'This Magic Wand utility automatically sanitizes paragraph spacing, custom text margins, and correct formats instantly.',
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
        className="absolute w-[90%] left-[5%] bg-md-surface-container rounded-3xl p-5 shadow-2xl border border-md-outline/10 pointer-events-auto flex flex-col transition-all duration-300 z-50 animate-in zoom-in-95 duration-200"
        style={(() => {
          if (!coords) return { top: '30%' };
          
          // If highlighted target is in the bottom-most 220px of the viewport (like the bottom FAB)
          if (coords.y > height - 220) {
            return { top: '32px' };
          }
          
          // If highlighted target is in the top-most 160px of the viewport (like the top action and save buttons)
          if (coords.y < 160) {
            return { bottom: '32px' };
          }
          
          // Otherwise handle standard positioning depending on lower or upper half focus
          if (coords.y > height / 2) {
            return { top: `${Math.max(16, coords.y - 280)}px` };
          } else {
            return { top: `${Math.min(height - 245, coords.y + coords.h + 16)}px` };
          }
        })()}
      >
        {/* Banner with Progress Bar */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="text-xs bg-yellow-400/20 text-yellow-500 font-black rounded-lg px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
              <Play size={10} fill="currentColor" /> Live Interactive
            </div>
            <span className="text-[10px] text-md-on-surface-variant font-bold opacity-70">
              ({currentStep + 1}/{steps.length})
            </span>
          </div>

          <button 
            id="btn-skip-guided-tour"
            onClick={onClose}
            className="text-[10px] px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10 text-md-on-surface-variant font-semibold transition-all flex items-center gap-0.5"
          >
            Skip <X size={10} />
          </button>
        </div>

        {/* Dynamic Horizontal Progress Bar */}
        <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-md-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Text Area */}
        <div className="space-y-2 mb-4">
          <h2 className="text-sm font-black text-md-on-surface flex items-center gap-1.5">
            {currentStepDef.title}
          </h2>
          <div className="text-[12px] leading-relaxed text-md-on-surface p-3 bg-md-surface rounded-2xl border border-black/5">
            {/* Bangla Direction Translation - Very clear, simple, human-like */}
            <p className="font-medium text-md-on-surface mb-2 border-b border-black/5 pb-1">
              🇧🇩 {currentStepDef.descBn}
            </p>
            {/* English Direction Translation fallback */}
            <p className="text-[11px] text-md-on-surface-variant italic">
              🇬🇧 {currentStepDef.descEn}
            </p>
          </div>
        </div>

        {/* Call to Actions controls */}
        <div className="flex items-center justify-between font-bold text-xs shrink-0 pt-2 border-t border-black/5">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="py-2.5 px-3.5 bg-black/5 hover:bg-black/10 active:bg-black/15 text-md-on-surface rounded-xl transition-all"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={handleNext}
              className="py-2.5 px-4 bg-md-primary text-md-on-primary rounded-xl transition-all hover:brightness-110 active:scale-95 flex items-center gap-1 shadow-md"
            >
              {currentStepDef.actionLabelBn} <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Interaction Guide indicator */}
        {coords && (
          <div className="text-[9px] text-center text-yellow-600 font-bold tracking-tight uppercase flex items-center justify-center gap-1 mt-3 opacity-80 animate-pulse">
            <HelpCircle size={10} /> আপনি সরাসরি অ্যাপের হাইলাইটেড বাটনেও ক্লিক করতে পারেন!
          </div>
        )}
      </div>
    </div>
  );
}

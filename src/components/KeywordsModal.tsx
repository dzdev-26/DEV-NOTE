import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Hash } from 'lucide-react';
import { AppSettings } from '../types';

interface KeywordsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onUpdate: (partial: Partial<AppSettings>) => void;
}

export function KeywordsModal({ settings, onClose, onUpdate }: KeywordsModalProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const customKeywords = settings.customKeywords || [];
  const hiddenKeywords = settings.hiddenKeywords || [];

  const handleAddKeyword = () => {
    let kw = newKeyword.trim();
    if (!kw) return;

    // Ensure it looks like a tag or headline if they want, but let's keep it clean
    // If they write something without starting # and ending with :, let's be flexible
    if (customKeywords.includes(kw)) {
      alert('This keyword already exists!');
      return;
    }

    const updated = [...customKeywords, kw];
    onUpdate({ customKeywords: updated });
    setNewKeyword('');
  };

  const handleStartEdit = (index: number, val: string) => {
    setEditingIndex(index);
    setEditingValue(val);
  };

  const handleSaveEdit = (index: number) => {
    const val = editingValue.trim();
    if (!val) return;

    if (customKeywords.includes(val) && customKeywords[index] !== val) {
      alert('This keyword already exists!');
      return;
    }

    const oldVal = customKeywords[index];
    const updated = [...customKeywords];
    updated[index] = val;

    // Update in hidden keywords too if it was hidden
    let updatedHidden = [...hiddenKeywords];
    if (hiddenKeywords.includes(oldVal)) {
      updatedHidden = hiddenKeywords.map(h => h === oldVal ? val : h);
    }

    onUpdate({ 
      customKeywords: updated,
      hiddenKeywords: updatedHidden
    });
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDeleteKeyword = (index: number) => {
    const targetVal = customKeywords[index];
    const updated = customKeywords.filter((_, i) => i !== index);
    const updatedHidden = hiddenKeywords.filter(h => h !== targetVal);

    onUpdate({
      customKeywords: updated,
      hiddenKeywords: updatedHidden
    });
    setDeletingIndex(null);
  };

  const toggleVisibility = (kw: string) => {
    let updatedHidden: string[];
    if (hiddenKeywords.includes(kw)) {
      updatedHidden = hiddenKeywords.filter(h => h !== kw);
    } else {
      updatedHidden = [...hiddenKeywords, kw];
    }
    onUpdate({ hiddenKeywords: updatedHidden });
  };

  return (
    <div className="absolute inset-0 bg-md-surface z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      <header className="shrink-0 bg-md-surface border-b border-md-outline-variant/30 relative pt-[env(safe-area-inset-top)]">
        <div className="h-14 px-2 flex items-center w-full justify-start">
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors shrink-0">
            <ArrowLeft className="w-6 h-6 text-md-on-surface" />
          </button>
          <h2 className="text-[18px] font-normal leading-normal ml-2 text-md-on-surface flex items-center">Manage Keywords</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
        {/* Intro Info */}
        <div className="p-4 bg-md-surface-container-high rounded-2xl">
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-md-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-md-primary uppercase tracking-wider mb-1">About Keywords</p>
              <p className="text-xs text-md-on-surface-variant leading-relaxed">
                Headline keywords are used at the bottom of the editor view for rapid selection. Tap one to insert it instantly. Customise your headlines below.
              </p>
            </div>
          </div>
        </div>

        {/* Add New Keyword */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-md-primary uppercase tracking-widest pl-1">
            Add Custom Headline
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. #TODO: or #IDEA:"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddKeyword();
              }}
              className="flex-1 bg-md-surface-container-high text-md-on-surface text-[14px] px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-md-primary border-none"
            />
            <button
              onClick={handleAddKeyword}
              className="w-12 h-12 bg-md-primary text-md-on-primary rounded-xl flex items-center justify-center hover:bg-md-primary/90 active:scale-95 transition-all shrink-0"
              title="Add Keyword"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Keywords List Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-semibold text-md-primary uppercase tracking-widest">
              My Custom Keywords ({customKeywords.length})
            </label>
          </div>

          {customKeywords.length === 0 ? (
            <div className="text-center py-8 px-4 bg-md-surface-container-low rounded-2xl border border-dashed border-md-outline-variant/30">
              <span className="text-xs text-md-on-surface-variant/40 font-medium">No custom keywords added yet. Use the field above to add one!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {customKeywords.map((kw, idx) => {
                const isHidden = hiddenKeywords.includes(kw);
                const isEditing = editingIndex === idx;
                const isDeleting = deletingIndex === idx;

                return (
                  <div 
                    key={kw} 
                    className="flex items-center justify-between p-3 bg-md-surface-container-high rounded-xl gap-2 transition-all"
                  >
                    {isDeleting ? (
                      <div className="flex-1 flex items-center justify-between bg-md-error-container text-md-on-error-container p-1 rounded-lg animate-in flip-in-x duration-200">
                        <span className="text-xs font-bold pl-2">Delete "{kw}"?</span>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setDeletingIndex(null)} 
                            className="text-xs font-bold uppercase transition-colors hover:opacity-85 px-2 py-1"
                          >
                            No
                          </button>
                          <button 
                            onClick={() => handleDeleteKeyword(idx)} 
                            className="text-xs font-bold uppercase text-md-error transition-colors hover:opacity-85 px-2 py-1 underline"
                          >
                            Yes
                          </button>
                        </div>
                      </div>
                    ) : isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(idx);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          className="flex-1 bg-md-surface/80 text-md-on-surface text-[14px] px-3 py-1.5 rounded-lg outline-none border border-md-primary"
                        />
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleSaveEdit(idx)}
                            className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center hover:bg-emerald-200 active:scale-95 transition-all text-xs"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="w-8 h-8 rounded-full bg-black/5 text-md-on-surface-variant flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-xs"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-md-on-surface tracking-wide select-text truncate max-w-[150px]">
                          {kw}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Visibility Controls */}
                          <button
                            onClick={() => toggleVisibility(kw)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors ${
                              isHidden 
                                ? 'text-md-on-surface-variant/40' 
                                : 'text-md-on-surface-variant'
                            }`}
                            title={isHidden ? "Hidden from editor bar (Tap to show)" : "Visible on editor bar (Tap to hide)"}
                          >
                            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {/* Edit Controls */}
                          <button
                            onClick={() => handleStartEdit(idx, kw)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 text-md-on-surface-variant hover:bg-black/10 transition-colors"
                            title="Edit Keyword"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Controls */}
                          <button
                            onClick={() => setDeletingIndex(idx)}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 text-md-on-surface-variant hover:text-md-error hover:bg-black/10 transition-colors"
                            title="Delete Keyword"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

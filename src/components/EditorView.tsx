import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, MoreVertical, Undo, Redo, ArrowLeft, Maximize, Minimize, 
  Wand2, History, Share2, Plus,
  Download, Printer, Tag, Clock, Hash, Bold, List, Type, CheckSquare
} from 'lucide-react';
import { Note, AppSettings } from '../types';

interface EditorViewProps {
  note?: Note;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onSave: (note: Note, close: boolean) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  runWithLoader: (callback: () => void, message?: string) => void;
}

export function EditorView({ note, settings, onUpdateSettings, onSave, onCancel, onDelete, runWithLoader }: EditorViewProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || '');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [showKeywordPrompt, setShowKeywordPrompt] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (textareaRef.current) {
      selectionRef.current = { start: content.length, end: content.length };
    }
  }, []);

  useEffect(() => {
    const handleBack = (e: Event) => {
      if (showKeywordPrompt) {
        setShowKeywordPrompt(false);
        e.preventDefault();
        return;
      }
      if (showHistory) {
        setShowHistory(false);
        e.preventDefault();
        return;
      }
      if (showMeta) {
        setShowMeta(false);
        e.preventDefault();
        return;
      }
    };
    window.addEventListener('appCancelBack', handleBack);
    return () => window.removeEventListener('appCancelBack', handleBack);
  }, [showHistory, showMeta, showKeywordPrompt]);

  const defaultKeywords = React.useMemo(() => [
    '#ROOT:', '#CAUSE:', '#ISSUE:', '#SOLUTION:', '#REQUEST:', '#SECTION:', '#PROCESS:', '#MAIN-CULPRIT:', '#REQUIREMENTS:', '#IMPORTANT:', '#‼️WARNING‼️:',
    ...Array.from({ length: 100 }, (_, i) => `#${i + 1}:`)
  ], []);

  const allKeywords = [...defaultKeywords, ...(settings.customKeywords || [])];

  const handleConfirmAddKeyword = () => {
    if (keywordInput && keywordInput.trim() !== '') {
      onUpdateSettings({ customKeywords: [...(settings.customKeywords || []), keywordInput.trim()] });
    }
    setKeywordInput('');
    setShowKeywordPrompt(false);
  };
  
  const handleAddKeyword = () => {
    setKeywordInput('');
    setShowKeywordPrompt(true);
  };
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const handleRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const scrollHandleContainerRef = useRef<HTMLDivElement>(null);

  // Swipe-safe Pointer Gesture Trackers (keeps keyboard open, prevents accidental clicks on swipe-to-scroll)
  const keywordDragRef = useRef({
    startX: 0,
    startY: 0,
    hasMoved: false,
    isPointerDown: false
  });

  const actionDragRef = useRef({
    startX: 0,
    startY: 0,
    hasMoved: false,
    isPointerDown: false
  });

  const handleKeywordPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // only track primary pointer
    e.preventDefault(); // crucial to prevent text area losing focus
    keywordDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
      isPointerDown: true
    };
  };

  const handleKeywordPointerMove = (e: React.PointerEvent) => {
    if (!keywordDragRef.current.isPointerDown) return;
    const dx = Math.abs(e.clientX - keywordDragRef.current.startX);
    const dy = Math.abs(e.clientY - keywordDragRef.current.startY);
    if (dx > 8 || dy > 8) {
      keywordDragRef.current.hasMoved = true;
    }
  };

  const handleKeywordPointerUp = (kw: string) => {
    if (!keywordDragRef.current.isPointerDown) return;
    const wasTap = !keywordDragRef.current.hasMoved;
    keywordDragRef.current.isPointerDown = false;
    if (wasTap) {
      insertText(kw + '\n');
    }
  };

  const handleActionPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault(); // keeps textarea focus
    actionDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
      isPointerDown: true
    };
  };

  const handleActionPointerMove = (e: React.PointerEvent) => {
    if (!actionDragRef.current.isPointerDown) return;
    const dx = Math.abs(e.clientX - actionDragRef.current.startX);
    const dy = Math.abs(e.clientY - actionDragRef.current.startY);
    if (dx > 8 || dy > 8) {
      actionDragRef.current.hasMoved = true;
    }
  };

  const handleActionPointerUp = (action: () => void) => {
    if (!actionDragRef.current.isPointerDown) return;
    const wasTap = !actionDragRef.current.hasMoved;
    actionDragRef.current.isPointerDown = false;
    if (wasTap) {
      action();
    }
  };

  const updateSelection = () => {
    if (textareaRef.current) {
      selectionRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      };
    }
  };

  // Stats memoization
  const stats = React.useMemo(() => {
    const trimmed = content.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    return {
      words: wordCount,
      chars: content.length,
      readTime: Math.ceil(wordCount / 200)
    };
  }, [content]);

  // History tracking for undo/redo (Local session)
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const lastState = useRef({ title, content });
  const scrollProgressRef = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const updateScrollUI = (progress: number) => {
    scrollProgressRef.current = progress;
    if (progressBarRef.current) progressBarRef.current.style.width = `${progress}%`;
    if (handleRef.current) {
      handleRef.current.style.top = `calc(${progress}% - ${(progress / 100) * 3}rem)`;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (isDragging.current) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight <= clientHeight) {
      updateScrollUI(0);
      return;
    }
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    updateScrollUI(progress);

    // Show handle while scrolling using direct DOM for performance
    if (scrollHandleContainerRef.current) {
      scrollHandleContainerRef.current.style.opacity = '1';
    }
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (scrollHandleContainerRef.current) {
        scrollHandleContainerRef.current.style.opacity = '0';
      }
    }, 1500);
  };

  const isDragging = useRef(false);
  const startY = useRef(0);
  const startProgress = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startProgress.current = scrollProgressRef.current;
    
    if (scrollHandleContainerRef.current) {
      scrollHandleContainerRef.current.style.opacity = '1';
    }
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current || !textareaRef.current) return;
    
    const deltaY = e.clientY - startY.current;
    const scrollAreaHeight = textareaRef.current.clientHeight - 32;
    const deltaProgress = (deltaY / scrollAreaHeight) * 100;
    
    const newProgress = Math.max(0, Math.min(100, startProgress.current + deltaProgress));
    updateScrollUI(newProgress);
    
    const { scrollHeight, clientHeight } = textareaRef.current;
    textareaRef.current.scrollTop = (newProgress / 100) * (scrollHeight - clientHeight);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.body.style.userSelect = '';
    scrollTimeout.current = setTimeout(() => {
      if (scrollHandleContainerRef.current) {
        scrollHandleContainerRef.current.style.opacity = '0';
      }
    }, 1500);
  };

  const handleMagicFormat = () => {
    runWithLoader(() => {
      let formatted = content;
      // 1. Clean extra spaces
      formatted = formatted.replace(/[^\S\r\n]+/g, ' ');
      // 2. Fix paragraphing (max 2 newlines)
      formatted = formatted.replace(/\n{3,}/g, '\n\n');
      // 3. Sentence casing
      formatted = formatted.replace(/(^\s*|[.?!]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
      // 4. Newline casing
      formatted = formatted.replace(/(\n+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
      setContent(formatted.trim());
    }, 'Formatting Text...');
  };

  const handleChecklistConvert = () => {
    runWithLoader(() => {
      const lines = content.split('\n');
      const converted = lines.map(line => {
        if (line.trim() && !line.trim().startsWith('- [ ]')) {
          return `- [ ] ${line.trim()}`;
        }
        return line;
      }).join('\n');
      setContent(converted);
    }, 'Converting to Checklist...');
  };

  const insertText = (text: string, wrap?: boolean) => {
    const el = textareaRef.current;
    if (!el) return;
    
    // Always use the robust selectionRef because accessing el.selectionStart immediately
    // after a button click might return 0 if the textarea currently lost focus.
    const start = selectionRef.current.start ?? content.length;
    const end = selectionRef.current.end ?? content.length;
    
    // Bounds guard in case of weird state
    const safeStart = Math.min(Math.max(0, start), content.length);
    const safeEnd = Math.max(safeStart, Math.min(end, content.length));
    
    const selected = content.substring(safeStart, safeEnd);
    const newText = wrap ? `${text}${selected}${text}` : text;
    const newVal = content.substring(0, safeStart) + newText + content.substring(safeEnd);
    
    setContent(newVal);
    
    // Update the ref to track the new caret pos so multiple inserts work without manual focus!
    const newCursorPos = safeStart + text.length;
    selectionRef.current = { start: newCursorPos, end: newCursorPos + (wrap ? selected.length : 0) };
    
    // Restore focus and selection
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(selectionRef.current.start, selectionRef.current.end);
      
      // Auto-scroll to keep caret in view
      // If we are at the very end of the document, just scroll to bottom
      if (selectionRef.current.start >= newVal.length - 10) {
        el.scrollTop = el.scrollHeight;
      }
    }, 10);
  };

  const handleSave = (close = true) => {
    if (!title.trim() && !content.trim()) {
      onCancel();
      return;
    }
    const updatedNote: Note = {
      ...note,
      id: note?.id || crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      category: category || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      updatedAt: Date.now(),
      history: note?.history
    };
    onSave(updatedNote, close);
  };

  const handleDownload = () => {
    runWithLoader(() => {
      const blob = new Blob([`${title}\n\n${content}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'note'}.txt`;
      a.click();
    }, 'Preparing Download...');
  };

  const lineSpacingRem = {
    normal: '1.5',
    relaxed: '1.8',
    loose: '2.2'
  }[settings.lineSpacing];

  return (
    <div className="flex flex-col h-full bg-md-surface animate-in fade-in slide-in-from-right-4 duration-200 overflow-hidden relative">
      
      {/* Drawer: Revision History */}
      {showHistory && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex animate-in fade-in duration-200">
          <div className="bg-md-surface-container-high w-[85%] h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <header className="p-6 bg-md-surface-container-high border-b border-md-outline/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-md-primary" />
                <span className="text-base font-medium text-md-on-surface">Revision History</span>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-black/5 rounded-full"><X className="w-6 h-6" /></button>
            </header>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {!note?.history || note.history.length === 0 ? (
                <div className="p-12 text-center text-md-on-surface-variant opacity-60 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-md-surface-container rounded-full flex items-center justify-center">
                    <History size={32} />
                  </div>
                  <p>No previous drafts were tracked for this note yet.</p>
                </div>
              ) : (
                note.history.map((rev, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setContent(rev.content); setTitle(rev.title); setShowHistory(false); }}
                    className="w-full p-5 border-b border-black/5 text-left hover:bg-md-primary/5 active:bg-md-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-md-primary text-[10px] font-bold mb-2 uppercase tracking-tight">
                      <Clock size={12} />
                      {new Date(rev.timestamp).toLocaleString()}
                    </div>
                    <div className="text-md-on-surface font-semibold truncate mb-1">
                      {rev.title || 'Untitled Draft'}
                    </div>
                    <p className="text-md-on-surface-variant text-xs line-clamp-2 opacity-70 leading-relaxed">
                      {rev.content}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowHistory(false)} />
        </div>
      )}

      {/* Keyword Prompt Modal */}
      {showKeywordPrompt && (
        <div className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-md-surface-container-high w-[90%] max-w-sm rounded-[28px] shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-[24px] font-normal text-md-on-surface mb-4">Add Custom Keyword</h3>
            <input
              autoFocus
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmAddKeyword();
              }}
              placeholder="e.g. #my-tag:"
              className="w-full bg-md-surface border-b border-md-primary/50 px-4 py-3 text-[16px] text-md-on-surface outline-none focus:border-md-primary transition-colors focus:bg-md-primary/5 rounded-t-lg mb-6"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowKeywordPrompt(false)}
                className="px-6 py-2.5 text-md-primary font-bold text-[14px] rounded-full hover:bg-md-primary/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAddKeyword}
                className="px-6 py-2.5 bg-md-primary text-md-on-primary font-bold text-[14px] rounded-full hover:shadow-md transition-all active:scale-95"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="shrink-0 bg-md-surface border-b border-md-outline/20 z-10 w-full relative pt-[env(safe-area-inset-top)]">
        <div className="h-[64px] px-1 sm:px-2 flex items-center justify-between w-full">
          <button onClick={() => handleSave(true)} className="w-12 h-12 flex items-center justify-center hover:bg-black/5 rounded-full shrink-0 ml-1">
            <ArrowLeft size={24} />
          </button>
          <input 
            id="tour-note-title"
            value={title} 
            onChange={e => setTitle(e.target.value)}
            placeholder="Note Title"
            className="flex-1 min-w-[50px] bg-transparent px-3 font-medium text-[18px] outline-none placeholder:opacity-40 text-ellipsis flex items-center"
          />
          <div className="flex items-center gap-1 shrink-0 mr-1">
            <button onClick={() => setShowMeta(!showMeta)} className="w-12 h-12 flex items-center justify-center hover:bg-black/5 rounded-full shrink-0"><Tag size={22} /></button>
            <button onClick={() => setIsDistractionFree(!isDistractionFree)} className="w-12 h-12 flex items-center justify-center hover:bg-black/5 rounded-full shrink-0">
              {isDistractionFree ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <button id="tour-save-note" onClick={() => handleSave(true)} className="w-12 h-12 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 rounded-full shrink-0"><Check size={24} /></button>
          </div>
        </div>
      </header>

      {/* Meta Bar */}
      {showMeta && (
        <div className="px-4 py-2 bg-md-surface-container-high border-b border-md-outline/20 grid grid-cols-2 gap-3 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-md-primary uppercase">Category</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="bg-md-surface p-2 rounded-lg text-sm border-none outline-none"
            >
              <option value="">Uncategorized</option>
              {settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-md-primary uppercase">Tags (comma-separated)</label>
            <input 
              value={tags} 
              onChange={e => setTags(e.target.value)}
              placeholder="work, idea, top..."
              className="bg-md-surface p-2 rounded-lg text-sm border-none outline-none"
            />
          </div>
        </div>
      )}

      {/* Action Accessories Strip */}
      {!isDistractionFree && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-md-surface-container-high border-b border-md-outline/10 overflow-x-auto no-scrollbar shrink-0">
          <button 
            id="tour-revision-history"
            onPointerDown={handleActionPointerDown}
            onPointerMove={handleActionPointerMove}
            onPointerUp={() => handleActionPointerUp(() => setShowHistory(true))}
            onPointerCancel={() => { actionDragRef.current.isPointerDown = false; }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-md-surface rounded-full text-[10px] font-bold text-md-on-surface-variant hover:bg-md-primary-container transition-colors shrink-0"
          >
            <History size={13} /> History
          </button>
          <div className="w-[1px] h-4 bg-md-outline/30 mx-1" />
          <button 
            onPointerDown={handleActionPointerDown}
            onPointerMove={handleActionPointerMove}
            onPointerUp={() => handleActionPointerUp(() => insertText('# '))}
            onPointerCancel={() => { actionDragRef.current.isPointerDown = false; }}
            className="p-2 hover:bg-md-primary/10 rounded-lg shrink-0"
          >
            <Hash size={18} />
          </button>
          <button 
            onPointerDown={handleActionPointerDown}
            onPointerMove={handleActionPointerMove}
            onPointerUp={() => handleActionPointerUp(() => insertText('**', true))}
            onPointerCancel={() => { actionDragRef.current.isPointerDown = false; }}
            className="p-2 hover:bg-md-primary/10 rounded-lg shrink-0"
          >
            <Bold size={18} />
          </button>
          <button 
            onPointerDown={handleActionPointerDown}
            onPointerMove={handleActionPointerMove}
            onPointerUp={() => handleActionPointerUp(() => insertText('- '))}
            onPointerCancel={() => { actionDragRef.current.isPointerDown = false; }}
            className="p-2 hover:bg-md-primary/10 rounded-lg shrink-0"
          >
            <List size={18} />
          </button>
          <button 
            onPointerDown={handleActionPointerDown}
            onPointerMove={handleActionPointerMove}
            onPointerUp={() => handleActionPointerUp(handleChecklistConvert)}
            onPointerCancel={() => { actionDragRef.current.isPointerDown = false; }}
            className="p-2 hover:bg-md-primary/10 rounded-lg shrink-0" 
            title="Convert to Checklist"
          >
            <CheckSquare size={18} />
          </button>
          <button 
            onPointerDown={handleActionPointerDown}
            onPointerMove={handleActionPointerMove}
            onPointerUp={() => handleActionPointerUp(() => insertText(`\n[${new Date().toLocaleString()}]\n`))}
            onPointerCancel={() => { actionDragRef.current.isPointerDown = false; }}
            className="p-2 hover:bg-md-primary/10 rounded-lg shrink-0"
          >
            <Clock size={18} />
          </button>
          <div className="w-[1px] h-4 bg-md-outline/30 mx-1" />
          <button id="tour-magic-format" onClick={handleMagicFormat} className="p-2 text-md-primary hover:bg-md-primary/10 rounded-lg shrink-0" title="Magic Format"><Wand2 size={18} /></button>
          <button onClick={handleDownload} className="p-2 text-md-on-surface-variant hover:bg-md-surface rounded-lg shrink-0"><Download size={18} /></button>
          <button onClick={() => window.print()} className="p-2 text-md-on-surface-variant hover:bg-md-surface rounded-lg shrink-0"><Printer size={18} /></button>
        </div>
      )}

      {/* Editor Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden group/editor">
        {/* Scroll Progress Bar (Top) */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-md-primary/5 z-20 overflow-hidden">
          <div 
            ref={progressBarRef}
            className="h-full bg-md-primary transition-all duration-100 ease-out shadow-[0_0_12px_rgba(var(--color-md-primary),0.6)]" 
            style={{ width: '0%' }} 
          />
        </div>

        {/* Floating Vertical Scroll Handle */}
        <div 
          ref={scrollHandleContainerRef}
          className="absolute right-1.5 top-4 bottom-4 w-5 z-30 transition-opacity duration-300 opacity-0 pointer-events-none"
        >
          <div 
            ref={handleRef}
            onPointerDown={handlePointerDown}
            className="w-full h-12 bg-[#ef6c61] rounded-[6px] absolute transition-all duration-100 ease-out shadow-lg border-2 border-white/10 cursor-pointer touch-none active:scale-110 active:brightness-110 pointer-events-auto"
            style={{ top: '0px' }}
          />
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => {
            setContent(e.target.value);
            updateSelection();
          }}
          onSelect={updateSelection}
          onClick={updateSelection}
          onKeyUp={updateSelection}
          onScroll={handleScroll}
          placeholder="Start typing your thoughts..."
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: `${lineSpacingRem}em`,
            backgroundImage: settings.showLines ? `linear-gradient(transparent calc(${lineSpacingRem}em - 1px), rgba(0,0,0,0.05) calc(${lineSpacingRem}em - 1px))` : 'none',
            backgroundSize: `100% ${lineSpacingRem}em`,
            backgroundAttachment: 'local',
          }}
          className="flex-1 py-4 px-[5px] bg-transparent outline-none border-none resize-none text-md-on-surface placeholder:opacity-30"
        />
      </main>

      {/* Keywords Bar */}
      {!isDistractionFree && (
        <div className="flex items-center bg-md-surface-container-high border-t border-md-outline/10 shrink-0 py-1.5">
          <div className="px-3 border-r border-md-outline/20 flex items-center shrink-0">
            <button 
              onClick={handleAddKeyword}
              className="w-10 h-10 flex items-center justify-center bg-md-primary text-md-on-primary rounded-full shadow-md border-2 border-md-surface/30 hover:brightness-105 active:scale-90 transition-all cursor-pointer"
              title="Add Custom Keyword"
            >
              <Plus size={22} strokeWidth={3} />
            </button>
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            {allKeywords.map((kw, i) => (
              <button 
                key={i}
                onPointerDown={handleKeywordPointerDown}
                onPointerMove={handleKeywordPointerMove}
                onPointerUp={() => handleKeywordPointerUp(kw)}
                onPointerCancel={() => { keywordDragRef.current.isPointerDown = false; }}
                className="px-3 py-1 bg-md-surface rounded-full text-[11px] font-bold text-md-on-surface-variant hover:text-md-primary hover:bg-md-primary/10 transition-colors shadow-sm shrink-0 tracking-wide"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Metrics */}
      {!isDistractionFree && (
        <footer className="h-10 px-4 bg-md-surface-variant border-t border-md-outline/20 flex items-center justify-between text-[11px] font-bold text-md-on-surface-variant uppercase tracking-wider shrink-0">
          <div className="flex gap-2.5">
            <span>{stats.words} W</span>
            <span>{stats.chars} C</span>
            <span className="text-md-primary">{stats.readTime} M.R</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { if(navigator.share) navigator.share({title, text: content}); }} className="flex items-center gap-1 p-1 hover:text-md-primary">
              <Share2 size={14} /> Share
            </button>
            <button onClick={() => onDelete(note?.id || '')} className="flex items-center gap-1 p-1 hover:text-red-600">
              <Trash2 size={14} /> Trash
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

const X = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const Trash2 = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

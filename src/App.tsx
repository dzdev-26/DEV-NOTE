/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { ListView } from './components/ListView';
import { EditorView } from './components/EditorView';
import { SecurityLock } from './components/SecurityLock';
import { Preloader } from './components/Preloader';
import { ActionOverlay } from './components/ActionOverlay';
import { Note, AppSettings } from './types';
import { getNotes, saveNotes, getSettings, saveSettings } from './lib/storage';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const initialSettings = getSettings();
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [isLocked, setIsLocked] = useState(!!initialSettings.pin);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('Processing...');

  useEffect(() => {
    setNotes(getNotes());
    setSettings(getSettings());
    
    // Smooth initial transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2200);
    
    return () => clearTimeout(timer);
  }, []);

  const runWithLoader = async (callback: () => void | Promise<void>, message: string = 'Processing...') => {
    setActionMessage(message);
    setIsActionLoading(true);
    
    const startTime = Date.now();
    
    try {
      // Small initial delay to let the UI settle and prevent micro-flicker
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = callback();
      if (result instanceof Promise) {
        await result;
      }
      
      // Ensure a minimum visibility for the loader (e.g. 500ms total) for visual consistency
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 500 - elapsed);
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSave = (note: Note, closeEditor: boolean = true) => {
    runWithLoader(() => {
      const existingIndex = notes.findIndex(n => n.id === note.id);
      let newNotes = [...notes];
      
      // Add to history (Revision History Feature - up to 15)
      if (existingIndex >= 0) {
        const oldNote = notes[existingIndex];
        if (oldNote.content !== note.content || oldNote.title !== note.title) {
          const history = [...(oldNote.history || [])];
          history.unshift({
            timestamp: oldNote.updatedAt,
            title: oldNote.title,
            content: oldNote.content
          });
          note.history = history.slice(0, 15);
        } else {
          note.history = oldNote.history;
        }
        newNotes[existingIndex] = note;
      } else {
        newNotes = [note, ...notes];
      }
      
      newNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      setNotes(newNotes);
      saveNotes(newNotes);
      if (closeEditor) setCurrentNoteId(null);
      else if (currentNoteId === 'new') setCurrentNoteId(note.id);
    }, 'Saving Note...');
  };

  const handleMoveToTrash = (id: string) => {
    runWithLoader(() => {
      const newNotes = notes.map(n => n.id === id ? { ...n, isTrash: true, updatedAt: Date.now() } : n);
      setNotes(newNotes);
      saveNotes(newNotes);
      setCurrentNoteId(null);
    }, 'Moving to Trash...');
  };

  const handleRestoreFromTrash = (id: string) => {
    runWithLoader(() => {
      const newNotes = notes.map(n => n.id === id ? { ...n, isTrash: false, updatedAt: Date.now() } : n);
      setNotes(newNotes);
      saveNotes(newNotes);
    }, 'Restoring Note...');
  };

  const handlePermanentDelete = (id: string) => {
    runWithLoader(() => {
      const newNotes = notes.filter(n => n.id !== id);
      setNotes(newNotes);
      saveNotes(newNotes);
    }, 'Deleting Permanently...');
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    runWithLoader(() => {
      const newSettings = { ...settings, ...partial };
      setSettings(newSettings);
      saveSettings(newSettings);
    }, 'Updating Settings...');
  };

  if (isLocked && settings.pin) {
    return <SecurityLock correctPin={settings.pin} onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <>
      <AnimatePresence>
        {isLoading && <Preloader key="preloader" />}
      </AnimatePresence>
      <AnimatePresence>
        {isActionLoading && <ActionOverlay key="action-loader" message={actionMessage} />}
      </AnimatePresence>

      <div className="absolute inset-0 w-full bg-md-surface text-md-on-surface mx-auto flex flex-col overflow-hidden sm:max-w-lg sm:border-x sm:border-md-outline-variant/30 sm:shadow-2xl">
      {currentNoteId !== null ? (
        <EditorView 
          note={notes.find(n => n.id === currentNoteId) || undefined} 
          onSave={handleSave} 
          onCancel={() => runWithLoader(() => setCurrentNoteId(null), 'Closing Editor...')}
          onDelete={handleMoveToTrash}
          settings={settings}
          runWithLoader={runWithLoader}
        />
      ) : (
        <ListView 
          notes={notes} 
          settings={settings}
          onUpdateSettings={updateSettings}
          onNew={() => runWithLoader(() => setCurrentNoteId('new'), 'Creating New Note...')} 
          onSelect={(id) => runWithLoader(() => setCurrentNoteId(id), 'Loading Note...')} 
          onMoveToTrash={handleMoveToTrash}
          onRestore={handleRestoreFromTrash}
          onPermanentDelete={handlePermanentDelete}
          onImport={(newNotes) => {
            runWithLoader(() => {
              const merged = [...newNotes, ...notes].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
              setNotes(merged);
              saveNotes(merged);
            }, 'Importing Notes...');
          }}
          runWithLoader={runWithLoader}
        />
      )}
      </div>
    </>
  );
}

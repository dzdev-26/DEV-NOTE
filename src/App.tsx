/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { App as CapacitorApp } from '@capacitor/app';
import { ListView } from './components/ListView';
import { EditorView } from './components/EditorView';
import { SecurityLock } from './components/SecurityLock';
import { Preloader } from './components/Preloader';
import { ActionOverlay } from './components/ActionOverlay';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { Note, AppSettings } from './types';
import { getNotes, saveNotes, getSettings, saveSettings, DEFAULT_SETTINGS } from './lib/storage';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLocked, setIsLocked] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('Processing...');

  useEffect(() => {
    const loadData = async () => {
      const dbNotes = await getNotes();
      const dbSettings = await getSettings();
      setNotes(dbNotes);
      setSettings(dbSettings);
      setIsLocked(!!dbSettings.pin);
      
      // Smooth initial transition
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2200);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', () => {
      const event = new CustomEvent('appCancelBack', { cancelable: true });
      const defaultPrevented = !window.dispatchEvent(event);
      
      if (defaultPrevented) {
        return;
      }

      if (currentNoteId !== null) {
        runWithLoader(() => setCurrentNoteId(null), 'Closing Editor...');
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [currentNoteId]);

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
    runWithLoader(async () => {
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
      await saveNotes(newNotes);
      if (closeEditor) setCurrentNoteId(null);
      else if (currentNoteId === 'new') setCurrentNoteId(note.id);
    }, 'Saving Note...');
  };

  const handleMoveToTrash = (id: string) => {
    runWithLoader(async () => {
      const newNotes = notes.map(n => n.id === id ? { ...n, isTrash: true, updatedAt: Date.now() } : n);
      setNotes(newNotes);
      await saveNotes(newNotes);
      setCurrentNoteId(null);
    }, 'Moving to Trash...');
  };

  const handleRestoreFromTrash = (id: string) => {
    runWithLoader(async () => {
      const newNotes = notes.map(n => n.id === id ? { ...n, isTrash: false, updatedAt: Date.now() } : n);
      setNotes(newNotes);
      await saveNotes(newNotes);
    }, 'Restoring Note...');
  };

  const handlePermanentDelete = (id: string) => {
    runWithLoader(async () => {
      const newNotes = notes.filter(n => n.id !== id);
      setNotes(newNotes);
      await saveNotes(newNotes);
    }, 'Deleting Permanently...');
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    runWithLoader(async () => {
      const newSettings = { ...settings, ...partial };
      setSettings(newSettings);
      await saveSettings(newSettings);
    }, 'Updating Settings...');
  };

  if (isLocked && settings.pin) {
    return <SecurityLock correctPin={settings.pin} onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <Preloader key="preloader" />}
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
          onUpdateSettings={updateSettings}
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
            runWithLoader(async () => {
              const merged = [...newNotes, ...notes].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
              setNotes(merged);
              await saveNotes(merged);
            }, 'Importing Notes...');
          }}
          runWithLoader={runWithLoader}
        />
      )}
      {settings.hasCompletedOnboarding === false && !isLoading && (
        <OnboardingTutorial 
          settings={settings}
          onUpdateSettings={updateSettings}
          allNotesCount={notes.length}
          onClose={() => updateSettings({ hasCompletedOnboarding: true })}
        />
      )}
      </div>
    </>
  );
}

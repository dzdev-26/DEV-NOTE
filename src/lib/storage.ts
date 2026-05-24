import { get, set } from 'idb-keyval';
import { Note, AppSettings } from '../types';

const STORAGE_KEY = 'md3_notepad_data_v2';
const SETTINGS_KEY = 'md3_notepad_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  pin: null,
  categories: ['Personal', 'Work', 'Ideas'],
  fontSize: 13,
  lineSpacing: 'normal',
  showLines: true,
  viewMode: 'details',
  hasCompletedOnboarding: false
};

const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'Ui/UX 100% ANDROID NATIVE MOBILE APP DESG...',
    content: 'Native feel components using Material You design system.',
    updatedAt: new Date().setHours(10, 19, 0, 0),
    category: 'Work'
  },
  {
    id: '2',
    title: '1. Core Note Features ✍️',
    content: '- Security Lock\n- Categories\n- Markdown formatting\n- Voice dictation',
    updatedAt: new Date().setHours(12, 11, 0, 0),
    category: 'Ideas'
  }
];

export const getNotes = async (): Promise<Note[]> => {
  try {
    let data = await get('md3_notes_db');
    if (!data) {
      // Migrate from localStorage
      const lsData = localStorage.getItem(STORAGE_KEY);
      if (lsData) {
        data = JSON.parse(lsData);
        await set('md3_notes_db', data);
      } else {
        return MOCK_NOTES;
      }
    }
    return data;
  } catch (err) {
    console.error('Failed to parse notes from storage', err);
    return MOCK_NOTES;
  }
};

export const saveNotes = async (notes: Note[]) => {
  try {
    await set('md3_notes_db', notes);
    // Keep localStorage clean to save quota
    if (localStorage.getItem(STORAGE_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to save notes to storage', err);
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    let data = await get('md3_settings_db');
    if (!data) {
      const lsData = localStorage.getItem(SETTINGS_KEY);
      if (lsData) {
        data = JSON.parse(lsData);
        await set('md3_settings_db', data);
      } else {
        return DEFAULT_SETTINGS;
      }
    }
    return data;
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: AppSettings) => {
  try {
    await set('md3_settings_db', settings);
    if (localStorage.getItem(SETTINGS_KEY)) {
      localStorage.removeItem(SETTINGS_KEY);
    }
  } catch (err) {
    console.error('Failed to save settings', err);
  }
};

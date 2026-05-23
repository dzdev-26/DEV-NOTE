import { Note, AppSettings } from '../types';

const STORAGE_KEY = 'md3_notepad_data_v2';
const SETTINGS_KEY = 'md3_notepad_settings';

const DEFAULT_SETTINGS: AppSettings = {
  pin: null,
  categories: ['Personal', 'Work', 'Ideas'],
  fontSize: 13,
  lineSpacing: 'normal',
  showLines: true
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

export const getNotes = (): Note[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : MOCK_NOTES;
  } catch (err) {
    console.error('Failed to parse notes from storage', err);
    return MOCK_NOTES;
  }
};

export const saveNotes = (notes: Note[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes to storage', err);
  }
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
};

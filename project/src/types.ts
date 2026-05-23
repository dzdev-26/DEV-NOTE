export interface NoteRevision {
  timestamp: number;
  title: string;
  content: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  tags?: string[];
  category?: string;
  isTrash?: boolean;
  isChecklist?: boolean;
  history?: NoteRevision[];
}

export interface AppSettings {
  pin: string | null;
  categories: string[];
  fontSize: number;
  lineSpacing: 'normal' | 'relaxed' | 'loose';
  showLines: boolean;
}

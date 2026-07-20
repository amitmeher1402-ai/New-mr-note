export enum BlockType {
  PARAGRAPH = 'paragraph',
  H1 = 'h1',
  H2 = 'h2',
  TODO = 'todo',
  IMAGES = 'images',
  TABLE = 'table'
}

export enum GridStyle {
  NONE = 'none',
  RULED = 'ruled',
  GRID = 'grid',
  DOTS = 'dots'
}

export enum LineSpacing {
  TIGHT = 'tight',
  NORMAL = 'normal',
  RELAXED = 'relaxed'
}

export enum NotebookType {
  ALL = 'all',
  DEFAULT = 'default',
  DELETED = 'deleted'
}

export interface TableRow {
  id: string;
  cells: string[];
}

export interface NoteBlock {
  id: string;
  type: BlockType;
  content: string; // Used for text elements or markdown-like content
  checked?: boolean; // For TODO checklist items
  imageUrls?: string[]; // Up to 2 images
  imageLayout?: 'side-by-side' | 'stacked'; // Image layout option
  tableData?: {
    headers: string[];
    rows: TableRow[];
  };
  // Text stylings for block or selected words
  isBold?: boolean;
  highlightType?: 'none' | 'background' | 'underline' | 'wavy' | 'text-color';
  highlightColor?: string; // hex or tailwind class
}

export interface VoiceRecording {
  id: string;
  name: string;
  duration: number; // in seconds
  url: string; // mock URL
  dateAdded: string;
}

export interface Note {
  id: string;
  title: string;
  titleWithToggle?: boolean; // Samsung Notes toggle style
  titleToggleState?: boolean; // state of the toggle
  lastModified: string;
  blocks: NoteBlock[];
  isPinned: boolean;
  notebook: string; // 'Default notebook', 'Recently deleted', etc.
  gridStyle: GridStyle;
  lineSpacing: LineSpacing;
  recordings?: VoiceRecording[];
  isDeleted?: boolean;
  deletedAt?: string;
}

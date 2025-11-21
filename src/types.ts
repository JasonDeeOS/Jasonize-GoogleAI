export enum NoteType {
  Text = 'text',
  List = 'list',
  ShoppingList = 'shopping_list',
}

export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  quantity?: string;
  notes?: string;
  category?: string;
  price?: number;
}

export interface Note {
  id: string;
  title: string;
  noteType: NoteType;
  content: string | ListItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  isPendingSync?: boolean;
  tags?: string[];
  isPinned?: boolean;
  color?: string;
}

export interface GithubGistSettings {
  gistId: string;
  token: string;
}

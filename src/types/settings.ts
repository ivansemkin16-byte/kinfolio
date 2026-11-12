export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  autoLockMinutes: number; // e.g. 5, 15, 30, 60, 0 (never)
  hasLoadedDemoData: boolean;
  theme: ThemeMode;
  language?: 'en' | 'ru';
  version: number;
  lastBackupAt?: string;
}

export interface BackupPayload {
  app: 'little-details';
  version: number;
  exportedAt: string;
  data: {
    people: any[];
    gifts: any[];
    notes: any[];
    settings?: Partial<AppSettings>;
  };
}

export const APP_MODES = ['spa', 'ccaa', 'prov'] as const;

export type AppMode = typeof APP_MODES[number];
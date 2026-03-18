import type { Polygon } from "jsts/org/locationtech/jts/geom";


export const APP_MODES = ['spa', 'ccaa', 'prov'] as const;

export type AppMode = typeof APP_MODES[number];

export interface ProvinceMeta {
    name: string,
    ccaa: string,
    geometry: Polygon[] | null
}

export interface CCAAMeta {
    name: string,
    provinces: string[],
    geometry: Polygon[] | null
}
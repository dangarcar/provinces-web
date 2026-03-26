import type { Polygon } from "jsts/org/locationtech/jts/geom";


export const APP_MODES = ['spa', 'ccaa', 'prov'] as const;

export type AppMode = typeof APP_MODES[number];

export interface ProvinceMeta {
    name: string,
    ccaa: string,
    geometry: Polygon[] | null,
    centroid: vec2,
    area: number
}

export interface CCAAMeta {
    name: string,
    provinces: string[],
    geometry: Polygon[] | null,
    centroid: vec2,
    area: number
}

export interface vec2 {
    x: number;
    y: number;
}

export interface PolygonCentroid {
    area: number;
    centroid: vec2;
}
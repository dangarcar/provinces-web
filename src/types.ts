import type { Polygon } from "jsts/org/locationtech/jts/geom";
import type { LatLng } from "leaflet";


export const APP_MODES = ['spa', 'ccaa', 'prov'] as const;
export type AppMode = typeof APP_MODES[number];


export const CENTER_TYPES = ['centroid', 'municipal', 'population'] as const;
export type CenterType = typeof CENTER_TYPES[number];


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


export interface Municipality {
    name: string,
    population: number, 
    ineCode: string,
    coords: LatLng | null,
    provCap: boolean,
    ccaaCap: boolean,
    nationCap: boolean,
    mainMunPop: number //This isn't realiable data, is for organizing villages with no capital of municipality
}

export interface PopProvince {
    name: string, 
    cpro: number,
    totalPopulation: number,
    muns: Municipality[]
}
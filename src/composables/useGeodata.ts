import { ref } from 'vue';
import type { AppMode, CCAAMeta, PolygonCentroid, ProvinceMeta, vec2 } from '../types';
import type { Feature, FeatureCollection } from 'geojson';


import { GeoJSONReader, GeoJSONWriter } from 'jsts/org/locationtech/jts/io';
import { Geometry, GeometryFactory, Polygon } from "jsts/org/locationtech/jts/geom";
import { GeometryCombiner } from 'jsts/org/locationtech/jts/geom/util';

import provTranslate from '/prov-translate.json?url'

const nationGeojson = ref();
const ccaaGeojson = ref();
const provinceGeojson = ref();


const REF_BY_MODE: Record<AppMode, any> = { 'spa': nationGeojson, 'ccaa': ccaaGeojson, 'prov': provinceGeojson } as const;
const MIN_ISLAND_AREA = 1e-4;


import UnionWorker from './union.worker.ts?worker'

const provTemplateURL = "https://api-features.ign.es/collections/administrativeunit/items?f=json&lang=es&limit=100&skipGeometry=true&nationallevelname=Provincia";
const provURL = 'https://datos.gob.es/apidata/nti/territory/Province?_pageSize=100';
const ccaaURL = 'https://datos.gob.es/apidata/nti/territory/Autonomous-region?_pageSize=100';


//GIST DATA
const GIST_ID = "59dee82db0851cfb120f2856f44db5c0";

const provincesMeta: ProvinceMeta[] = [];
const ccaaMeta: CCAAMeta[] = [];


export function useGeodata(cached: boolean) {
    
    async function setupData() {
        await fetchCCAAdata();
        
        if(cached) {
            provinceGeojson.value = await fetch(`https://gist.githubusercontent.com/dangarcar/${GIST_ID}/raw/cached-prov.geojson`).then(r => r.json());
            ccaaGeojson.value = await fetch(`https://gist.githubusercontent.com/dangarcar/${GIST_ID}/raw/cached-ccaa.geojson`).then(r => r.json());
            nationGeojson.value = await fetch(`https://gist.githubusercontent.com/dangarcar/${GIST_ID}/raw/cached-nation.geojson`).then(r => r.json());
        }
        else {
            const provinces = await fetch(provTemplateURL).then(r => r.json());
            await fetchGeometry(provinces);
            await populateProvinceGeom(provinces);
        }
    }

    function getGeodata(mode?: AppMode) {
        switch(mode) {
            case 'spa':  return nationGeojson.value;
            case 'ccaa': return ccaaGeojson.value;
            case 'prov': return provinceGeojson.value;
        }
    }

    async function loadGeometry(mode: AppMode) {
        if(REF_BY_MODE[mode].value)
            return;
        

        const factory = new GeometryFactory();
        const reader = new GeoJSONReader(factory);
        const writer = new GeoJSONWriter();
        
        const jsonTemplate: FeatureCollection = {
            type: 'FeatureCollection',
            features: [] 
        }

        switch(mode) {
            case 'spa':            
                jsonTemplate.features = await getNationFeatures(reader, writer);
            break;
            case 'ccaa':
                jsonTemplate.features = await getCCAAFeatures(reader, writer);
            break;
            case 'prov':
                jsonTemplate.features = getProvinceFeatures(writer);
            break;
        }

        REF_BY_MODE[mode].value = jsonTemplate;
    }


    return { setupData, getGeodata, loadGeometry };
}



//ASYNC GEOMETRY LOADING FUNCTIONS

async function runUnionWorker(geoBody: any) {
    const worker = new UnionWorker();
    
    return await new Promise((resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (err) => reject(err);
        
        worker.postMessage(geoBody);
    });
}


function getProvinceFeatures(writer: GeoJSONWriter): Feature[] {
    const features: Feature[] = [];

    for(const p of provincesMeta) {
        const geometry = writer.write(buildGeometry(p.geometry as any));
        const { centroid, area } = getCentroidAndArea(geometry);

        p.centroid = centroid;
        p.area = area;

        features.push({
            type: 'Feature',
            properties: {
                name: p.name,
                ccaa: p.ccaa,
                centroid: [centroid.y, centroid.x]
            },
            geometry: geometry
        });
    }

    return features;
}


async function getCCAAFeatures(reader: GeoJSONReader, writer: GeoJSONWriter) {
    const features = [];

    if(!provincesMeta[0]?.centroid)
        getProvinceFeatures(writer);


    for(const c of ccaaMeta) {
        const provinces = provincesMeta
            .filter(p => p.ccaa === c.name)
            
        const geometries = provinces
            .map(p => p.geometry)
            .flat()

        const geoBody = writer.write(buildGeometry(geometries as any));

        c.area = provinces.reduce((acc, e) => acc + e.area, 0);
        const unnormCentroid = provinces.reduce((acc, e) => {
            return { 
                x: acc.x + e.area * e.centroid.x, 
                y: acc.y + e.area * e.centroid.y
            };
        },{ x:0, y:0 });

        c.centroid = { x: unnormCentroid.x / c.area, y: unnormCentroid.y / c.area }

        features.push({
            type: 'Feature',
            properties: {
                name: c.name,
                provinces: c.provinces,
                geoBody: geoBody,
                centroid: [c.centroid.y, c.centroid.x]
            },
            geometry: c.geometry? writer.write(c.geometry) : undefined,
        });
    }
    

    await Promise.all(features.filter(f => !f.geometry).map(async f => {
        f.geometry = await runUnionWorker(f.properties!.geoBody) as any;
        delete f.properties!.geoBody;
        
        const ccaa = ccaaMeta.find(e => e.name === f.properties.name); 
        ccaa!.geometry = reader.read(f.geometry);
    }));


    // @ts-ignore
    return features as Feature[];
}


async function getNationFeatures(reader: GeoJSONReader, writer: GeoJSONWriter) {
    if(!ccaaMeta[0]?.geometry)
        await getCCAAFeatures(reader, writer);
    
    const geometries: Polygon[] = ccaaMeta.map(p => {
        // @ts-ignore
        if(p.geometry?._geometries)
            // @ts-ignore
            return p.geometry?._geometries;
        else
            return [p.geometry]
    }).flat();

    const buckets: Polygon[][] = [[], [], [], []];
    const c1 = [-4, 40];

    for(const g of geometries) {
        const c2 = g.getEnvelopeInternal().centre();
        let idx = 0;
        if(c1[0]! > c2.getX()) idx += 2;
        if(c1[1]! > c2.getY()) idx++;

        buckets[idx]?.push(g);
    }
    
    const divided = await Promise.all(buckets.map(b => {
        const geoBody = writer.write(buildGeometry(b as any));
        return runUnionWorker(geoBody).then(r => reader.read(r));
    }));


    const body = writer.write(buildGeometry(divided))

    const area = ccaaMeta.reduce((acc, e) => acc + e.area, 0);
    const unnormCentroid = ccaaMeta.reduce((acc, e) => {
        return { 
            x: acc.x + e.area * e.centroid.x, 
            y: acc.y + e.area * e.centroid.y
        };
    },{ x:0, y:0 });
    const centroid = { x: unnormCentroid.x / area, y: unnormCentroid.y / area }

    return [{
        type: 'Feature',
        properties: { name: "España", centroid: [centroid.y, centroid.x] },
        geometry: await runUnionWorker(body) as any
    }] as Feature[];
}



//FUNCTIONS FOR INITIAL DATA FETCHING

async function fetchGeometry(provinces: any) {
    const v = provinces.features;
    await Promise.all(v.map((p:any) => {
        const url = `https://api-features.ign.es/collections/administrativeunit/items/${p.id}?f=json`
        
        return fetch(url).then(r => r.json()).then(g => {
            const elem = v.find((e:any) => e.id === p.id);
            elem.geometry = g.geometry
        })
    }));
}


async function fetchCCAAdata() {
    const provRes = await fetch(provURL).then(r => r.json());
    const ccaaRes = await fetch(ccaaURL).then(r => r.json());

    for(const e of provRes.result.items) {
        const ccaaName = ccaaRes.result.items.find((f:any) => f._about === e.autonomia).label
        
        provincesMeta.push({
            name: e.label,
            ccaa: ccaaName,
            geometry: null,
            area: 0,
            centroid: { x: 0, y: 0 }
        })

        const ccaa = ccaaMeta.find(e => e.name === ccaaName);
        if(ccaa) {
            ccaa.provinces.push(e.label);
        } else {
            ccaaMeta.push({
                name: ccaaName,
                provinces: [e.label],
                geometry: null,
                area: 0,
                centroid: { x: 0, y: 0 }
            });
        }
    }
}


function buildGeometry(geometries: Geometry[]): Geometry {
    let geomCol = geometries[0];
    for(let i=1; i<geometries.length; i++) {
        geomCol = GeometryCombiner.combine(geomCol, geometries[i])
    }

    return geomCol!;
}


async function populateProvinceGeom(provinces: any) {
    const factory = new GeometryFactory();
    const reader = new GeoJSONReader(factory);

    const provNamesCollision = await fetch(provTranslate).then(r => r.json());
    const features = reader.read(provinces).features
    
    for(const f of features) {
        const e = provincesMeta.find((e) => e.name === f.properties.nameunit || provNamesCollision[e.name] === f.properties.nameunit)
        if(e !== undefined)
            e.geometry = f.geometry._geometries.filter((e:any) => e.getArea() > MIN_ISLAND_AREA);
    }
}



//AREA AND CENTROID CALCULATIONS

function shoelaceArea(v: [number, number][]) {
    return v.reduce((acc, vi, i) => {
        const vj = v[(i+1) % v.length]!;
        return acc + vi[0]*vj[1] - vj[0]*vi[1];
    }, 0) * 0.5;
}

function centerOfPolTimesArea(v: [number,number][]): vec2 {
    return v.reduce((acc, vi, i) => {
        const vj = v[(i+1) % v.length]!;
        const fi = vi[0]*vj[1] - vj[0]*vi[1];
        const dx = vi[0] + vj[0];
        const dy = vi[1] + vj[1];

        return {x: acc.x + dx*fi, y: acc.y + dy*fi};
    }, {x:0, y:0});
}

function getCentroidAndArea(geometry: any) {
    const centerList: PolygonCentroid[] = [];

    for(const ip of geometry.coordinates) {
        if(typeof ip[0][0] === "number") {
            const p = ip;
            const area = shoelaceArea(p);
            const center = centerOfPolTimesArea(p);

            centerList.push({area, centroid: center});
        } else {
            for(const p of ip) {
                const area = shoelaceArea(p);
                const center = centerOfPolTimesArea(p);
                
                centerList.push({area, centroid: center});
            }
        }
    }

    const totalArea = centerList.reduce((acc, e) => acc + e.area, 0)
    const newVec: vec2 = centerList.reduce((acc, e) => { 
        return { x: acc.x + e.centroid.x, y: acc.y + e.centroid.y }
    }, {x:0, y:0})

    const centroid = { x: newVec.x / (6*totalArea), y: newVec.y / (6*totalArea) };
    return { centroid: centroid, area: Math.abs(totalArea) };
}

import { ref } from 'vue';
import type { AppMode, CCAAMeta, ProvinceMeta } from '../types';
import type { Feature, FeatureCollection } from 'geojson';


import { GeoJSONReader, GeoJSONWriter } from 'jsts/org/locationtech/jts/io';
import { Geometry, GeometryFactory } from "jsts/org/locationtech/jts/geom";
import { GeometryCombiner } from 'jsts/org/locationtech/jts/geom/util';

import provTranslate from '/prov-translate.json?url'

const nationGeojson = ref();
const ccaaGeojson = ref();
const provinceGeojson = ref();


const REF_BY_MODE: Record<AppMode, any> = { 'spa': nationGeojson, 'ccaa': ccaaGeojson, 'prov': provinceGeojson } as const;
const MIN_ISLAND_AREA = 1e-4;


const WORKER_URL = new URL("./union.worker.ts", import.meta.url);

const provTemplateURL = "https://api-features.ign.es/collections/administrativeunit/items?f=json&lang=es&limit=100&skipGeometry=true&nationallevelname=Provincia";
const provURL = 'https://datos.gob.es/apidata/nti/territory/Province?_pageSize=100';
const ccaaURL = 'https://datos.gob.es/apidata/nti/territory/Autonomous-region?_pageSize=100';


const provincesMeta: ProvinceMeta[] = [];
const ccaaMeta: CCAAMeta[] = [];


export function useGeodata() {
    async function setupData() {
        console.time('api2')
        
        const provinces = await fetch(provTemplateURL).then(r => r.json());
        
        await fetchCCAAdata();

        await fetchGeometry(provinces);
        await populateProvinceGeom(provinces);
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
        
        const writer = new GeoJSONWriter();
        const jsonTemplate: FeatureCollection = {
            type: 'FeatureCollection',
            features: [] 
        }

        switch(mode) {
            case 'spa':            
                jsonTemplate.features = await getNationFeatures(writer);
            break;
            case 'ccaa':
                jsonTemplate.features = await getCCAAFeatures(writer);
            break;
            case 'prov':
                jsonTemplate.features = getProvinceFeatures(writer);
            break;
        }

        REF_BY_MODE[mode].value = jsonTemplate;
    }


    return { setupData, getGeodata, loadGeometry };
}



async function runUnionWorker(geoBody: any) {
    const worker = new Worker(WORKER_URL, { type: 'module' });
    
    return await new Promise((resolve, reject) => {
        worker.onmessage = (e) => resolve(e.data);
        worker.onerror = (err) => reject(err);
        
        worker.postMessage(geoBody);
    });
}


function getProvinceFeatures(writer: GeoJSONWriter): Feature[] {
    const features: Feature[] = [];

    for(const p of provincesMeta) {
        const geometry = buildGeometry(p.geometry as any);
        
        features.push({
            type: 'Feature',
            properties: {
                name: p.name,
                ccaa: p.ccaa
            },
            geometry: writer.write(geometry)
        });
    }

    return features;
}


async function getCCAAFeatures(writer: GeoJSONWriter) {
    const features = [];

    for(const c of ccaaMeta) {
        const geometries = provincesMeta
            .filter(p => p.ccaa === c.name)
            .map(p => p.geometry)
            .flat()

        const geoBody = writer.write(buildGeometry(geometries as any));

        features.push({
            type: 'Feature',
            properties: {
                name: c.name,
                provinces: c.provinces
            },
            geometry: undefined,
            geoBody: geoBody
        });
    }
    
    await Promise.all(features.map(async (c) => {
        c.geometry = await runUnionWorker(c.geoBody) as any;
        delete c.geoBody;
    }));

    return features;
}


async function getNationFeatures(writer: GeoJSONWriter) {
    const geometries = provincesMeta.map(p => p.geometry).flat();
    const geoBody = writer.write(buildGeometry(geometries as any));

    return [{
        type: 'Feature',
        properties: { name: "España" },
        geometry: await runUnionWorker(geoBody) as any
    }] as Feature[];
}



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
            geometry: null
        })

        const ccaa = ccaaMeta.find(e => e.name === ccaaName);
        if(ccaa) {
            ccaa.provinces.push(e.label);
        } else {
            ccaaMeta.push({
                name: ccaaName,
                provinces: [e.label],
                geometry: null
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

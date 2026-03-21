import { ref } from 'vue';
import type { AppMode, CCAAMeta, ProvinceMeta } from '../types';
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
//const WORKER_URL = new URL(workerUrl, import.meta.url);

const provTemplateURL = "https://api-features.ign.es/collections/administrativeunit/items?f=json&lang=es&limit=100&skipGeometry=true&nationallevelname=Provincia";
const provURL = 'https://datos.gob.es/apidata/nti/territory/Province?_pageSize=100';
const ccaaURL = 'https://datos.gob.es/apidata/nti/territory/Autonomous-region?_pageSize=100';


const provincesMeta: ProvinceMeta[] = [];
const ccaaMeta: CCAAMeta[] = [];


export function useGeodata(cached: boolean) {
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

        console.log(JSON.stringify(jsonTemplate));
    }


    return { setupData, getGeodata, loadGeometry };
}



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


async function getCCAAFeatures(reader: GeoJSONReader, writer: GeoJSONWriter) {
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
                provinces: c.provinces,
                geoBody: geoBody
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

    return [{
        type: 'Feature',
        properties: { name: "España" },
        geometry: await runUnionWorker(body) as any
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

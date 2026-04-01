import { ref } from 'vue';
import { LatLng } from 'leaflet';

import { CENTER_TYPES, type CenterType, type Municipality, type PopProvince } from '../types';
import ineTables from '/ine-tables.json?url'
import type { Feature, FeatureCollection } from 'geojson';


export function usePopulation() {
    const munsByProvince = ref<PopProvince[]>();
    
    async function setupPopulation() {
        const codes = await fetch(ineTables).then(r => r.json());

        munsByProvince.value = await Promise.all(codes.map(async (c:any) => {
            const raw = await fetch(getIneURL(c.code)).then(r => r.json());

            const muns: Municipality[] = raw
                .filter((e:any) => e.MetaData[0]['FK_Variable'] === 19 && e.Data.length === 1)
                .map((e:any) => {
                    return {
                        name: e.MetaData[0]['Nombre'],
                        population: e.Data[0]['Valor'],
                        ineCode: e.MetaData[0]['Codigo'],
                        coords: null,
                        mainMunPop: 0
                    };
                });

            return {
                name: c.name, 
                cpro: parseInt(muns[0]!.ineCode.slice(0, 2)),
                muns: muns,
                totalPopulation: raw.find((e:any) => e.MetaData[0]['FK_Variable'] === 115).Data[0]['Valor']
            }
        }));

        const total = 40000; //It is a bit less but
        const limit = 10000;
        const urls = [ otherVillagesIgnURL ];
        for(let off=0; off<total; off += limit) {
            urls.push(getIgnURL(limit, off));
        }

        console.time('coordsFetch')
        const elems = await Promise.all(urls.map(async url => {
            const raw = await fetch(url).then(r => r.json());
            
            return raw.features
                .map((f:any) => {
                    const cod = f.properties.codine.slice(0, 5);
                    return {
                        cod: cod,
                        cpro: parseInt(f.properties.cpro),
                        coords: new LatLng(f.properties.latitud, f.properties.longitud),
                        capital: f.properties.capital,
                        habitantes: f.properties.habitantes
                    };
                })
        })).then(r => r.flat());
        
        for(const e of elems) {
            const prov = munsByProvince.value.find(p => p.cpro === e.cpro);
            const mun = prov?.muns.find(m => m.ineCode === e.cod);

            if(!mun || !e.coords) {
                console.error("Municipalities couldn't be loaded correctly");
                continue;
            }

            if(e.capital[3] === '1' || e.habitantes > mun.mainMunPop) {
                mun.coords = e.coords;
                mun.provCap =  e.capital[2] === '1';
                mun.ccaaCap = e.capital[1] === '1';
                mun.nationCap =  e.capital[0] === '1';
                mun.mainMunPop = e.capital[3] === '1'? 1e9 : e.habitantes;
            }
        }
        
        //Clean four municipalities that doesn't appear somehow :(
        munsByProvince.value.forEach(v => v.muns = v.muns.filter(m => m.provCap !== undefined));
        console.timeEnd('coordsFetch')
    }

    function getMunicipalities(province: string) {
        const prov = munsByProvince.value?.find(e => e.name === province);

        return prov?.muns.map(e => {
            if(!e.coords)
                console.error(e.name)

            return {
                type: 'Feature',
                properties: {
                    name: e.name,
                    population: e.population,
                    provCap: e.provCap,
                    ccaaCap: e.ccaaCap,
                    nationCap: e.nationCap
                },
                geometry: {
                    type: "Point",
                    coordinates: [e.coords?.lng, e.coords?.lat]
                }
            } as Feature
        });
    }

    function getAllMunicipalities() {
        return munsByProvince.value?.flatMap(p => getMunicipalities(p.name)!);
    }

    function addCenters(collection: FeatureCollection, centroid: LatLng) {
        //CENTROID        
        collection.features.push({
            type: 'Feature',
            properties: {
                centerType: 'centroid' as CenterType
            },
            geometry: {
                type: 'Point',
                coordinates: [centroid.lng, centroid.lat]
            }
        })


        collection.features.push({
            type: 'Feature',
            properties: {
                centerType: 'centroid' as CenterType
            },
            geometry: {
                type: 'Point',
                coordinates: [centroid.lng, centroid.lat]
            }
        })

        return collection;
    }

    return { setupPopulation, getMunicipalities, getAllMunicipalities, addCenters };
}

function getIneURL(code: string) {
    return `https://servicios.ine.es/wstempus/jsCache/es/DATOS_TABLA/${code}?nult=1&tip=M&tv=18:451`
}

function getIgnURL(limit: number, offset: number) {
    return `https://api-features.ign.es/collections/nuc/items?f=json&lang=es&limit=${limit}&offset=${offset}&properties=cpro,codine,capital,latitud,longitud,habitantes&skipGeometry=true`
} 

const otherVillagesIgnURL = 'https://api-features.ign.es/collections/opob/items?f=json&lang=es&limit=100&properties=cpro,codine,capital,latitud,longitud,habitantes&skipGeometry=true&capital=000100'



import { LatLng } from 'leaflet';
import type { Municipality, PopProvince } from '../types';
import ineTables from '/ine-tables.json?url'


export function usePopulation(cached: boolean) {
    async function loadPopulation() {
        const codes = await fetch(ineTables).then(r => r.json());

        const munsByProvince: PopProvince[] = await Promise.all(codes.map(async (c:any) => {
            const raw = await fetch(getIneURL(c.code)).then(r => r.json());
            
            const muns: Municipality[] = raw
                .filter((e:any) => e.MetaData[0]['FK_Variable'] === 19 && e.Data.length === 1)
                .map((e:any) => {
                    return {
                        name: e.MetaData[0]['Nombre'],
                        population: e.Data[0]['Valor'],
                        ineCode: e.MetaData[0]['Codigo'],
                        coords: null
                    };
                });

            return {
                name: c.name, 
                cpro: parseInt(muns[0]!.ineCode.slice(0, 2)),
                muns: muns
            }
        }));

        const total = 37000; //It is a bit less but
        const limit = 9300;
        const urls = [];
        for(let off=0; off<total; off += limit) {
            urls.push(getIgnURL(limit, off));
        }

        console.time('coordsFetch')
        const elems = await Promise.all(urls.map(async url => {
            const raw = await fetch(url).then(r => r.json());
            
            return raw.features
                .filter((f:any) => f.properties.capital[3] === '1')
                .map((f:any) => {
                    const cod = f.properties.codine.slice(0, 5);
                    return {
                        cod: cod,
                        cpro: parseInt(f.properties.cpro),
                        coords: new LatLng(f.properties.latitud, f.properties.longitud),
                        provCap: f.properties.capital[2] === '1',
                        ccaaCap: f.properties.capital[1] === '1',
                        nationCap: f.properties.capital[0] === '1',
                    };
                })
        })).then(r => r.flat());
        console.timeEnd('coordsFetch')

        for(const e of elems) {
            const prov = munsByProvince.find(p => p.cpro === e.cpro);
            const mun = prov?.muns.find(m => m.ineCode === e.cod);

            if(!mun || !e.coords) {
                console.error("Municipalities couldn't be loaded correctly");
                continue;
            }

            mun.coords = e.coords;
            mun.provCap = e.provCap;
            mun.ccaaCap = e.ccaaCap;
            mun.nationCap = e.nationCap;
        }

        console.log(munsByProvince);
    }

    function getMunicipalities(province: string) {

    }

    return { loadPopulation, getMunicipalities };
}

function getIneURL(code: string) {
    return `https://servicios.ine.es/wstempus/jsCache/es/DATOS_TABLA/${code}?nult=1&tip=M&tv=18:451`
}

function getIgnURL(limit: number, offset: number) {
    return `https://api-features.ign.es/collections/nuc/items?f=json&lang=es&limit=${limit}&offset=${offset}&properties=cpro,codine,capital,latitud,longitud&skipGeometry=true&tipo=NUCL&ine=1`
} 
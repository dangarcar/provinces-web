import { computed, ref } from 'vue';
import { APP_MODES, type AppMode } from '../types';

const nation = ref();
const nationGeom = computed<boolean>(() => nation && nation.value.features.every((f: any) => f.geometry))

const ccaa = ref();
const ccaaGeom = computed<boolean>(() => ccaa && ccaa.value.features.every((f: any) => f.geometry))

const provinces = ref();
const provGeom = computed<boolean>(() => provinces && provinces.value.features.every((f: any) => f.geometry))

const REF_BY_MODE: Record<AppMode, any> = { 'spa': nation, 'ccaa': ccaa, 'prov': provinces } as const;
const GEOM_BY_MODE: Record<AppMode, any> = { 'spa': nationGeom, 'ccaa': ccaaGeom, 'prov': provGeom } as const;


function nationalLevelByMode(mode: AppMode) {
    switch(mode) {
        case "spa":  return encodeURIComponent("https://inspire.ec.europa.eu/codelist/AdministrativeHierarchyLevel/1stOrder")
        case "ccaa": return encodeURIComponent("https://inspire.ec.europa.eu/codelist/AdministrativeHierarchyLevel/2ndOrder")
        case "prov": return encodeURIComponent("https://inspire.ec.europa.eu/codelist/AdministrativeHierarchyLevel/3rdOrder")
    }
}

function createIgnApiUrl(mode: AppMode) {
    return `https://api-features.ign.es/collections/administrativeunit/items?f=json&lang=es&limit=100&skipGeometry=true&nationallevel=${nationalLevelByMode(mode)}`
}


export function useGeodata() {
    async function setupData() {
        console.time('api2')
        
        const [jNation, jCcaa, jProv] = await Promise.all(APP_MODES.map(m => {
            const url = createIgnApiUrl(m as AppMode);
            return fetch(url).then(r => r.json())
        }));

        console.timeEnd('api2')

        nation.value = jNation;
        ccaa.value = jCcaa;
        provinces.value = jProv;
    }

    function getGeodata(mode?: AppMode) {
        switch(mode) {
            case 'spa':  return nation.value;
            case 'ccaa': return ccaa.value;
            case 'prov': return provinces.value;
        }
    }

    async function loadGeometry(mode: AppMode) {    
        if(GEOM_BY_MODE[mode].value)
            return;
    
        const v = REF_BY_MODE[mode].value.features;
        await Promise.all(v.map((p:any) => {
            const url = `https://api-features.ign.es/collections/administrativeunit/items/${p.id}?f=json`
            
            return fetch(url).then(r => r.json()).then(g => {
                const elem = v.find((e:any) => e.id === p.id);
                elem.geometry = g.geometry
            })
        }));
    }


    return { setupData, getGeodata, loadGeometry };
}
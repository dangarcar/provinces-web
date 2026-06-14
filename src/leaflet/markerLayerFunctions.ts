import type { Feature, FeatureCollection } from "geojson";
import { LatLng } from "leaflet";
import L from "leaflet";
import colors from "tailwindcss/colors";
import type { AppMode, Centers, CenterType } from "../types";

import marker1 from "/marker1.png"
import marker2 from "/marker2.png"
import marker3 from "/marker3.png"
import { h, render } from "vue";
import InfoTooltip from "../components/InfoTooltip.vue";


export function getPointLayer(feature: Feature, mode: AppMode, getMunicipalities: (p: string) => Feature[]|undefined, getAllMunicipalities: () => Feature[]|undefined) {
    let features: Feature[] = [];

    switch(mode) {
    case "prov":
        features = getMunicipalities(feature?.properties?.name)!;
    break;
    case "ccaa": 
        features = feature?.properties?.provinces.flatMap((p:string) => getMunicipalities(p))
    break;
    default:
        features = getAllMunicipalities()!;
    }

    const jsonTemplate: FeatureCollection = {
        type: 'FeatureCollection',
        features: features
    };

    return jsonTemplate;
}


export function addCenterFeatures(collection: FeatureCollection, centers: Centers) {
    collection.features.push({
        type: 'Feature',
        properties: { centerType: 'centroid' as CenterType },
        geometry: {
            type: 'Point',
            coordinates: centers.centroid
        }
    });

    collection.features.push({
        type: 'Feature',
        properties: { centerType: 'municipal' as CenterType },
        geometry: {
            type: 'Point',
            coordinates: centers.municipal
        }
    });

    collection.features.push({
        type: 'Feature',
        properties: { centerType: 'population' as CenterType },
        geometry: {
            type: 'Point',
            coordinates: centers.population
        }
    });

    return collection;
}


export function useOnEachFeaturePoint(mode: AppMode, centers: Centers) {
    return (f: Feature, layer: L.Layer) => {
        if(f.properties?.centerType)
            return;

        const container = document.createElement('div')
        render(h(InfoTooltip, { f, mode, centers }), container);

        layer.bindTooltip(container.innerHTML, {
            direction: "top",
            offset: [0, 0],
            className: 'custom-tooltip',
        });
    }
}

export function usePointToLayer(mode: AppMode) {
    return (f: Feature, latlng: LatLng) => {
        const isMunicipality = f.properties?.centerType === undefined;
        const cap = capitalByMode(f, mode);

        if(isMunicipality)
            return L.circleMarker(latlng, { //radius is later assigned
                fillColor: cap? colors.red[500] : colors.yellow[400],
                fillOpacity: 1,
                color: colors.stone[900],
                weight: 1,
                pane: 'shadowPane',
                bubblingMouseEvents: false
            });
        else {
            const options = structuredClone(L.Icon.Default.prototype.options) as L.IconOptions;
            
            switch(f.properties?.centerType) {
                case 'centroid': options.iconUrl = options.iconRetinaUrl = marker1; break;
                case 'municipal': options.iconUrl = options.iconRetinaUrl = marker2; break;
                case 'population': options.iconUrl = options.iconRetinaUrl = marker3; break;
            }

            return L.marker(latlng, { icon: L.icon(options) });
        }
    }
}

export function resizeMarkers(layer: any, zoom: number, mode: AppMode) {
    if(layer.feature.properties.centerType)
        return;

    const cap = capitalByMode(layer.feature, mode)

    layer.setRadius(Math.pow(1.4, zoom - (cap? 1:4)));
    layer.setStyle({ opacity: zoom < 7? 0 : 1 });
}

export function capitalByMode(f: Feature, mode: AppMode) {
    let cap = false;
    switch(mode) {
        case "spa": cap = f.properties?.nationCap; break;
        case "ccaa": cap = f.properties?.ccaaCap; break;
        case "prov": cap = f.properties?.provCap; break;
    }

    return cap;
}
import type { Feature, FeatureCollection } from "geojson";
import { LatLng } from "leaflet";
import L from "leaflet";
import colors from "tailwindcss/colors";
import type { AppMode } from "../types";

import marker1 from "/marker1.png"
import marker2 from "/marker2.png"
import marker3 from "/marker3.png"


export function getPointLayer(feature: Feature, mode: AppMode, getMunicipalities: any, getAllMunicipalities: any, addCenters: any) {
    let features: Feature[] = [];

    switch(mode) {
    case "prov":
        features = getMunicipalities(feature?.properties?.name)!;
    break;
    case "ccaa": 
        features = feature?.properties?.provinces.flatMap((p:any) => getMunicipalities(p))
    break;
    default:
        features = getAllMunicipalities()!;
    }

    const jsonTemplate: FeatureCollection = {
        type: 'FeatureCollection',
        features: features
    };


    const centroid = feature.properties?.centroid;
    return addCenters(jsonTemplate, new LatLng(centroid[0], centroid[1]));
}


export function useOnEachFeaturePoint(mode: AppMode) {
    return (f: Feature, layer: L.Layer) => {
        if(f.properties?.centerType)
            return;

        const tooltipContent = `
            <div class="bg-white rounded-xl shadow-lg px-4 py-3 min-w-40">

            <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-gray-800">
                ${f.properties?.name}
                </span>
                ${
                capitalByMode(f, mode)
                ?   `<span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                    Capital
                    </span>`
                : ""
                }
            </div>

            <div class="text-sm text-gray-500">
                Population
            </div>

            <div class="text-lg font-bold text-gray-900">
                ${f.properties?.population.toLocaleString()}
            </div>

            <div class="flex flex-col items-center">
                <div class="bg-white rounded-xl shadow-lg px-4 py-3"></div>
                <div class="w-3 h-3 bg-white rotate-45 -mt-1 shadow"></div>
            </div>

            </div>`;
            
        layer.bindTooltip(tooltipContent, {
            direction: "top",
            offset: [0, 0],
            className: 'custom-tooltip'
        });
    }
}

export function usePointToLayer(mode: AppMode) {
    return (f: Feature, latlng: LatLng) => {
        const isMunicipality = f.properties?.centerType === undefined;
        const cap = capitalByMode(f, mode);

        if(isMunicipality)
            return L.circleMarker(latlng, {
                radius: cap? 12: 9,
                fillColor: cap? colors.red[500] : colors.yellow[400],
                fillOpacity: 1,
                pane: 'shadowPane',
            });
        else {
            const options = structuredClone(L.Icon.Default.prototype.options) as L.IconOptions;
            
            switch(f.properties?.centerType) {
                case 'centroid': options.iconUrl = marker1; break;
                case 'municipal': options.iconUrl = marker2; break;
                case 'population': options.iconUrl = marker3; break;
            }

            return L.marker(latlng, { icon: L.icon(options) });
        }
    }
}

function capitalByMode(f: Feature, mode: AppMode) {
    let cap = false;
    switch(mode) {
        case "spa": cap = f.properties?.nationCap; break;
        case "ccaa": cap = f.properties?.ccaaCap; break;
        case "prov": cap = f.properties?.provCap; break;
    }

    return cap;
}
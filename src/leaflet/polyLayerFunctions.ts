import colors from "tailwindcss/colors"

import { type AppMode } from "../types";
import { type StyleFunction } from "leaflet";
import { useIsMobile } from "../composables/useIsMobile";

const isMobile = useIsMobile();

export function getStyleFunction(mode?: AppMode): StyleFunction {
    if(!mode) 
        return () => ({})

    return () => baseStyle[mode];
}

export function getStyle(mode: AppMode, type: 'click' | 'hover') {
    if(type === 'click')
        return clickStyle[mode];

    if(type === 'hover')
        return hoverStyle[mode];
}

const baseStyle: Record<AppMode, any> = {
    'spa': {
        color: colors.rose[400],
        fillColor: colors.rose[500],
        fillOpacity: 0.2,
        weight: isMobile.value? 1 : 2
    },
    'ccaa': {
        color: colors.emerald[300],
        fillColor: colors.emerald[400],
        fillOpacity: 0.2,
        weight: isMobile.value? 1 : 2
    },
    'prov': {
        color: colors.cyan[300],
        fillColor: colors.cyan[400],
        fillOpacity: 0.2,
        weight: isMobile.value? 1 : 2
    }
} as const;

const hoverStyle: Record<AppMode, any> = {
    'spa': {
        color: colors.rose[300],
        fillColor: colors.rose[600],
        fillOpacity: 0.4,
        weight: isMobile.value? 2 : 3
    },
    'ccaa': {
        color: colors.emerald[200],
        fillColor: colors.emerald[500],
        fillOpacity: 0.4,
        weight: isMobile.value? 2 : 3
    },
    'prov': {
        color: colors.cyan[200],
        fillColor: colors.cyan[500],
        fillOpacity: 0.4,
        weight: isMobile.value? 2 : 3
    }
} as const;

const clickStyle: Record<AppMode, any> = {
    'spa': {
        color: colors.rose[200],
        fillColor: colors.rose[500],
        fillOpacity: 0.5,
        weight: isMobile.value? 2 : 3
    },
    'ccaa': {
        color: colors.emerald[100],
        fillColor: colors.emerald[500],
        fillOpacity: 0.7,
        weight: isMobile.value? 2 : 3
    },
    'prov': {
        color: colors.cyan[200],
        fillColor: colors.cyan[500],
        fillOpacity: 0.7,
        weight: isMobile.value? 2 : 3
    }
} as const;
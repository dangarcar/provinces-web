
export function formatCoords(coords: [number, number]) {
    return formatDegree(coords[1]) + (coords[1] > 0? 'N':'S') + ', ' + formatDegree(coords[0]) + (coords[0] > 0? 'E':'W');
}

export function distanceKm(coord1: [number, number], coord2: [number, number]) {    
    const lat1 = coord1[1];
    const lon1 = coord1[0];
    const lat2 = coord2[1];
    const lon2 = coord2[0];

    const toRad = (deg: number) => deg * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const R = 6371;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDegree(x: number): string {
    const n = Math.abs(x), deg = Math.floor(n);
    const min = Math.floor(60 * (n-deg));
    const sec = Math.round(60 * (60*(n-deg) - min));

    return `${deg}º ${String(min).padStart(2,'0')}' ${String(sec).padStart(2,'0')}''`;
}
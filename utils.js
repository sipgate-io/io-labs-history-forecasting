import fs from 'fs';
export function parseAreaCodeCSV(filename) {
    const areaCodeMap = {};
    const allAreaCodes = fs.readFileSync(filename).toString().split('\n');
    for (const line of allAreaCodes) {
        let [city, areaCode, lng, lat] = line.split(';');
        areaCodeMap[areaCode] = {
            city: city,
            lng: lng,
            lat: lat,
            occurrences: 0,
        };
    }
    return areaCodeMap;
}

export function isCountryNumber(countryNumber, number) {
    return number.startsWith(countryNumber);
}

export function createFeatureJSON(areaCodeMap) {
    let featureData = [];

    Object.keys(areaCodeMap).forEach((key) => {
        if (areaCodeMap[key].occurrences) {
            featureData.push({
                type: 'Feature',
                properties: {
                    name: `<b>${areaCodeMap[key].city}</b><br>Anrufe: ${areaCodeMap[key].occurrences}`,
                },
                geometry: {
                    type: 'Point',
                    coordinates: [areaCodeMap[key].lng, areaCodeMap[key].lat],
                },
            });
        }
    });
    return JSON.stringify(
        {
            type: 'FeatureCollection',
            features: featureData,
        },
        null,
        2
    );
}

export function createHeatJSON(areaCodeMap, maxOccurrence) {
    let heatData = [];
    Object.keys(areaCodeMap).forEach((key) => {
        if (areaCodeMap[key].occurrences) {
            heatData.push([
                areaCodeMap[key].lng,
                areaCodeMap[key].lat,
                (areaCodeMap[key].occurrences / maxOccurrence) * 100,
            ]);
        }
    });
    return JSON.stringify(heatData, null, 2);
}

export function forecast(areaCodeMap, maxSlice) {
    let maxOccurrences = [];
    Object.keys(areaCodeMap).forEach((key) => {
        if (areaCodeMap[key].occurrences) {
            maxOccurrences.push([
                areaCodeMap[key].occurrences,
                {
                    key: key,
                    city: areaCodeMap[key].city,
                    lng: areaCodeMap[key].lng,
                    lat: areaCodeMap[key].lat,
                },
            ]);
        }
    });
    maxOccurrences.sort((a, b) => b[0] - a[0]);
    let newAreaMap = {};
    for (let city of maxOccurrences.slice(0, maxSlice)) {
        newAreaMap[city[1].key] = {
            occurrences: city[0],
            city: city[1].city,
            lng: city[1].lng,
            lat: city[1].lat,
        };
    }
    return newAreaMap;
}

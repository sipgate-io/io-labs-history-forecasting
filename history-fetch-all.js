import * as dotenv from 'dotenv';
import { createHistoryModule, sipgateIO } from 'sipgateio';
import fs from 'fs';

dotenv.config();

const personalAccessTokenId = process.env.SIPGATE_TOKEN_ID || '';
const personalAccessToken = process.env.SIPGATE_TOKEN || '';
/**
 * For details on how to instantiate the client, see 'examples/client/client.ts'
 */
let areaCodeMap = parseAreaCodeCSV('./data/are_codes.csv');

const client = sipgateIO({
    tokenId: personalAccessTokenId,
    token: personalAccessToken,
});
const historyModule = createHistoryModule(client);

export function fetchAll() {
    historyModule
        .fetchAll(
            { types: ['SMS', 'FAX', 'CALL'], directions: ['INCOMING'] },
            { offset: 0, limit: 100 }
        )
        .then((historyElements) => {
            let maxOccurrence = 0;

            historyElements.forEach((entry) => {
                let number = entry.source;
                if (!isCountryNumber('+49', number)) {
                    return;
                }
                number = '0' + number.substring(3);

                for (let i = 5; i > 1; i--) {
                    const areaCode = number.substr(0, i);
                    if (areaCodeMap[areaCode]) {
                        areaCodeMap[areaCode].occurrences += 1;
                        if (areaCodeMap[areaCode].occurrences > maxOccurrence) {
                            maxOccurrence = areaCodeMap[areaCode].occurrences;
                        }
                        break;
                    }
                }
            });

            let featureDataJSON = createFeatureJSON(areaCodeMap, maxOccurrence);
            fs.writeFile('./map/features.geo.json', featureDataJSON, (err) => {
                if (err) return console.log(err);
                console.log('Created ./map/features.geo.json');
            });

            let heatDataJSON = createHeatJSON(areaCodeMap, maxOccurrence);
            fs.writeFile('./map/heat.json', heatDataJSON, (err) => {
                if (err) return console.log(err);
                console.log('Created ./map/heat.json');
            });

            let forecastData = forecast(areaCodeMap, 10);
            console.log('Forecast:\n', forecastData);
            let topFeatureDataJSON = createFeatureJSON(forecastData);
            fs.writeFile(
                './map/features.top.geo.json',
                topFeatureDataJSON,
                (err) => {
                    if (err) return console.log(err);
                    console.log('Created ./map/featues.top.geo.json');
                }
            );
        })
        .catch(console.error);
}

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

fetchAll();

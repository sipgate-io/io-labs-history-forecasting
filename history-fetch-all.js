import * as dotenv from 'dotenv';
import { createHistoryModule, sipgateIO } from 'sipgateio';
import fs from 'fs';

dotenv.config();

const personalAccessTokenId = process.env.SIPGATE_TOKEN_ID || '';
const personalAccessToken = process.env.SIPGATE_TOKEN || '';
/**
 * For details on how to instantiate the client, see 'examples/client/client.ts'
 */
let areaCodeMap = parseAreaCodeCSV('./data/area_codes.csv');
let postalCodeMap = parsePostalCodeCSV('./data/postal_codes.csv');

const client = sipgateIO({
    tokenId: personalAccessTokenId,
    token: personalAccessToken,
});
const historyModule = createHistoryModule(client);

function fetchAll() {
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
                number = number.substring(3);

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
            const areaCodeMatch = [];

            Object.keys(areaCodeMap).forEach((key) => {
                if (areaCodeMap[key].occurrences > 0) {
                    areaCodeMatch.push({ areacode: key, ...areaCodeMap[key] });
                }
            });

            areaCodeMatch.sort((firstCity, secondCity) => {
                return secondCity.occurrences - firstCity.occurrences;
            });

            let featureDataJSON = createFeatureJSON(
                areaCodeMap,
                postalCodeMap,
                maxOccurrence
            );
            fs.writeFile('./map/features.geo.json', featureDataJSON, (err) => {
                if (err) return console.log(err);
                console.log('Created ./map/features.geo.json');
            });

            let heatDataJSON = createHeatJSON(
                areaCodeMap,
                postalCodeMap,
                maxOccurrence
            );
            fs.writeFile('./map/heat.json', heatDataJSON, (err) => {
                if (err) return console.log(err);
                console.log('Created ./map/heat.json');
            });

            console.log('Forecast:\n', forecast(areaCodeMap, 10));
        })
        .catch(console.error);
}

export function parseAreaCodeCSV(filename) {
    const areaCodeMap = {};
    const allAreaCodes = fs.readFileSync(filename).toString().split('\n');
    for (const line of allAreaCodes.slice(1, -1)) {
        let [areaCode, city] = line.split(';');
        areaCodeMap[areaCode] = { city: city, occurrences: 0 };
    }
    return areaCodeMap;
}

export function isCountryNumber(countryNumber, number) {
    return number.startsWith(countryNumber);
}

export function parsePostalCodeCSV(filename) {
    const postalCodeMap = {};
    const allPostalCodes = fs.readFileSync(filename).toString().split('\n');
    for (const line of allPostalCodes.slice(1, -1)) {
        let [
            primary_key,
            zipcode,
            city,
            state,
            community,
            latitude,
            longitude,
        ] = line.split(';');
        postalCodeMap[city] = {
            zipcode: zipcode,
            state: state,
            latitude: latitude,
            longitude: longitude,
        };
    }
    return postalCodeMap;
}

export function createFeatureJSON(areaCodeMap, postalCodeMap) {
    let featureData = [];
    Object.keys(areaCodeMap).forEach((key) => {
        if (postalCodeMap[areaCodeMap[key].city]) {
            if (areaCodeMap[key].occurrences) {
                featureData.push({
                    type: 'Feature',
                    properties: {
                        name: `<b>${areaCodeMap[key].city}</b><br>Anrufe: ${areaCodeMap[key].occurrences}`,
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            postalCodeMap[areaCodeMap[key].city].longitude,
                            postalCodeMap[areaCodeMap[key].city].latitude,
                        ],
                    },
                });
            }
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

export function createHeatJSON(areaCodeMap, postalCodeMap, maxOccurrence) {
    let heatData = [];
    Object.keys(areaCodeMap).forEach((key) => {
        if (postalCodeMap[areaCodeMap[key].city]) {
            if (areaCodeMap[key].occurrences) {
                heatData.push([
                    postalCodeMap[areaCodeMap[key].city].latitude,
                    postalCodeMap[areaCodeMap[key].city].longitude,
                    (areaCodeMap[key].occurrences / maxOccurrence) * 100,
                ]);
            }
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
                },
            ]);
        }
    });
    maxOccurrences.sort((a, b) => b[0] - a[0]);
    return maxOccurrences.slice(0, maxSlice);
}

fetchAll();

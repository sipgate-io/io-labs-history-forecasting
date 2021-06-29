import fs from 'fs';
import {
    parseAreaCodeCSV,
    parsePostalCodeCSV,
    createHeatJSON,
    createFeatureJSON,
    forecast,
} from './history-fetch-all.js';

function createTestData(maxOccurrence) {
    const areaCodeMap = parseAreaCodeCSV('./data/area_codes.csv');
    const postalCodeMap = parsePostalCodeCSV('./data/postal_codes.csv');

    Object.keys(areaCodeMap).forEach((key) => {
        if (Math.random() > 0.7) {
            let randOccurrence = Math.floor(maxOccurrence * Math.random());
            areaCodeMap[key].occurrences = randOccurrence;
        }
    });

    let featureDataJSON = createFeatureJSON(areaCodeMap, postalCodeMap);

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

    console.log(forecast(areaCodeMap, 10));
}

createTestData(256);

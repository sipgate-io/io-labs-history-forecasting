import * as dotenv from 'dotenv';
import { createHistoryModule, sipgateIO } from 'sipgateio';
import { parseAreaCodeCSV, isCountryNumber, createFeatureJSON, createHeatJSON, forecast } from './utils.js';
import fs from 'fs';

dotenv.config();

const personalAccessTokenId = process.env.SIPGATE_TOKEN_ID || '';
const personalAccessToken = process.env.SIPGATE_TOKEN || '';
/**
 * For details on how to instantiate the client, see 'examples/client/client.ts'
 */
let areaCodeMap = parseAreaCodeCSV('./data/area_codes.csv');

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
            // console.log('Forecast:\n', forecastData);
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


fetchAll();

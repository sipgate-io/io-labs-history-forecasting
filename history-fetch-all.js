import * as dotenv from 'dotenv';
import { createHistoryModule, sipgateIO } from 'sipgateio';
import fs from 'fs';

dotenv.config();

const personalAccessTokenId = process.env.SIPGATE_TOKEN_ID || '';
const personalAccessToken = process.env.SIPGATE_TOKEN || '';
/**
 * For details on how to instantiate the client, see 'examples/client/client.ts'
 */
const client = sipgateIO({
    tokenId: personalAccessTokenId,
    token: personalAccessToken,
});
const historyModule = createHistoryModule(client);
let areaCodeMap = parseAreaCodeCsv();
const areaCodeMatch = [];

historyModule
    .fetchAll(
        { types: ['SMS', 'FAX', 'CALL'], directions: ['INCOMING'] },
        { offset: 0, limit: 100 }
    )
    .then((historyElements) => {
        historyElements.forEach((entry) => {
            let number = entry.source;
            if (!isCountryNumber('+49', number)) {
                return;
            }
            number = number.substring(3);

            for (let i = 5; i > 1; i--) {
                const areaCode = number.substr(0, i);
                if (areaCodeMap[areaCode]) {
                    areaCodeMap[areaCode].occurences += 1;
                    break;
                }
            }
        });

        Object.keys(areaCodeMap).forEach((key) => {
            if (areaCodeMap[key].occurences > 0) {
                areaCodeMatch.push({ areacode: key, ...areaCodeMap[key] });
            }
        });
        areaCodeMatch.sort((firstCity, secondCity) => {
            return secondCity.occurences - firstCity.occurences;
        });

        let postalCodeMap = parsePostalCodeCsv('./data/postal-codes.csv');
        areaCodeMatch.forEach((element) => {
            console.log(postalCodeMap[element.city]);
        });

        let heatDataJson = createHeatData(areaCodeMap, postalCodeMap);
        fs.writeFile('./map/heat.json', heatDataJson, (err) => {
            if (err) return console.log(err);
            console.log('Created ./map/heat.json');
        });
    })
    .catch(console.error);

function parseAreaCodeCsv() {
    const areaCodeMap = {};
    const allAreaCodes = fs
        .readFileSync('./data/area_codes.csv')
        .toString()
        .split('\n');
    for (const line of allAreaCodes.slice(1, -1)) {
        let [areaCode, city] = line.split(';');
        areaCodeMap[areaCode] = { city: city, occurences: 0 };
    }
    return areaCodeMap;
}

function isCountryNumber(countryNumber, number) {
    return number.startsWith(countryNumber);
}

function parsePostalCodeCsv(filename) {
    const postalCodeMap = {};
    const allPostalCodes = fs
        .readFileSync('./' + filename)
        .toString()
        .split('\n');
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

function createHeatData(areaCodeMap, postalCodeMap, intensity = 1.6) {
    let heatData = [];
    Object.keys(areaCodeMap).forEach((key) => {
        if (areaCodeMap[key].occurences) {
            heatData.push([
                postalCodeMap[areaCodeMap[key].city].latitude,
                postalCodeMap[areaCodeMap[key].city].longitude,
                areaCodeMap[key].occurences * intensity,
            ]);
        }
    });
    return JSON.stringify(heatData);
}

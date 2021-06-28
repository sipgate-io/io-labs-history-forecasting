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
        console.log(areaCodeMatch);
        createForecastCsv(areaCodeMatch);
    })
    .catch(console.error);

function parseAreaCodeCsv() {
    const areaCodeMap = {};
    const allAreaCodes = fs
        .readFileSync('./area_codes.csv')
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

function createForecastCsv(areaCodeMatch) {
    const rows = [['areacode', 'city', 'occurences']];
    const csvString = [
        ['areacode', 'city', 'occurences'],
        ...areaCodeMatch.map((item) => [
            item.areacode,
            item.city,
            item.occurences,
        ]),
    ]
        .map((e) => e.join(','))
        .join('\n');

    fs.writeFile('forecast.csv', csvString, (err) => {
        if (err) return console.log(err);
        console.log('Created forecast.csv');
    });
}

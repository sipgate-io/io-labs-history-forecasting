import * as dotenv from 'dotenv';
import { createHistoryModule, FaxStatus, sipgateIO } from 'sipgateio';
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

historyModule
	.fetchAll(
		{ types: ['SMS', 'FAX', 'CALL'], directions: ['INCOMING'] }
	)
	.then((historyElements) => {
		// sicherstellen, dass alle nummer mit +49 anfangen


		// Ländervorwahlen entfernen


		// Vorwahl ermitteln


		// gefundene Vorwahlen in ein Objekt speichern und inkrementieren

	})
	.catch(console.error);


function parseCsv(){
	const areaCodeMap = {}
	const allAreaCodes = fs.readFileSync('./area_codes.csv').toString().split("\n");
	for (const line of allAreaCodes.slice(1,-1)) {
		let [areaCode, city] = line.split(";")
		areaCodeMap[areaCode] = city;
	}
	return areaCodeMap;
}

console.log(parseCsv());
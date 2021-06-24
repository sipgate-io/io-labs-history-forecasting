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
		historyElements.forEach((e) => {
			let number = e.source;
			if(!number.startsWith('+49')){
				return
			}
			let areaCodeLengthTwo, areaCodeLengthThree, areaCodeLengthFour;
			number = number.substring(3);

			//Die Vorwahlen zu isolieren hat sich als sehr schwer herausgestellt, da die übergebene Nummer keine Formatierung hat.
			//Da es Vorwahlen gibt, die sich stark ähneln kann es zu Überschneidungen kommen. Z.B.: 212 Solingen und 2129 Haan Rheinl.

			areaCodeLengthTwo = number.substring(2);
			areaCodeLengthThree = number.substring(3);
			areaCodeLengthFour = number.substring(4);
			areaCodeMap = parseCsv();
			if(areaCodeLengthTwo in  areaCodeMap){
				//areaCodeMap[areaCodeLengthTwo] 
			}

			
		})

		// Vorwahl ermitteln


		// gefundene Vorwahlen in ein Objekt speichern und inkrementieren
		//console.log(historyElements);
	})
	.catch(console.error);


function parseCsv(){
	const areaCodeMap = {}
	const allAreaCodes = fs.readFileSync('./area_codes.csv').toString().split("\n");
	for (const line of allAreaCodes.slice(1,-1)) {
		let [areaCode, city] = line.split(";")
		areaCodeMap[areaCode] = {city: city, occurences: 0};
	}
	return areaCodeMap;
}

console.log(parseCsv());
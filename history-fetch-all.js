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
let areaCodeMap = parseCsv();
const areaCodeMatch = [];

historyModule
	.fetchAll(
		{ types: ['SMS', 'FAX', 'CALL'], directions: ['INCOMING'] },
		{offset:0, limit:100}
	)
	.then((historyElements) => {

		historyElements.forEach((e) => {
			let number = e.source;
			if(!number.startsWith('+49')){
				return
			}
			let areaCodeLengthTwo, areaCodeLengthThree, areaCodeLengthFour;
			number = number.substring(3);

			areaCodeLengthTwo = number.substr(0,2);
			areaCodeLengthThree = number.substr(0,3);
			areaCodeLengthFour = number.substr(0,4);

			if(areaCodeMap[areaCodeLengthFour]){
				areaCodeMap[areaCodeLengthFour].occurences +=1;
			}else if(areaCodeMap[areaCodeLengthThree]) {
				areaCodeMap[areaCodeLengthThree].occurences += 1;
			}
			else if(areaCodeMap[areaCodeLengthTwo]){
				areaCodeMap[areaCodeLengthTwo].occurences +=1;
			}
		})

		Object.keys(areaCodeMap).forEach(function(key) {
			if(areaCodeMap[key].occurences > 0){
				areaCodeMatch.push({ areacode:key, ...areaCodeMap[key]})
			}
		});
		areaCodeMatch.sort(function(firstCity,secondCity){
			return secondCity.occurences - firstCity.occurences;
		})
		console.log(areaCodeMatch)
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
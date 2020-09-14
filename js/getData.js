const {google} = require('googleapis');
let privateKey = require("../build/privateKey.json");

function init() {
    return new Promise((resolve, reject) => {
        // configure a JWT auth client
        let jwtClient = new google.auth.JWT(
            privateKey.client_email,
            null,
            privateKey.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']);
//authenticate request
        jwtClient.authorize(function (err) {
            if (err) {
                reject(err)
            } else {
                resolve(jwtClient);
            }
        });

    });
}

function populateDataMap(auth) {
    return new Promise((resolve, reject) => {
        //Get proceeding data from sheet
        let returnData = {records: [], interval: 30};
        const sheets = google.sheets({version: 'v4', auth});
        sheets.spreadsheets.values.batchGet({
            spreadsheetId: '1gjzYXCQkmk1JhbS2NHkqUDxsxC5mpIL-XweZmTcKrxI',
            ranges: ['expedientes!A2:M99', 'data!F2'],
        }, (err, res) => {
            if (err) {
                reject('The API returned an error: ' + err);
            }
            const rows = res.data.valueRanges[0].values;
            if (rows.length > 0) {
                rows.forEach((row, i) => {
                
                        returnData.records.push(
                            {
                                'nombres': row[0],
                                'apellido1': row[1],
                                'apellido2': row[2],
                                'provincia': row[3],
                                'tipoTramite': row[4],
                                'tipoDocumento': row[5],
                                'numeroDocumento': row[6],
                                'nacionalidad': row[7],
                                'caducidadTarjeta': row[8],
                                'telefono': row[9],
                                'email': row[10],
                                'motivo': row[11],
                                'status': row[12].toLowerCase(),
                                'dataRow': i + 2
                            }
                        )
                });
                returnData.interval = parseInt(res.data.valueRanges[1].values[0]);
                resolve(returnData);
            } else {
                reject('No Data found');
            }
        });
    })
}


function updateCells(auth, ranges, newValues) {
    return new Promise((resolve, reject) => {
    const sheets = google.sheets({version: 'v4', auth});
let resourceData = [];

for(let rangeIndex =0; rangeIndex < ranges.length; rangeIndex++){
    resourceData.push(
        {
            range: 'expedientes!' + ranges[rangeIndex],
            values: [[newValues[rangeIndex]]]
        }
    );
}
    let resources = {
        auth: auth,
        spreadsheetId: '1gjzYXCQkmk1JhbS2NHkqUDxsxC5mpIL-XweZmTcKrxI',
        resource:{
            valueInputOption: 'RAW',
            data:resourceData
        }
    };
    sheets.spreadsheets.values.batchUpdate(resources, (err, res)=>{
        if (err) {
            // Handle error
            reject('cell update error:', err);
        } else {
            console.log('cells updated: ', res.data.totalUpdatedCells);
            resolve();
        }
    });
    })
}


module.exports = {init, populateDataMap, updateCells}

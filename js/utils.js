const axios = require('axios');
const antiCaptchaClientKey = '0024131b365903ca5f32c9b2b1baf9ed';


module.exports = {
    getTimeStampInLocaLIso: () => {
        return (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().slice(0, -1)
    },
    getProcessEnumOrName: (processId) => {
        const processes = {
            0: 'POLICIA - RECOGIDA DE TARJETA DE IDENTIDAD DE EXTRANJERO (TIE)',
            1: 'POLICIA- EXPEDICIÓN/RENOVACIÓN DE DOCUMENTOS DE SOLICITANTES DE ASILO',
            2: 'POLICIA- SOLICITUD ASILO',
            3: 'POLICIA-AUTORIZACIÓN DE REGRESO',
            4: 'POLICIA-CARTA DE INVITACIÓN',
            5: 'POLICIA-CERTIFICADO DE REGISTRO DE CIUDADANO DE LA U.E.',
            6: 'POLICIA-CERTIFICADOS (DE RESIDENCIA, DE NO RESIDENCIA Y DE CONCORDANCIA)',
            7: 'POLICIA-CERTIFICADOS UE',
            8: 'POLICIA-CERTIFICADOS Y ASIGNACION NIE',
            9: 'POLICIA-CERTIFICADOS Y ASIGNACION NIE (NO COMUNITARIOS)',
            10: 'POLICÍA-EXP.TARJETA ASOCIADA AL ACUERDO DE RETIRADA CIUDADANOS BRITÁNICOS Y SUS FAMILIARES (BREXIT)',
            11: 'POLICIA-TOMA DE HUELLAS (EXPEDICIÓN DE TARJETA) Y RENOVACIÓN DE TARJETA DE LARGA DURACIÓN',
            12: 'SOLICITUD DE AUTORIZACIONES',
            13: 'REGISTRO',
            14: 'ASILO-OFICINA DE ASILO Y REFUGIO."nueva normalidad" Expedición/Renovación Documentos.C/Pradillo 40',
            15: 'AUT. DE RESIDENCIA TEMPORAL POR CIRCUNS. EXCEPCIONALES POR ARRAIGO',
            16: 'AUTORIZACIÓN DE RESIDENCIA DE MENORES',
            17: 'AUTORIZACIÓN ESTANCIA INICIAL POR ESTUDIOS',
            18: 'AUTORIZACIONES DE TRABAJO',
            19: 'FAMILIARES DE RESIDENTES COMUNITARIOS',
            20: 'INFORMACIÓN',
            21: 'REAGRUPACIÓN FAMILIAR',
            22: 'Recuperación de la autorización de larga duración',
            23: 'POLICIA-OTROS TRÁMITES COMISARIA',
            24: 'AUTORIZACIÓN DE RESIDENCIA POR ARRAIGO',
            25: 'AUTORIZACIÓN PARA TRABAJAR',
            26: 'AUTORIZACIÓN DE RESIDENCIA Y TRABAJO INICIAL POR CUENTA PROPIA',
            27: 'RENOVACIONES TRABAJO',
            28: 'OTROS TRABAJO',
            29: 'COMUNITARIOS',
            30: 'RENOVACIONES RESIDENCIA',
            31: 'AUT. RESIDENCIA POR OTRAS CIRCUNSTANCIAS EXCEPCIONALES',
            32: 'AUTORIZACIÓN DE ESTANCIA POR ESTUDIOS',
            33: 'CÉDULA DE INSCRIPCIÓN Y TÍTULO DE VIAJE',
            34: 'OTROS RESIDENCIA'
        }
        if (typeof processId === 'number') {
            return processes[processId];
        } else {
            for (let processNumber in processes) {
                if (processes[processNumber] === processId) {
                    return processNumber;
                }
            }
        }
    },
    fetchCaptcha: (userAgent, captchaResolve, captchaReject) => {

                axios.post('http://api.anti-captcha.com/createTask', {
                    'clientKey': antiCaptchaClientKey,
                    'task':
                        {
                            'type': 'NoCaptchaTaskProxyless',
                            'websiteURL': 'https://sede.administracionespublicas.gob.es/icpplustieb/acValidarEntrada',
                            'websiteKey': '6Ld3FzoUAAAAANGzDQ-ZfwyAArWaG2Ae15CGxkKt',
                            'userAgent': userAgent
                        }
                })
                    .then((response) => {

                        let taskId = response.data.taskId
                        let errorId = response.data.errorId;
                        if (taskId) {
                            new Promise((pollResolve, pollReject) => {
                                pollTask(taskId, 0, pollResolve, pollReject)
                            }).then((solvedCaptcha) => {

                                captchaResolve({code: solvedCaptcha, taskId: taskId});

                            }).catch((err) => {

                               captchaReject(err);

                            });
                        } else if (errorId) {
                            captchaReject(response.data);
                        }
                    })
                    .catch(error => {
                       captchaReject(error);
                    });


    },
    reportIncorrectRecaptcha(taskId){
        axios.post('https://api.anti-captcha.com/reportIncorrectRecaptcha', {
            'clientKey': antiCaptchaClientKey,
            "taskId": taskId
        })
            .then((response) => {
                logger.info('ReCaptcha failure reported with result: ' + JSON.stringify(response.data));
            });

    }
}

function pollTask(taskId, attempt, resolve, reject, pageId) {
    axios.post('https://api.anti-captcha.com/getTaskResult',
        {
            'clientKey': antiCaptchaClientKey,
            'taskId': taskId
        }).then(async (taskResponse) => {
        let gRecaptchaStatus = taskResponse.data.status

        if (gRecaptchaStatus === 'ready') {
            console.log('reCaptcha solution ready.')
            resolve(taskResponse.data.solution.gRecaptchaResponse);
        } else if (attempt > 30) {
            reject('Too many polling tries.');
        } else {
            console.log(attempt + ' attempts to poll');
            attempt++;
            setTimeout(() => {
                pollTask(taskId, attempt, resolve, reject, pageId);
            }, 1000)
        }
    })

}
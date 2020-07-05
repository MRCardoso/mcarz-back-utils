const prepare = (error, customKeys = null, next) => {
    let reason = {}
    switch (typeof error) {
        case "object":
            if (error.sqlMessage && error.sql) {
                reason = { status: 500, err: "Código #0001 não foi possível persistir dados" }
            } else if (error.message && error.stack) {
                reason = { status: 500, err: "Código #0002 não foi possível processar sua ação" }
            } else if (error.Validator) {
                reason = { status: 400, err: { validations: error.Validator } }
            } else if (error.Unauthorized) {
                reason = { status: 401, err: error.Unauthorized }
            } else if (error.Forbbiden) {
                reason = { status: 403, err: error.Forbbiden }
            } else if (error.Notfound) {
                reason = { status: 404, err: error.Notfound }
            } else if (customKeys && error[customKeys]) {
                reason = error[customKeys]
            } else {
                reason = { status: 500, err: "Código #0004 erro desconhecido" }
            }
            break
        case "string":
            reason = { status: 400, err: error }
            break
        default:
            reason = { status: 500, err: "Código #0005 desconhecido" }
            break
    }

    if (reason.status != 400) {
        // if (reason.status == 500 && typeof next === 'function'){
        //     next(error)
        // }
        console.log('\x1b[31m', error, '\x1b[0m')
    }
    return reason
}

const responser = (response, error, prettyErr = null) => {
    let { status, err } = prepare(error)
    if (typeof err === "string") {
        err = { message: err, prettyErr }
    }
    return response.status(status).send(err)
}

const addLog = (message, folder) => {
    let fs = require('fs')
    let date = new Date()
    let pathLog = folder
    let fileName = `${require('moment')().format('YYYY-MM-DD')}.log`;
    message = `================START - ${date}\n${JSON.stringify(message)}\n================END - ${date}\n`;

    if (!fs.existsSync(pathLog)) {
        fs.mkdirSync(pathLog);
    }
    fs.writeFile(`${pathLog}/${fileName}`, message, { 'flag': 'a' }, (err, d) => {
        console.log(err ? { "LOG-ERR:": err } : { "LOG-SUCCESS:": d })
    });
}

module.exports = { prepare, responser, addLog }
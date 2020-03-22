let prepare = (error, customKeys = null) => {
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
        console.log('\x1b[31m', error, '\x1b[0m')
    }
    return reason
}

let respse = (response, error, prettyErr = null) => {
    let { status, err } = prepare(error)
    if (typeof err === "string") {
        err = { message: err, prettyErr }
    }
    return response.status(status).send(err)
}

module.exports = { prepare, respse }
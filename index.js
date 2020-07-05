const Error = require('./lib/handlers/Error')
const Mail = require('./lib/handlers/Mail')

const Modelus = require('./lib/modules/Model')
const Validatorus = require('./lib/modules/Validator')

modules.exports = {
    prepareError: Error.prepare,
    prepareResponse: Error.responser,
    sendMail: Mail.send,
    Modelus,
    Validatorus
}
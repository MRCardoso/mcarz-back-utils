const Error = require('./lib/handlers/Error')
const Mail = require('./lib/handlers/Mail')
const Services = require('./lib/handlers/Services')
const server = require('./lib/handlers/Server')

const Modelus = require('./lib/entities/Model')
const Validatorus = require('./lib/entities/Validator')

module.exports = {
    prepareError: Error.prepare,
    prepareResponse: Error.responser,
    sendMail: Mail.send,
    createFilenameHash: Services.createFilenameHash,
    server,
    Modelus,
    Validatorus
}
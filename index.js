let serrors = require('./lib/serrors')
let smail = require('./lib/smail')

modules.exports = {
    prepareError: serrors.prepare,
    prepareResponse: serrors.respse,
    sendMail: smail.sendMail,
}
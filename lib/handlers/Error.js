"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLog = exports.responser = exports.prepare = void 0;
var fs_1 = require("fs");
var prepare = function (error, customKeys) {
    if (customKeys === void 0) { customKeys = null; }
    var reason = { status: 500, err: null };
    switch (typeof error) {
        case "object":
            if (error.sqlMessage && error.sql) {
                reason = { status: 500, err: "Código #0001 não foi possível persistir dados" };
            }
            else if (error.message && error.stack) {
                reason = { status: 500, err: "Código #0002 não foi possível processar sua ação" };
            }
            else if (error.Validator) {
                reason = { status: 400, err: { validations: error.Validator } };
            }
            else if (error.Unauthorized) {
                reason = { status: 401, err: error.Unauthorized };
            }
            else if (error.Forbbiden) {
                reason = { status: 403, err: error.Forbbiden };
            }
            else if (error.Notfound) {
                reason = { status: 404, err: error.Notfound };
            }
            else if (customKeys && error[customKeys]) {
                reason = error[customKeys];
            }
            else {
                reason = { status: 500, err: "Código #0004 erro desconhecido" };
            }
            break;
        case "string":
            reason = { status: 400, err: error };
            break;
        default:
            reason = { status: 500, err: "Código #0005 desconhecido" };
            break;
    }
    if (reason.status != 400) {
        console.log('\x1b[31m', error, '\x1b[0m');
    }
    return reason;
};
exports.prepare = prepare;
var responser = function (response, error, prettyErr) {
    if (prettyErr === void 0) { prettyErr = null; }
    var _a = prepare(error), status = _a.status, err = _a.err;
    if (typeof err === "string") {
        err = { message: err, prettyErr: prettyErr };
    }
    return response.status(status).send(err);
};
exports.responser = responser;
var addLog = function (message, folder) {
    var date = new Date();
    var pathLog = folder;
    var fileName = require('moment')().format('YYYY-MM-DD') + ".log";
    message = "================START - " + date + "\n" + JSON.stringify(message) + "\n================END - " + date + "\n";
    if (!fs_1.existsSync(pathLog)) {
        fs_1.mkdirSync(pathLog);
    }
    fs_1.writeFile(pathLog + "/" + fileName, message, { 'flag': 'a' }, function (err) {
        console.log(err ? { "LOG-ERR:": err } : { "LOG-SUCCESS:": "sucesso" });
    });
};
exports.addLog = addLog;

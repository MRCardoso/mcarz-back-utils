"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.is404 = exports.is403 = exports.is401 = exports.is400 = exports.createFilenameHash = void 0;
exports.createFilenameHash = function (name) {
    var hasName = require('crypto').createHash('md5').update(Date.now() + "-" + name).digest('hex');
    var ext = name.split('.').pop();
    return hasName + "." + ext;
};
exports.is400 = function (message) { return ({ Validator: message }); };
exports.is401 = function (message) { return ({ Unauthorized: message }); };
exports.is403 = function (message) { return ({ Forbbiden: message }); };
exports.is404 = function (message) { return ({ Notfound: message }); };

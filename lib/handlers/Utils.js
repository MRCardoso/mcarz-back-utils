"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expiredToken = exports.createToken = exports.cleanToken = exports.sendMail = exports.server = exports.createFilenameHash = exports.is404 = exports.is403 = exports.is401 = exports.is400 = void 0;
var jwt_simple_1 = require("jwt-simple");
/**
 * ----------------------------------------------------------
 * Default object to response to API node with error Http 4xx
 * ----------------------------------------------------------
 */
exports.is400 = function (message) { return ({ Validator: message }); };
exports.is401 = function (message) { return ({ Unauthorized: message }); };
exports.is403 = function (message) { return ({ Forbbiden: message }); };
exports.is404 = function (message) { return ({ Notfound: message }); };
/**
 * ----------------------------------------------------
 * Create the hash string with name of the file
 * ----------------------------------------------------
 */
exports.createFilenameHash = function (name) {
    var hasName = require('crypto').createHash('md5').update(Date.now() + "-" + name).digest('hex');
    var ext = name.split('.').pop();
    return hasName + "." + ext;
};
/**
 * ----------------------------------------------------
 * Start a server with node+express
 * ----------------------------------------------------
 */
exports.server = function (DB, port) {
    if (port === void 0) { port = 3000; }
    var entities = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        entities[_i - 2] = arguments[_i];
    }
    var app = require('express')();
    var consign = require('consign')();
    app.db = require('knex')(DB);
    entities.forEach(function (entity) { return consign.then(entity); });
    consign.into(app);
    app.listen(port, function () { return console.log("API executando em http://localhost:" + port); });
    return app;
};
/**
 * ----------------------------------------------------
 * Send mail with nodemailer
 * ----------------------------------------------------
 */
exports.sendMail = function (data, credentials, configs) {
    function replaceCharacters(html, content, title) {
        while (content.indexOf("{") != -1 || content.indexOf("}") != -1) {
            content = content.replace(/\{/ig, '<').replace(/\}/ig, '>');
        }
        var AWS = configs.AWS, logoHeader = configs.logoHeader, logoFooter = configs.logoFooter, endpoint = configs.endpoint;
        return html
            .replace(/\{title\}/ig, title)
            .replace(/\{appURL\}/ig, endpoint)
            .replace(/\{logo1\}/ig, (logoHeader ? "<img src=\"" + AWS.URL + AWS.Bucket + "/" + logoHeader + "\" width=\"40\">" : ''))
            .replace(/\{logo2\}/ig, (logoFooter ? "<img src=\"" + AWS.URL + AWS.Bucket + "/" + logoFooter + "\" width=\"80\">" : ''))
            .replace(/\{content\}/ig, content);
    }
    return new Promise(function (resolve, reject) {
        if (!data) {
            return reject("Não há conteúdo para envio do email");
        }
        if (!credentials.serviceMail || !credentials.loginMail || !credentials.passMail) {
            return reject("Por favor configure o servidor de email, login e senha!");
        }
        var path = credentials.rPath || 'mail';
        var view = credentials.view || 'index';
        var ext = credentials.ext || 'html';
        var filenamePath = "./" + path + "/" + view + "." + ext;
        console.log("send-file: " + filenamePath);
        require('fs').readFile(filenamePath, 'utf8', function (err, template) {
            if (err) {
                return reject(err);
            }
            console.log('sending-mail');
            var nodemailer = require('nodemailer');
            var sgTransport = require('nodemailer-sendgrid-transport');
            var transporte = nodemailer.createTransport(sgTransport({
                auth: {
                    api_key: credentials.apiKey
                    // api_user: 'SENDGRID_USERNAME',
                    // api_key: 'SENDGRID_PASSWORD'
                }
            }));
            var email = {
                from: [" <", credentials.loginMail, ">"].join(''),
                to: data.mail,
                subject: data.subject,
                headers: { 'content-type': 'text/html' },
                html: replaceCharacters(template, data.content, data.title),
                attachments: []
            };
            if ('annex' in data && 'name' in data.annex && 'path' in data.annex) {
                email.attachments = [{ filename: data.annex.name, path: data.annex.path }];
            }
            else {
                delete email.attachments;
            }
            transporte.send(email, function (err, info) { return (err ? reject(err) : resolve(info)); });
        });
    });
};
/**
 * ----------------------------------------------------
 * Clean payload in the JWT token
 * ----------------------------------------------------
 * @param {object} params
 * @param {string} params.authSecret the secret string to encrypt the payload
 */
exports.cleanToken = function (_a) {
    var authSecret = _a.authSecret;
    return jwt_simple_1.encode(null, authSecret);
};
/**
 * ----------------------------------------------------
 * Generate standard payload to create JWT token
 * ----------------------------------------------------
 * @param {object} params
 * @param {string} params.authSecret the secret string to encrypt the payload
 * @param {number} params.authToken the expires timestamp milliseconds to token
 * @param {object} customs the additional data to attach in payload
 * @returns {object}
 */
exports.createToken = function (_a, customs) {
    var _b = _a === void 0 ? {} : _a, _c = _b.authSecret, authSecret = _c === void 0 ? 'secret-key' : _c, _d = _b.authToken, authToken = _d === void 0 ? (60 * 60) : _d;
    if (customs === void 0) { customs = {}; }
    var now = Math.floor(Date.now() / 1000);
    var expires = (now + authToken);
    var payload = __assign(__assign({}, customs), { iat: now, exp: expires });
    var token = jwt_simple_1.encode(payload, authSecret);
    return { token: token, expires: expires, payload: payload };
};
/**
 * ----------------------------------------------------
 * Verify the expiration of the token JWT
 * ----------------------------------------------------
 * @param {string} token the generated token in signin
 * @param {string} authSecret the secret string to encrypt the payload
 * @throws {Error} exception to notify the api that token expires
 */
exports.expiredToken = function (token, authSecret) {
    var payload = jwt_simple_1.decode(token, authSecret);
    var now = new Date();
    var expires = new Date(payload.exp * 1000);
    console.log("Current Date: " + now + " - Expires Date: " + expires);
    if (expires < now) {
        throw new Error("Token expired");
    }
};

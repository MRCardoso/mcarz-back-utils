"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = exports.server = exports.createFilenameHash = exports.is404 = exports.is403 = exports.is401 = exports.is400 = void 0;
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

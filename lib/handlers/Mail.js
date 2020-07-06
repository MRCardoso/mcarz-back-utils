"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function (data, credentials, configs) {
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
});

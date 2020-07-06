export default (data: any, credentials: any, configs: any) => {
    function replaceCharacters(html, content, title) {
        while (content.indexOf("{") != -1 || content.indexOf("}") != -1) {
            content = content.replace(/\{/ig, '<').replace(/\}/ig, '>');
        }
        const { AWS, logoHeader, logoFooter, endpoint } = configs
        
        return html
            .replace(/\{title\}/ig, title)
            .replace(/\{appURL\}/ig, endpoint)
            .replace(/\{logo1\}/ig, (logoHeader ? `<img src="${AWS.URL}${AWS.Bucket}/${logoHeader}" width="40">` : ''))
            .replace(/\{logo2\}/ig, (logoFooter ? `<img src="${AWS.URL}${AWS.Bucket}/${logoFooter}" width="80">` : ''))
            .replace(/\{content\}/ig, content);
    }
    return new Promise((resolve, reject) => {
        if (!data) {
            return reject("Não há conteúdo para envio do email")
        }

        if (!credentials.serviceMail || !credentials.loginMail || !credentials.passMail) {
            return reject("Por favor configure o servidor de email, login e senha!")
        }

        let path = credentials.rPath || 'mail';
        let view = credentials.view || 'index';
        let ext = credentials.ext || 'html';
        let filenamePath = `./${path}/${view}.${ext}`;

        console.log(`send-file: ${filenamePath}`);
        require('fs').readFile(filenamePath, 'utf8', (err, template) => {
            if (err) {
                return reject(err);
            }

            console.log('sending-mail');

            let nodemailer = require('nodemailer')
            let sgTransport = require('nodemailer-sendgrid-transport');
            let transporte = nodemailer.createTransport(
                sgTransport({
                    auth: {
                        api_key: credentials.apiKey
                        // api_user: 'SENDGRID_USERNAME',
                        // api_key: 'SENDGRID_PASSWORD'
                    }
                })
            )
            let email = {
                from: [" <", credentials.loginMail, ">"].join(''),
                to: data.mail,
                subject: data.subject,
                headers: { 'content-type': 'text/html' },
                html: replaceCharacters(template, data.content, data.title),
                attachments: []
            }

            if ('annex' in data && 'name' in data.annex && 'path' in data.annex) {
                email.attachments = [{ filename: data.annex.name, path: data.annex.path }];
            } else{
                delete email.attachments
            }
            transporte.send(email, (err, info) => (err ? reject(err) : resolve(info)));
        });
    })
}
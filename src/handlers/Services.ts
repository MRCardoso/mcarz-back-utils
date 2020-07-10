import { encode as encodeJWT, decode as decodeJWT} from 'jwt-simple'
/**
 * ----------------------------------------------------------
 * Default object to response to API node with error Http 4xx
 * ----------------------------------------------------------
 */
export const is400 = (message: any) => ({ Validator: message })
export const is401 = (message: any) => ({ Unauthorized: message })
export const is403 = (message: any) => ({ Forbbiden: message })
export const is404 = (message: any) => ({ Notfound: message })

/**
 * ----------------------------------------------------
 * Create the hash string with name of the file
 * ----------------------------------------------------
 */
export const createFilenameHash = (name:string) => {
    const hasName = require('crypto').createHash('md5').update(`${Date.now()}-${name}`).digest('hex')
    const ext = name.split('.').pop()
    return `${hasName}.${ext}`
}

/**
 * ----------------------------------------------------
 * Start a server with node+express
 * ----------------------------------------------------
 */
export const server = (DB: any, port: number = 3000, ...entities: any) => {
    const app = require('express')()
    const consign = require('consign')()

    app.db = require('knex')(DB)
    entities.forEach(entity => consign.then(entity))
    consign.into(app)

    app.listen(port, () => console.log(`API executando em http://localhost:${port}`))

    return app
}

/**
 * ----------------------------------------------------
 * Send mail with nodemailer
 * ----------------------------------------------------
 */
export const sendMail = (data: any, credentials: any, configs: any) => {
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
            } else {
                delete email.attachments
            }
            transporte.send(email, (err, info) => (err ? reject(err) : resolve(info)));
        });
    })
}

/**
 * ----------------------------------------------------
 * Clean payload in the JWT token
 * ----------------------------------------------------
 * @param {object} params
 * @param {string} params.authSecret the secret string to encrypt the payload
 */
export const cleanToken = ({ authSecret }: any) => encodeJWT(null, authSecret)

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
export const createToken = ({ authSecret = 'secret-key', authToken = (60*60) }: any = {}, customs: object = {}): object => {
    const now = Math.floor(Date.now() / 1000)
    const expires = (now + authToken)  
    const payload = { ...customs, iat: now, exp: expires }
    const token = encodeJWT(payload, authSecret)

    return { token, expires, payload }
}

/**
 * ----------------------------------------------------
 * Verify the expiration of the token JWT
 * ----------------------------------------------------
 * @param {string} token the generated token in signin
 * @param {string} authSecret the secret string to encrypt the payload
 * @throws {Error} exception to notify the api that token expires
 */
export const expiredToken = (token: string, authSecret: string) => {
    const payload: any = decodeJWT(token, authSecret)
    const now = new Date()
    const expires = new Date(payload.exp * 1000)

    console.log(`Current Date: ${now} - Expires Date: ${expires}`)

    if (expires < now) {
        throw new Error("Token expired")
    }
}
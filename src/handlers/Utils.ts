import { encode as encodeJWT, decode as decodeJWT} from 'jwt-simple'
import Validator from '../entities/Validator'
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
 * @param {object} data email data
 * @param {string} data.mail the email to be send
 * @param {string} data.subject the subject of the mail
 * @param {object} data.content the html content of the mail
 * @param {array} data.annex the file to attach as attachments in the mail
 * @param configs 
 */
export const sendMail = (data: any, mailFrom: string = 'noreplay', apiKey: any) => {
    return new Promise((resolve, reject) => {
        const validator = new Validator({
            mail: 'required', 
            subject: 'required', 
            content: 'required'
        })

        if (!validator.validate(data)){
            return reject(is400(validator.getErrors()))
        }
        
        if (!apiKey) {
            return reject("Por favor configure a API do servidor de email!")
        }

        const nodemailer = require('nodemailer')
        const sgTransport = require('nodemailer-sendgrid-transport');
        const transporter = sgTransport({ auth: { api_key: apiKey } })
        const transporte = nodemailer.createTransport(transporter)
        
        let email:any = {
            from: ` <${mailFrom}>`,
            to: data.mail,
            subject: data.subject,
            headers: { 'content-type': 'text/html' },
            html: data.content
        }

        if ('annex' in data && 'name' in data.annex && 'path' in data.annex) {
            email.attachments = [{ filename: data.annex.name, path: data.annex.path }];
        }
        transporte.sendMail(email).then(resolve, reject)
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
export const createFilenameHash = (name:string) => {
    const hasName = require('crypto').createHash('md5').update(`${Date.now()}-${name}`).digest('hex')
    const ext = name.split('.').pop()
    return `${hasName}.${ext}`
}

export const is400 = (message: any) => ({ Validator: message })
export const is401 = (message: any) => ({ Unauthorized: message })
export const is403 = (message: any) => ({ Forbbiden: message })
export const is404 = (message: any) => ({ Notfound: message })

const createFilenameHash = name => {
    let hasName = require('crypto').createHash('md5').update(`${Date.now()}-${name}`).digest('hex')
    let ext = name.split('.').pop()
    return `${hasName}.${ext}`
}

module.exports = { createFilenameHash }
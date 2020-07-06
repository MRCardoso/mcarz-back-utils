/**
 * ----------------------------------------------------
 * Start a server with node+express
 * ----------------------------------------------------
 */
export default(DB:any, port:number, ...entities:any) => {
    const app = require('express')()
    const consign = require('consign')()
    
    app.db = require('knex')(DB)
    entities.forEach(entity => consign.then(entity))
    consign.into(app)
    
    app.listen(port, () => console.log(`API executando em http://localhost:${port}`))

    return app
}
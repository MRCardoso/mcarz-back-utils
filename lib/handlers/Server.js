"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ----------------------------------------------------
 * Start a server with node+express
 * ----------------------------------------------------
 */
exports.default = (function (DB, port) {
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
});

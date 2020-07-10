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
var Validator_1 = require("./Validator");
var Services_1 = require("../handlers/Services");
/**
 * ----------------------------------------------------------------------------
 * Standard class to common method to create data in the api table
 * with foreign key in user's table
 * ----------------------------------------------------------------------------
 * @author Marlon R. Cardoso
 */
var Api = /** @class */ (function () {
    function Api(model, idField, userField, tokenField, expiresField, createFiled) {
        if (idField === void 0) { idField = 'id'; }
        if (userField === void 0) { userField = "userId"; }
        if (tokenField === void 0) { tokenField = "token"; }
        if (expiresField === void 0) { expiresField = "expires"; }
        if (createFiled === void 0) { createFiled = "created_at"; }
        this._idField = idField;
        this._userField = userField;
        this._tokenField = tokenField;
        this._expiresField = expiresField;
        this._createFiled = createFiled;
        this._model = model;
    }
    /**
     * -----------------------------------------------------------------------------
     * Validation for token required in the queries to find or delete data by token
     * -----------------------------------------------------------------------------
     * @param {object} data the object with the token to be validate as required
     * @returns {boolean}
    */
    Api.prototype.validateToken = function (data) {
        this._validator = new Validator_1.default({ "token": "required" });
        return this._validator.validate(data);
    };
    /**
     * -----------------------------------------------------------------------------
     * Validation for fields base of the table for api before create newly records
     * -----------------------------------------------------------------------------
     * @param {object} data the fields for create
     * @param {object} rules the custom rules
     * @returns {boolean}
     */
    Api.prototype.validateFields = function (data, rules) {
        var _a;
        this._validator = new Validator_1.default(__assign((_a = {}, _a[this._userField] = "required|number", _a[this._tokenField] = "required", _a[this._expiresField] = "required|number", _a), rules));
        return this._validator.validate(data);
    };
    /**
     * Create a newly record in the api table from the instance in property '_model'
     * @param {object} logged the values of the logged user to create link for api table
     * @param {object} post the field data to insert in the _model instance
     * @param {object} rules the custom rules
     * @param {*} middleware the custom function to create payload with JWT
     * @returns {Promise}
     */
    Api.prototype.add = function (logged, post, rules, middleware) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.validateFields(post, rules)) {
                return reject(Services_1.is400(_this._validator.getErrors()));
            }
            var _a = middleware(), token = _a.token, expires = _a.expires, payload = _a.payload;
            if (_this._tokenField.trim() !== "") {
                post[_this._tokenField] = token;
            }
            if (_this._expiresField.trim() !== "") {
                post[_this._expiresField] = expires;
            }
            if (_this._createFiled.trim() !== "") {
                post[_this._createFiled] = new Date();
            }
            post[_this._userField] = logged.id;
            _this._model
                .save(post)
                .then(function (id) { return resolve(__assign({ authToken: __assign(__assign({}, payload), { token: token, apiId: id }) }, logged)); })
                .catch(function (err) { return reject(err); });
        });
    };
    /**
     * Remove specific record in the api table from the instance in property '_model'
     * @param {number} id the primary key of the api table
     * @param {number} userId the foreign key of the user table
     * @param {*} middleware the callback to proccess the logout in the JWT token
     * @returns {Promise}
     */
    Api.prototype.remove = function (id, userId, middleware) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a;
            middleware();
            _this._model.delete((_a = {}, _a[_this._idField] = id, _a[_this._userField] = userId, _a))
                .then(function (deleted) { return resolve(deleted); })
                .catch(function (error) { return reject(error); });
        });
    };
    /**
     * Delete by token a record in the api table from the instance in property '_model'
     * * @param {string} token the token create with JWT in login
     * @returns {Promise}
     */
    Api.prototype.removeByToken = function (token) {
        var _a;
        var params = (_a = {}, _a[this._tokenField] = token, _a);
        if (!this.validateToken(params)) {
            return Promise.reject(Services_1.is400(this._validator.getErrors()));
        }
        return this._model.delete(params);
    };
    /**
     * Load by token a record in the api table from the instance in property '_model'
     * @param {string} token the token create with JWT in login
     * @returns {Promise}
     */
    Api.prototype.getByToken = function (token) {
        var _a;
        var params = (_a = {}, _a[this._tokenField] = token, _a);
        if (!this.validateToken(params)) {
            return Promise.reject(Services_1.is400(this._validator.getErrors()));
        }
        return this._model.findByToken(params);
    };
    return Api;
}());
exports.default = Api;

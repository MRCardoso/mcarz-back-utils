"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("../handlers/Utils");
var Model_1 = require("./Model");
var Validator_1 = require("./Validator");
var bcrypt_nodejs_1 = require("bcrypt-nodejs");
var crypto_1 = require("crypto");
/**
 * @author Marlon R. Cardoso
 * @property {number} id the primary key of the table
 * @property {string} name the name of the user
 * @property {string} username the username of the user
 * @property {string} email the email of the user
 * @property {string} password the password of the user
 * @property {bool} status the status of the user
 * @property {bool} admin the user is administrator in the app
 * @property {string} resetToken the token of recovery password
 * @property {number} resetExpires the expires timestamp of the token
 * @property {Date} deleted_at the date of the inactivate the user
 * @property {Date} created_at the date of creation of user
 * @property {Date} updated_at the date of last update of data the user
 * -----------------------------------------------------------------------------------------------------
 * Standard User model class to make common method to load and login
 * -----------------------------------------------------------------------------------------------------
 */
var UserEntity = /** @class */ (function (_super) {
    __extends(UserEntity, _super);
    function UserEntity(app) {
        var _this = this;
        var fillables = ["id", "name", "username", "email", "status", "admin"];
        var hiddens = ["password"];
        var rules = {
            "name": "required|max:80",
            "username": "required|min:5|max:80|vusername",
            "email": "required|mail|max:120",
            "password": "required:create|min:8|max:80",
            "confirmation": "required:create|min:8|max:80|compare:password",
            "status": "number"
        };
        _this = _super.call(this, app, "users", rules, fillables, hiddens) || this;
        return _this;
    }
    Object.defineProperty(UserEntity.prototype, "tokenField", {
        get: function () {
            return "resetToken";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserEntity.prototype, "expiresField", {
        get: function () {
            return "resetExpires";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UserEntity.prototype, "fieldToReset", {
        get: function () {
            return [this.primaryKey, 'status', 'name', this.tokenField, this.expiresField].filter(function (f) { return f; });
        },
        enumerable: false,
        configurable: true
    });
    UserEntity.active = function () {
        return 1;
    };
    UserEntity.inactive = function () {
        return 0;
    };
    UserEntity.hashPassword = function (password, salt) {
        if (salt === void 0) { salt = 10; }
        return bcrypt_nodejs_1.hashSync(password, bcrypt_nodejs_1.genSaltSync(salt));
    };
    UserEntity.prototype.beforeSave = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.id && !_this.password) {
                delete _this.attributes["password"];
            }
            else if (_this.password) {
                _this.password = UserEntity.hashPassword(_this.password);
                _this.attributes["password"] = _this.password;
            }
            if (_this.status == null || _this.status == undefined) {
                delete _this.attributes["status"];
            }
            else {
                _this.status = (_this.status == "1" || _this.status == "true") ? true : false;
                _this.attributes["status"] = _this.status;
            }
            _this.uniqueUser()
                .then(function (_) { return reject(_this.validator.processMessages("unique", { field: "username/email" })); })
                .catch(function (err) { return (_this.isQueryErr(err) ? reject(err) : resolve()); });
        });
    };
    /**
    * ----------------------------------------------------------------------------
    * Method to validate of the user exists with the email or username wished
    * ----------------------------------------------------------------------------
    * @returns {Promise}
    */
    UserEntity.prototype.uniqueUser = function () {
        var id = this.id;
        var email = this.email;
        var username = this.username;
        return this.one(function () {
            this.whereRaw('(email = ? OR username = ?)', [email, username]);
            if (id) {
                this.andWhere('id', '<>', id);
            }
        });
    };
    /**
     * ----------------------------------------------------------------------------
     * Find user by your credentials standard to make login in the api
     * ----------------------------------------------------------------------------
     * @param {object} post the post data
     * @param {string} post.username the username in database
     * @param {string} post.password the password in database(pure string)
     * @param {string[]} relations the list of relations to use in the find query
     * @returns {Promise}
     */
    UserEntity.prototype.login = function (post, relations) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.validator = new Validator_1.default({
                "username": _this.rules.username,
                "password": _this.rules.password,
            });
            if (!_this.validator.validate(post)) {
                return reject(Utils_1.is400(_this.validator.getErrors()));
            }
            _this.one({ username: post.username }, __spreadArrays(relations), true).then(function (logged) {
                if (!logged.status) {
                    return reject(Utils_1.is401(_this.validator.processMessages("inativatedUser")));
                }
                if (!bcrypt_nodejs_1.compareSync(post.password, logged.password)) {
                    return reject(Utils_1.is400({ password: [_this.validator.processMessages("invalidPassword")] }));
                }
                resolve(logged);
            }).catch(function (err) { return reject(err); });
        });
    };
    /**
    * ----------------------------------------------------------------------------
    * Method to use select one default of the App, filter by email of user
    * validate of the email was informed
    * ----------------------------------------------------------------------------
    * @param {string} email the email to be find the user
    * @param {bool} active validation to find user only active status
    * @returns {Promise}
    */
    UserEntity.prototype.findByEmail = function (email, active) {
        if (active === void 0) { active = true; }
        var post = { email: email };
        this.validator = new Validator_1.default({ "email": this.rules.email });
        if (!this.validator.validate(post)) {
            return Promise.reject(Utils_1.is400(this.validator.getErrors()));
        }
        if (active) {
            post.status = UserEntity.active();
        }
        return this.one(post);
    };
    /**
    * ----------------------------------------------------------------------------
    * Method to find user by token to recovery password,
    * and validate token and expires are valid
    * ----------------------------------------------------------------------------
    * @param {string} resetToken the token to find the user to update the password
    * @param {boolean} validateExpires filter with resetExpires
    * @returns {Promise}
    */
    UserEntity.prototype.findByResetToken = function (resetToken, validateExpires) {
        var _a, _b;
        var _this = this;
        if (validateExpires === void 0) { validateExpires = true; }
        var tokenField = this.tokenField;
        var expiresField = this.expiresField;
        var params = (_a = {}, _a[tokenField] = resetToken, _a);
        this.validator = new Validator_1.default((_b = {}, _b[tokenField] = "required", _b));
        if (!this.validator.validate(params)) {
            return Promise.reject(Utils_1.is400(this.validator.getErrors()));
        }
        return new Promise(function (resolve, reject) {
            _this.one(function () {
                this.where(params);
                if (validateExpires) {
                    this.andWhere(expiresField, '>', Date.now());
                }
            }, [], _this.fieldToReset)
                .then(function (res) { return (res.status ? resolve(res) : reject(Utils_1.is401(_this.validator.processMessages("inativatedUser")))); })
                .catch(function (err) { return reject(err); });
        });
    };
    /**
     * ----------------------------------------------------------------------------
     * Update the reset password token and expires date of the load user
     * ----------------------------------------------------------------------------
     * @param {number} id the id of the user to send token
     * @param {number} exp the expires date timestamp in milliseconds
     * @returns {Promise}
     */
    UserEntity.prototype.updateResetToken = function (id, exp) {
        var _this = this;
        if (exp === void 0) { exp = (60 * 60 * 1000); }
        var password = UserEntity.hashPassword(Date.now() * 1000);
        var token = crypto_1.randomBytes(32).toString('hex');
        var expires = Date.now() + exp;
        return new Promise(function (resolve, reject) {
            var _a;
            _this.id = id;
            _this.update((_a = { password: password }, _a[_this.tokenField] = token, _a[_this.expiresField] = expires, _a))
                .then(function (_) { return resolve({ token: token, expires: expires }); })
                .catch(function (err) { return reject(err); });
        });
    };
    /**
     * ----------------------------------------------------------------------------
     * Update the password of the user by token with recovery password
     * ----------------------------------------------------------------------------
     * @param {object} post the data with password and confirmation
     * @param {string} post.password the password to be update
     * @param {string} post.confirmation the confirmation of the password
     * @param {number} id the id of the user to send token
     * @returns {Promise}
     */
    UserEntity.prototype.updatePassword = function (post, id) {
        this.id = id;
        this.validator = new Validator_1.default({
            "password": this.rules.password,
            "confirmation": this.rules.confirmation,
        });
        if (!this.validator.validate(post)) {
            return Promise.reject(Utils_1.is400(this.validator.getErrors()));
        }
        return this.update({ password: UserEntity.hashPassword(post.password), resetToken: null, resetExpires: null });
    };
    return UserEntity;
}(Model_1.default));
exports.default = UserEntity;

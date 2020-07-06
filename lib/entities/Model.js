"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Validator_1 = require("./Validator");
var Services_1 = require("../handlers/Services");
var timestamps = ["created_at", "updated_at"];
/**
 * @property {object} app the app created in the express
 * @property {string} table the table name in the database of the instance of model
 * @property {object} fillables the fields allowed to work in the sql methods (select, inset and update)
 * @property {object} hiddens the fields hidden in the sql methods (select, inset and update)
 * @property {object} rules the validations of the model instance
 * @property {Validator} validator the instance of the class Validator to make the validations
 * @property {object} attributes the magic attributes of the model created in constructor
 * @property {bool} timestamps the definition if the model has create and update dates
 */
var Model = /** @class */ (function () {
    function Model(app, table, rules, fillables, hiddens) {
        if (hiddens === void 0) { hiddens = []; }
        this.app = app;
        this.table = table;
        this.fillables = fillables;
        this.hiddens = hiddens;
        this.rules = rules;
        this.validator = new Validator_1.default(this.rules);
        this.attributes = {};
        this.timestamps = true;
        this.transaction = false;
        this.primaryKey = 'id';
        this.resertFields();
    }
    /**
     * ----------------------------------------------------------------------------
     * Clean to default value the properties allowed of the model
     * ----------------------------------------------------------------------------
     */
    Model.prototype.resertFields = function () {
        var _this = this;
        var fields = this.fillables.concat(this.hiddens);
        fields.forEach(function (value) {
            _this[value] = null;
            _this.attributes[value] = null;
        });
    };
    /**
    * ----------------------------------------------------------------------------
    * Fill the properties of the class, according the post sent that exists in fillables
    * ----------------------------------------------------------------------------
    * @param object data the data sent
    * @return array|bool
    */
    Model.prototype.bindFillables = function (data) {
        for (var field in data) {
            var item = data[field];
            if (this.fillables.indexOf(field) != -1 || this.hiddens.indexOf(field) != -1) {
                this[field] = item;
                this.attributes[field] = item;
            }
        }
    };
    /**
     * ----------------------------------------------------------------------------
     * Update the properties in the attributes property the value in the respective property key
     * ----------------------------------------------------------------------------
     */
    Model.prototype.refrashAttributes = function () {
        for (var field in this.attributes) {
            this.attributes[field] = this[field];
        }
    };
    /**
     * ----------------------------------------------------------------------------
     * get the allowed properties of the model, to use in queries of CRUD
     * set the alias with base in table name
     * add the hidden fillables and timestamps fields when they are active respectively
     * ----------------------------------------------------------------------------
     * @param {bool} useHidden when true add the hidden fillables in the list
     */
    Model.prototype.getFields = function (useHidden) {
        var _this = this;
        if (useHidden === void 0) { useHidden = true; }
        var fields = this.fillables;
        if (useHidden) {
            fields = fields.concat(this.hiddens);
        }
        if (this.timestamps) {
            fields = fields.concat(timestamps);
        }
        return fields.map(function (r) { return _this.table + "." + r; });
    };
    /**
     * ----------------------------------------------------------------------------
     * the current error running in the query
     * ----------------------------------------------------------------------------
     * @param {*} err
     * @return bool
     */
    Model.prototype.isQueryErr = function (err) {
        if (typeof err === "object") {
            return (err.sqlMessage && err.sql ? true : false);
        }
        return false;
    };
    /**
     * ----------------------------------------------------------------------------
     * definitions of relations in current model
     * ----------------------------------------------------------------------------
     * @example
     * relation = {
     *  "job": ["jobs", "jobId", ["job.id"], true, true],
     *  "picture": ["pictures", "pictureId", ["picture.id"], false, true],
     *  "login": ["logins", "personId", ["login.id"], true, false]
     * }
     * this.table = person
     * this.one = select job.id form jobs as job where job.id=person.jobId
     * this.one = select picture.id form pictures as picture where picture.id=person.pictureId limit 1
     * this.one = select login.id form logins as login where login.personId=person.id
     */
    Model.prototype.relations = function (alias) {
        return {
        /*
        string alias: [
            string table FK,
            string field FK,
            array fields FK,
            bool has many results,
            bool field FK is in current model
        ],
        */
        };
    };
    /**
    * ----------------------------------------------------------------------------
    * INSERT Record
    * ----------------------------------------------------------------------------
    * @param object data the fields to be inserting
    * @return Promise
    */
    Model.prototype.create = function (data) {
        if (this.timestamps) {
            data[timestamps[0]] = new Date();
        }
        if (data.id) {
            delete data.id;
        }
        var db = this.app.db(this.table);
        if (this.transaction) {
            db = db.transacting(this.transaction);
        }
        return db.insert(data);
    };
    /**
    * ----------------------------------------------------------------------------
    * UPDATE Record
    * ----------------------------------------------------------------------------
    * @param object data the fields to be updated
    * @return Promise
    */
    Model.prototype.update = function (data) {
        var _this = this;
        if (this.timestamps) {
            data[timestamps[1]] = new Date();
        }
        if (data.id) {
            delete data.id;
        }
        var db = this.app.db(this.table);
        if (this.transaction) {
            db = db.transacting(this.transaction);
        }
        console.log({ update: this.id });
        return new Promise(function (resolve, reject) {
            db.update(data).where({ id: _this.id })
                .then(function (_) { return resolve(_this.id); })
                .catch(function (err) { return reject(err); });
        });
    };
    Model.prototype.delete = function (params) {
        return this.app.db(this.table).where(params).del();
    };
    /**
    * ----------------------------------------------------------------------------
    * CREATE OR UPDATE a Record
    * validate the fields sent in $data and check in fillables to set the data
    * ----------------------------------------------------------------------------
    * @param object data the fields to be updated
    * @param int|null the id of the record to update
    * @return bool
    */
    Model.prototype.save = function (data, transaction) {
        var _this = this;
        if (transaction === void 0) { transaction = false; }
        return new Promise(function (resolve, reject) {
            _this.transaction = transaction;
            _this.resertFields();
            _this.bindFillables(data);
            if (!_this.validator.validate(data)) {
                return reject(Services_1.is400(_this.validator.getErrors()));
            }
            _this.beforeSave().then(function () {
                var result = null;
                _this.refrashAttributes();
                console.log({ save: _this.id });
                if (_this.id) {
                    result = _this.update(_this.attributes);
                }
                else {
                    result = _this.create(_this.attributes);
                }
                result.then(function (r) {
                    var insertedId = (Array.isArray(r) ? r[0] : r);
                    _this.afterSave(insertedId).then(function () { return resolve(insertedId); }, function (err) { return reject(err); });
                }).catch(function (err) { return reject(err); });
            }, function (err) { return reject(err); });
        });
    };
    /**
     * ----------------------------------------------------------------------------
     * Behavior to process a logic before save the record
     * ----------------------------------------------------------------------------
     */
    Model.prototype.beforeSave = function () { return Promise.resolve(); };
    /**
     * ----------------------------------------------------------------------------
     * Behavior to process a logic after save the record
     * ----------------------------------------------------------------------------
     */
    Model.prototype.afterSave = function (id) {
        if (id === void 0) { id = null; }
        return Promise.resolve();
    };
    /**
     * ----------------------------------------------------------------------------
     * Behavior to process the join relation select one
     * ----------------------------------------------------------------------------
     * @param {array} relations the alias list of the pre-defined relations of the model
     * @param {object} base the data of the current data of loaded model
     */
    Model.prototype.oneRelations = function (relations, base) {
        var _this = this;
        if (relations) {
            var promises_1 = [];
            relations.forEach(function (index) {
                var rel = _this.relations(index);
                if (Array.isArray(rel)) {
                    var t_1 = rel[0], fk = rel[1], f_1 = rel[2], many_1 = rel[3], parent_1 = rel[4];
                    var condition_1, value_1;
                    if (parent_1) {
                        condition_1 = index + "." + _this.primaryKey;
                        value_1 = base[fk];
                    }
                    else {
                        condition_1 = index + "." + fk;
                        value_1 = base[_this.primaryKey];
                    }
                    promises_1.push(new Promise(function (resolve) {
                        var query = _this.app.db(t_1 + " as " + index);
                        query.select(f_1 || []).where(condition_1, value_1).orderBy(condition_1, 'desc');
                        if (!many_1) {
                            query.first();
                        }
                        query.then(function (r) { return resolve({ table: index, items: r }); }).catch(function (err) {
                            console.log(err);
                            resolve({});
                        });
                    }));
                }
            });
            if (promises_1.length > 0) {
                return Promise.all(promises_1);
            }
        }
        return Promise.resolve([]);
    };
    /**
     * ----------------------------------------------------------------------------
     * Behavior to process the join relation for select all
     * ----------------------------------------------------------------------------
     * @param {array} relations the alias list of the pre-defined relations of the model
     * @param {*} query the select query base
     */
    Model.prototype.allRelations = function (relations, query) {
        var _this = this;
        if (relations === void 0) { relations = []; }
        var relFields = [];
        relations.forEach(function (index) {
            var rel = _this.relations(index);
            if (Array.isArray(rel)) {
                var t = rel[0], fk = rel[1], f = rel[2];
                relFields = relFields.concat(f || []);
                query.innerJoin(t + " as " + index, index + "." + _this.primaryKey, _this.table + "." + fk);
                query.groupBy(_this.table + "." + _this.primaryKey);
            }
        });
        return relFields;
    };
    /**
    * ----------------------------------------------------------------------------
    * standard query to make select of one result in database
    * add the fields in query with base in the fillables of the model and other rules
    * attach relations in a custom object create with the same name of alias
    * ----------------------------------------------------------------------------
    * @param {object} params of the filter data
    * @param {array} relations the joins with the foreign tables
    * @param {bool|array} hiddenOrCustom when bool add the hidden fillable, when array use their as fields in query
    * @return Promise
    */
    Model.prototype.one = function (params, relations, hiddenOrCustom) {
        var _this = this;
        if (relations === void 0) { relations = []; }
        if (hiddenOrCustom === void 0) { hiddenOrCustom = false; }
        var query = this.app.db(this.table);
        var fields = (Array.isArray(hiddenOrCustom) ? hiddenOrCustom : this.getFields(hiddenOrCustom));
        return new Promise(function (resolve, reject) {
            query
                .select.apply(query, fields).where(params)
                .first()
                .then(function (item) {
                if (item) {
                    return _this.oneRelations(relations, item).then(function (results) {
                        results.forEach(function (row) { return item[row.table] = row.items; });
                        resolve(item);
                    });
                }
                return reject(Services_1.is404("Registro em " + _this.validator.getLabel(_this.table) + " n\u00E3o encontrado"));
            })
                .catch(function (err) {
                console.log(err);
                reject(err);
            });
        });
    };
    Model.prototype.count = function (params) {
        return this.app.db(this.table).where(params).first().count('id as total');
    };
    /**
     * ----------------------------------------------------------------------------
     * standard query to make select of many results in database
     * ----------------------------------------------------------------------------
     * @param {array} relations the joins with the foreign tables
     * @param {bool|array} hiddenOrCustom when bool add the hidden fillable, when array use their as fields in query
     * @return Promise
     */
    Model.prototype.all = function (relations, hiddenOrCustom) {
        if (relations === void 0) { relations = []; }
        if (hiddenOrCustom === void 0) { hiddenOrCustom = false; }
        var query = this.app.db(this.table);
        var fields = (Array.isArray(hiddenOrCustom)
            ? hiddenOrCustom
            : this.getFields(hiddenOrCustom).concat(this.allRelations(relations, query)));
        query.select.apply(query, fields);
        return query;
    };
    return Model;
}());
exports.default = Model;

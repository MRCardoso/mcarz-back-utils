"use strict";
/**
| ----------------------------------------------------------------------------
| Run the validation configurated to the model
| call the method with the validation in the standard stored in the rules
| standard:
| [
|    'field': 'rules-devided-by-pipe:the dot two devided the argument set to rule'
| ]
| ----------------------------------------------------------------------------
* @return bool
*/
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
var messages = {
    "required": "O campo ':field' é obrigatório",
    "min": "O campo ':field' de ter pelo menus :min caracteres.",
    "max": "O campo ':field' deve ter no máximo :max caracteres.",
    "unique": "O campo ':field' já existe e não pode se repetir.",
    "number": "O campo ':field' deve ser um número.",
    "mail": "O campo ':field' deve ter um endereço de email válido.",
    "vusername": "O campo ':field' deve ter caracteres alfanuméricos com underline no lugar dos espaços",
    "enum": "O campo ':field' deve ter o valor entre ':enum'.",
    "compare": "O campo ':field' deve ser igual a ':compare'.",
    "date": "O campo ':field' deve ter uma data válida",
    "unknownMethod": "Validação desconhecida chamada em :field.",
    "unknownUser": "Usuário ':field' não encontrado.",
    "tokenExpired": "Este token expirou!",
    "invalidPassword": "Senha inválida",
    "inativatedUser": "Usuário inativo",
    "missingAttributes": "Fornece atributos a este save",
};
var Validator = /** @class */ (function () {
    /**
     | ----------------------------------------------------------------------------
    | The list of validations to be executed before save a record of the model
    | ----------------------------------------------------------------------------
    */
    function Validator(rules) {
        this.rules = rules;
        this.errors = {};
        this.post = {};
    }
    Validator.addMessage = function (values) {
        messages = __assign(__assign({}, messages), values);
    };
    /**
    | ----------------------------------------------------------------------------
    | Add a error in the model at the field that failed in the validation
    | ----------------------------------------------------------------------------
    * @param string field
    * @param string message
    * @return void
    */
    Validator.prototype.setErrors = function (field, message) {
        if (this.errors[field] === undefined) {
            this.errors[field] = [];
        }
        this.errors[field].push(message);
    };
    /**
    | ----------------------------------------------------------------------------
    | Check if exists error in the current validation
    | ----------------------------------------------------------------------------
    * @return bool is true when exist error
    */
    Validator.prototype.hasErrors = function () {
        var foundError = false;
        for (var e in this.errors) {
            if (this.errors[e] !== undefined && Array.isArray(this.errors[e]) && this.errors[e].length > 0) {
                foundError = true;
                break;
            }
        }
        return foundError;
    };
    /**
    | ----------------------------------------------------------------------------
    | Returns the list with the errors(grouped by [field] => [list-of-possibilities])
    | ----------------------------------------------------------------------------
    * @return Object|array is true when exist error
    */
    Validator.prototype.getErrors = function (field) {
        if (field === void 0) { field = null; }
        return (field ? this.errors[field] : this.errors);
    };
    /**
    | ----------------------------------------------------------------------------
    | Run the validation configurated to the model
    | call the method with the validation in the standard stored in the $rules
    | standard:
    | array(
    |    'field' => 'rules-devided-by-pipe:the dot two devided the argument set to rule'
    | )
    | ----------------------------------------------------------------------------
    * @return bool
    */
    Validator.prototype.validate = function (post) {
        var _this = this;
        this.post = post;
        this.errors = {};
        var _loop_1 = function (field) {
            var validations = this_1.rules[field];
            var vals = validations.split('|');
            vals.forEach(function (validate) {
                var events = validate.split(':');
                if (events[0] in _this && typeof _this[events[0]] === "function") {
                    var argList = { field: field };
                    if (events[1] != undefined) {
                        argList[events[0]] = events[1];
                    }
                    var output = _this[events[0]].apply(_this, (Object.values(argList)));
                    if (!output) {
                        argList.field = _this.getLabel(argList.field);
                        if (argList.compare)
                            argList.compare = _this.getLabel(argList.compare);
                        _this.setErrors(field, _this.processMessages(events[0], argList));
                    }
                }
                else {
                    _this.setErrors(field, _this.processMessages("unknownMethod", { 'field': validate }));
                }
            });
        };
        var this_1 = this;
        for (var field in this.rules) {
            _loop_1(field);
        }
        if (this.hasErrors()) {
            return false;
        }
        return true;
    };
    Validator.prototype.getLabel = function (key) {
        return messages[key] || key;
    };
    /**
    | ----------------------------------------------------------------------------
    | Gets the message from method/validator called
    | e.g:key=required, returns the message at the key required, in messages property
    | ----------------------------------------------------------------------------
    * @param string key the method called
    * @param object params the list of params set to the method called
    * @return string the message
    */
    Validator.prototype.processMessages = function (key, params) {
        if (params === void 0) { params = {}; }
        if (messages[key] != undefined) {
            var messager = messages[key];
            for (var replacement in params) {
                var value = params[replacement];
                var regex = new RegExp(":" + replacement);
                messager = messager.replace(regex, value);
            }
            return messager;
        }
        return "Translate " + key + " not found!";
    };
    /**
    | ----------------------------------------------------------------------------
    | Validator for verify if the attribute is not empty
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @param string mode the additional rule before validate field
    * @return bool
    */
    Validator.prototype.required = function (attribute, mode) {
        if (mode === void 0) { mode = ''; }
        if (mode == 'create') {
            if (this.post['id']) {
                return true;
            }
        }
        var notNull = (this.post[attribute] != null && this.post[attribute] != "null");
        var notUndefined = (this.post[attribute] != undefined && this.post[attribute] != "undefined");
        return ((notNull && notUndefined && this.post[attribute].toString() != '') ? true : false);
    };
    /**
    | ----------------------------------------------------------------------------
    | Validator for verify if the attribute is equal to a second
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @param string comfirmation the attribute confirmation
    * @return bool
    */
    Validator.prototype.compare = function (attribute, comfirmation) {
        return (this.post[attribute] == this.post[comfirmation]);
    };
    /**
    | ----------------------------------------------------------------------------
    | Validator for verify if the attribute is a integer
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @return bool
    */
    Validator.prototype.number = function (attribute) {
        if (this.required(attribute))
            return /^[0-9]{1,}$/.test(this.post[attribute]) ? true : false;
        return true;
    };
    /**
    | ----------------------------------------------------------------------------
    | Validator the verify if the email address is valid
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @return bool
    */
    Validator.prototype.mail = function (attribute) {
        var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(this.post[attribute]) ? true : false;
    };
    Validator.prototype.vusername = function (attribute) {
        return /^[a-z]+[a-z0-9_]+[a-z0-9]$/i.test(this.post[attribute]) ? true : false;
    };
    /**
    | ----------------------------------------------------------------------------
    | Validator to verify if the attributes is a valid date
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @return bool
    */
    Validator.prototype.date = function (attribute) {
        if (this.required(attribute)) {
            // return (/^\d{2}\/\d{2}\/\d{4}$/.test(this.post[attribute])) ? true : false
            return (/^\d{4}-\d{2}-\d{2}$/.test(this.post[attribute])) ? true : false;
        }
        return true;
    };
    /**
    | ----------------------------------------------------------------------------
    | Validator the minimum size of the a string
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @param string number the minimum size
    * @return bool
    */
    Validator.prototype.min = function (attribute, number) {
        if (number === void 0) { number = 10; }
        if (this.required(attribute)) {
            var value = (this.post[attribute] || "");
            return ((value.toString().length >= number) ? true : false);
        }
        return true;
    };
    /**
    | ----------------------------------------------------------------------------
    | Validator the maximum size of the a string
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @param string number the maximum size
    * @return bool
    */
    Validator.prototype.max = function (attribute, number) {
        if (number === void 0) { number = 200; }
        if (this.required(attribute)) {
            var value = (this.post[attribute] || "");
            return ((value.toString().length <= number) ? true : false);
        }
        return true;
    };
    return Validator;
}());
exports.default = Validator;

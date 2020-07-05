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

let messages = {
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
    "missingAttributes": "Fornece atributos a este save",
}

class Validator
{
    /**
     | ----------------------------------------------------------------------------
    | The list of validations to be executed before save a record of the model
    | ----------------------------------------------------------------------------
    */
    constructor(rules){
        this.rules = rules
        this.errors = {}
        this.post = {}
    }

    static addMessage(values){
        messages = { ...messages, ...values }
    }

    /**
    | ----------------------------------------------------------------------------
    | Add a error in the model at the field that failed in the validation
    | ----------------------------------------------------------------------------
    * @param string field
    * @param string message
    * @return void
    */
    setErrors(field, message) {
        if (this.errors[field]===undefined){
            this.errors[field] = [];
        }
        this.errors[field].push(message);
    }

    /**
    | ----------------------------------------------------------------------------
    | Check if exists error in the current validation
    | ----------------------------------------------------------------------------
    * @return bool is true when exist error
    */
    hasErrors() {
        let foundError = false;
        for (let e in this.errors){
            if (this.errors[e] !== undefined && Array.isArray(this.errors[e]) && this.errors[e].length > 0){
                foundError = true;
                break;
            }
        }
        return foundError;
    }

    /**
    | ----------------------------------------------------------------------------
    | Returns the list with the errors(grouped by [field] => [list-of-possibilities])
    | ----------------------------------------------------------------------------
    * @return Object|array is true when exist error
    */
    getErrors(field) {
        return (field ? this.errors[field] : this.errors);
    }

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
    validate(post) {
        this.post = post
        this.errors = {}
        
        for (let field in this.rules){
            let validations = this.rules[field]
            let vals = validations.split('|')
            vals.forEach(validate => {
    
                let events = validate.split(':')
    
                if (events[0] in this && typeof this[events[0]] === "function"){
                    let argList = { field };
                    if (events[1] != undefined) {
                        argList[events[0]] = events[1];
                    }
                    
                    let output = this[events[0]](...(Object.values(argList)));
                    
                    if (!output) {
                        argList.field = this.getLabel(argList.field);
                        if (argList.compare) argList.compare = this.getLabel(argList.compare)
                        this.setErrors(field, this.processMessages(events[0], argList));
                    }
                }
                else {
                    this.setErrors(field, this.processMessages("unknownMethod", { 'field': validate }));
                }
            })
        }
        if (this.hasErrors()) {
            return false;
        }
        return true;
    }

    getLabel(key){
        return messages[key] || key
    }
    /**
    | ----------------------------------------------------------------------------
    | Gets the message from method/validator called
    | e.g:key=required, returns the message at the key required, in messages property 
    | ----------------------------------------------------------------------------
    * @param string key the method called
    * @param array params the list of params set to the method called
    * @return string the message
    */
    processMessages(key, params) {
        if (messages[key] != undefined) {
            let messager = messages[key];
            for(let replacement in params){
                let value = params[replacement]
                let regex = new RegExp(`:${replacement}`)
                messager = messager.replace(regex, value)
            }

            return messager;
        }
        return `Translate ${key} not found!`;
    }

    /**
    | ----------------------------------------------------------------------------
    | Validator for verify if the attribute is not empty
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @param string mode the additional rule before validate field
    * @return bool
    */
    required(attribute, mode) {
        if (mode == 'create'){
            if (this.post['id']){
                return true
            }
        }
        let notNull = (this.post[attribute] != null && this.post[attribute] != "null");
        let notUndefined = (this.post[attribute] != undefined && this.post[attribute] != "undefined");

        return ((notNull && notUndefined && this.post[attribute].toString() != '') ? true : false);
    }

    /**
    | ----------------------------------------------------------------------------
    | Validator for verify if the attribute is equal to a second
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @param string comfirmation the attribute confirmation
    * @return bool
    */
    compare(attribute, comfirmation) {
        return (this.post[attribute] == this.post[comfirmation]);
    }

    /**
    | ----------------------------------------------------------------------------
    | Validator for verify if the attribute is a integer
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @return bool
    */
    number(attribute) {
        if (this.required(attribute))
            return /^[0-9]{1,}$/.test(this.post[attribute]) ? true : false;
        return true;
    }

    /**
    | ----------------------------------------------------------------------------
    | Validator the verify if the email address is valid
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @return bool
    */
    mail(attribute) {
        let regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regex.test(this.post[attribute]) ? true : false;
    }

    vusername(attribute){
        return /^[a-z]+[a-z0-9_]+[a-z0-9]$/i.test(this.post[attribute]) ? true : false
    }

    /**
    | ----------------------------------------------------------------------------
    | Validator to verify if the attributes is a valid date
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @return bool
    */
    date(attribute){
        if (this.required(attribute)){
            // return (/^\d{2}\/\d{2}\/\d{4}$/.test(this.post[attribute])) ? true : false
            return (/^\d{4}-\d{2}-\d{2}$/.test(this.post[attribute])) ? true : false
        }
        return true
    }

    /**
    | ----------------------------------------------------------------------------
    | Validator the minimum size of the a string
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @param string number the minimum size
    * @return bool
    */
    min(attribute, number = 10) {
        if (this.required(attribute)){
            let value = (this.post[attribute] || "")
            return ((value.toString().length >= number) ? true : false);
        }
        return true
    }

    /**
    | ----------------------------------------------------------------------------
    | Validator the maximum size of the a string
    | ----------------------------------------------------------------------------
    * @param string attribute the attribute validated
    * @param string number the maximum size
    * @return bool
    */
    max(attribute, number = 200) {
        if (this.required(attribute)){
            let value = (this.post[attribute] || "")
            return ((value.toString().length <= number) ? true : false);
        }
        return true
    }
}

module.exports = Validator;
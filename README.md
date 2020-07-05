# A Node package with commun method to works a backend node


#### install package
```
npm i mcarz-back-utils
```


## Require modules

```javascript
let myfaus = require('mcarz-back-utils');
```

## prepare error to response in the API

Method to prepare the generated an object with StatusHttp and message with the error founded

```javascript
myfaus.prepareError(error:<object|string>, customKeys|<string> = null)
```

## response Api with StatusHttp and standard object returned

Method to response the API with Status and message with base the raw error

```javascript
myfaus.prepareResponse(response: from express, error:<object|string>, prettyErr|<string> = null)
```

## send mail

Method to send mail with nodemailer

```javascript
myfaus.sendMail(data<object>, credentials<object>, configs<object>)
```

## Class Validator

Standard class to Make backend validations with common rules (e.g required)

```javascript
const Validator = require('mcarz-back-utils').Validatorus

new Validator({
    "username": "the name of the user",
    "password": "the password of the user",
})
```

## Class Model

Standard Model class work wih the validator and serve the standard method of CRUD

```javascript
const Model = require('mcarz-back-utils').Modelus
class User extends Model {
    constructor(app){
        const fillables = ["id", "name", "username", "email"]
        const hiddens = ["password"]
        const rules = {
            "name"          : "required|max:80",
            "username"      : "required|min:5|max:80|vusername",
            "email"         : "required|mail|max:120",
            "password"      : "required:create|min:8|max:80",
            "confirmation"  : "required:create|min:8|max:80|compare:password",
        }
        super(app, "users", rules, fillables, hiddens)
    }
}
```
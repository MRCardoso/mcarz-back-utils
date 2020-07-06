# A Node package with commun method to works a backend node


#### install package
```
npm i mcarz-back-utils
```


## Require modules

```javascript
let { 
    prepareError, 
    prepareResponse, 
    sendMail,
    createFilenameHash, 
    is400, 
    is401, 
    is403, 
    is404,
    server,
} = require('mcarz-back-utils');
```

## Factories

Method to create standard server node, with express, consign, knex

```javascript
server(db:object, port:number, ...entities)
```

Method to send mail with nodemailer

```javascript
sendMail(data: object, credentials: object, configs: object)
```

## Common Services

Method to create the hash with filename

```javascript
createFilenameHash(name:string)
```

## http 4xx return object

```javascript
is400(message: string)
is401(message: string)
is403(message: string)
is404(message: string)
```

## Error Handler

Method to prepare the generated an object with StatusHttp and message with the error founded

```javascript
prepareError(error:object|string, customKeys:string = null)
```

Method to response the API with Status and message with base the raw error

```javascript
prepareResponse(response: from express, error:object|string, prettyErr: string = null)
```


## Class

Standard class to Make backend validations with common rules (e.g required)

```javascript
const { Validatorus: Validator } = require('mcarz-back-utils')

new Validator({
    "username": "the name of the user",
    "password": "the password of the user",
})
```

Standard Model class work wih the validator and serve the standard method of CRUD

```javascript
const { Modelus: Model } = require('mcarz-back-utils')
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
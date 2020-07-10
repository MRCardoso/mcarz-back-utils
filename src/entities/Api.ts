import Validator from './Validator'
import { is400 } from '../handlers/Services'

/**
 * ----------------------------------------------------------------------------
 * Standard class to common method to create data in the api table
 * with foreign key in user's table
 * ----------------------------------------------------------------------------
 * @author Marlon R. Cardoso
 */
export default class Api {
    private _validator: Validator
    private _model: any
    
    private _idField: string
    private _userField: string
    private _tokenField: string
    private _expiresField: string
    private _createFiled: string
    
    constructor(
        model: any, 
        idField: string = 'id', 
        userField: string = "userId", 
        tokenField: string = "token", 
        expiresField: string = "expires", 
        createFiled: string = "created_at"
    ) {
        this._idField = idField
        this._userField = userField
        this._tokenField = tokenField
        this._expiresField = expiresField
        this._createFiled = createFiled
        this._model = model
    }

    /**
     * -----------------------------------------------------------------------------
     * Validation for token required in the queries to find or delete data by token
     * -----------------------------------------------------------------------------
     * @param {object} data the object with the token to be validate as required
     * @returns {boolean}
    */
    protected validateToken(data: any): boolean {
        this._validator = new Validator({ "token": "required" })

        return this._validator.validate(data)
    }

    /**
     * -----------------------------------------------------------------------------
     * Validation for fields base of the table for api before create newly records
     * -----------------------------------------------------------------------------
     * @param {object} data the fields for create
     * @param {object} rules the custom rules
     * @returns {boolean}
     */
    protected validateFields(data: any, rules: any): boolean{
        this._validator = new Validator({
            [this._userField]: "required|number",
            [this._tokenField]: "required",
            [this._expiresField]: "required|number",
            ...rules
        })

        return this._validator.validate(data)
    }

    /**
     * Create a newly record in the api table from the instance in property '_model'
     * @param {object} logged the values of the logged user to create link for api table
     * @param {object} post the field data to insert in the _model instance
     * @param {object} rules the custom rules
     * @param {*} middleware the custom function to create payload with JWT
     * @returns {Promise}
     */
    public add(logged: any, post: any, rules: any, middleware: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.validateFields(post, rules)) {
                return reject(is400(this._validator.getErrors()))
            }

            let { token, expires, payload } = middleware()

            if(this._tokenField.trim() !== ""){
                post[this._tokenField] = token
            }
            if(this._expiresField.trim() !== ""){
                post[this._expiresField] = expires
            }
            if(this._createFiled.trim() !== ""){
                post[this._createFiled] = new Date()
            }
            
            post[this._userField] = logged.id
            
            this._model
                .save(post)
                .then(id => resolve({ authToken: { ...payload, token, apiId: id }, ...logged }))
                .catch(err => reject(err))
        })
    }

    /**
     * Remove specific record in the api table from the instance in property '_model'
     * @param {number} id the primary key of the api table
     * @param {number} userId the foreign key of the user table
     * @param {*} middleware the callback to proccess the logout in the JWT token
     * @returns {Promise}
     */
    public remove(id: number, userId: number, middleware: any): Promise<any> {
        return new Promise((resolve, reject) => {
            middleware()
            
            this._model.delete({ [this._idField]: id, [this._userField]: userId })
                .then((deleted: any) => resolve(deleted))
                .catch((error: any) => reject(error))
        })
    }

    /**
     * Delete by token a record in the api table from the instance in property '_model'
     * * @param {string} token the token create with JWT in login
     * @returns {Promise}
     */
    public removeByToken(token: string): Promise<any> {
        const params = { [this._tokenField]: token }

        if (!this.validateToken(params)){
            return Promise.reject(is400(this._validator.getErrors()))
        }
        
        return this._model.delete(params)
    }

    /**
     * Load by token a record in the api table from the instance in property '_model'
     * @param {string} token the token create with JWT in login
     * @returns {Promise}
     */
    public getByToken(token: string): Promise<any> {
        const params = { [this._tokenField]: token }

        if (!this.validateToken(params)) {
            return Promise.reject(is400(this._validator.getErrors()))
        }
        
        return this._model.findByToken(params)
    }
}
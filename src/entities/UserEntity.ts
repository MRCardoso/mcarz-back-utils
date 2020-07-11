import { is400, is401 } from '../handlers/Utils';
import Model from './Model'
import Validator from './Validator'
import { genSaltSync, hashSync, compareSync } from 'bcrypt-nodejs'
import { randomBytes } from 'crypto'

/**
 * @author Marlon R. Cardoso
 * @property {int} id the primary key of the table
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
export default class UserEntity extends Model {
    [x: string]: any
    envConfig: any
    constructor(app: any, envConfig: any) {
        const fillables = ["id", "name", "username", "email", "status", "admin"]
        const hiddens = ["password"]
        const rules = {
            "name": "required|max:80",
            "username": "required|min:5|max:80|vusername",
            "email": "required|mail|max:120",
            "password": "required:create|min:8|max:80",
            "confirmation": "required:create|min:8|max:80|compare:password",
            "status": "number"
        }
        super(app, "users", rules, fillables, hiddens)
        this.envConfig = envConfig
    }

    get tokenField(): string{
        return "resetToken"
    }
    get expiresField(): string {
        return "resetExpires"
    }
    get fieldToReset(){
        return [this.primaryKey, 'status', 'name', this.tokenField, this.expiresField].filter(f => f)
    }

    static active() {
        return 1;
    }
    static inactive() {
        return 0;
    }
    static hashPassword(password: any, salt: number = 10) {
        return hashSync(password, genSaltSync(salt))
    }

    beforeSave(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.id && !this.password) {
                delete this.attributes["password"]
            }
            else if (this.password) {
                this.password = UserEntity.hashPassword(this.password)
                this.attributes["password"] = this.password
            }
            if (this.status == null || this.status == undefined) {
                delete this.attributes["status"]
            } else {
                this.status = (this.status == "1" || this.status == "true") ? true : false
                this.attributes["status"] = this.status
            }

            this.uniqueUser()
                .then(_ => reject(this.validator.processMessages("unique", { field: "username/email" })))
                .catch(err => (this.isQueryErr(err) ? reject(err) : resolve()))
        })
    }

    /**
    * ----------------------------------------------------------------------------
    * Method to validate of the user exists with the email or username wished
    * ----------------------------------------------------------------------------
    * @returns {Promise}
    */
    uniqueUser(): Promise<any> {
        const id = this.id
        const email = this.email
        const username = this.username

        return this.one(function () {
            this.whereRaw('(email = ? OR username = ?)', [email, username])

            if (id) {
                this.andWhere('id', '<>', id)
            }
        })
    }

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
    login(post: any, relations: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.validator = new Validator({
                "username": this.rules.username,
                "password": this.rules.password,
            })

            if (!this.validator.validate(post)) {
                return reject(is400(this.validator.getErrors()))
            }

            this.one({ username: post.username }, [...relations], true).then(logged => {
                if (!logged.status){
                    return reject(is401(this.validator.processMessages("inativatedUser")))
                }
                if (!compareSync(post.password, logged.password)) {
                    return reject(is400({ password: [this.validator.processMessages("invalidPassword")] }))
                }
                resolve(logged)
            }).catch(err => reject(err))
        })
    }

    /**
    * ----------------------------------------------------------------------------
    * Method to use select one default of the App, filter by email of user
    * validate of the email was informed
    * ----------------------------------------------------------------------------
    * @param {string} email the email to be find the user
    * @param {bool} active validation to find user only active status
    * @returns {Promise}
    */
    findByEmail(email: string, active:boolean = true): Promise<any> {
        let post:any = { email }
        this.validator = new Validator({ "email": this.rules.email })

        if (!this.validator.validate(post)) {
            return Promise.reject(is400(this.validator.getErrors()))
        }
        if (active) {
            post.status = UserEntity.active();
        }
        return this.one(post)
    }

    /**
    * ----------------------------------------------------------------------------
    * Method to find user by token to recovery password, 
    * and validate token and expires are valid
    * ----------------------------------------------------------------------------
    * @param {string} resetToken the token to find the user to update the password
    * @param {boolean} validateExpires filter with resetExpires
    * @returns {Promise}
    */
    findByResetToken(resetToken: any, validateExpires: boolean = true): Promise<any> {
        const tokenField = this.tokenField
        const expiresField = this.expiresField
        const params = { [tokenField]: resetToken }

        this.validator = new Validator({ [tokenField]: "required" })

        if (!this.validator.validate(params)) {
            return Promise.reject(is400(this.validator.getErrors()))
        }

        return new Promise((resolve, reject) => {
            this.one(function () {
                this.where(params)
                if (validateExpires) {
                    this.andWhere(expiresField, '>', Date.now())
                }
            }, [], this.fieldToReset)
            .then(res => (res.status ? resolve(res) : reject(is401(this.validator.processMessages("inativatedUser")))))
            .catch(err => reject(err))
        })
    }

    /**
     * ----------------------------------------------------------------------------
     * Update the reset password token and expires date of the load user
     * ----------------------------------------------------------------------------
     * @param {int} id the id of the user to send token
     * @returns {Promise}
     */
    updateResetToken(id: any): Promise<any> {
        const { resetToken = (60 * 60 * 1000) } = this.envConfig
        const password = UserEntity.hashPassword(Date.now() * 1000);
        const token = randomBytes(32).toString('hex');
        const expires = Date.now() + resetToken

        return new Promise((resolve, reject) => {
            this.id = id
            this.update({ password, [this.tokenField]: token, [this.expiresField]: expires })
                .then(_ => resolve({ token, expires }))
                .catch(err => reject(err))
        })
    }

    /**
     * ----------------------------------------------------------------------------
     * Update the password of the user by token with recovery password
     * ----------------------------------------------------------------------------
     * @param {object} post the data with password and confirmation
     * @param {string} post.password the password to be update
     * @param {string} post.confirmation the confirmation of the password
     * @param {int} id the id of the user to send token
     * @returns {Promise}
     */
    updatePassword(post: any, id: number): Promise<any> {
        this.id = id
        this.validator = new Validator({
            "password": this.rules.password,
            "confirmation": this.rules.confirmation,
        })
        
        if (!this.validator.validate(post)) {
            return Promise.reject(is400(this.validator.getErrors()))
        }
        
        return this.update({ password: UserEntity.hashPassword(post.password), resetToken: null, resetExpires: null})
    }
}
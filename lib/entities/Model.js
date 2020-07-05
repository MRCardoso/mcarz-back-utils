const Validator = require('./Validator')
const timestamps = ["created_at", "updated_at"]

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
class Model {
    constructor(app, table, rules, fillables, hiddens = []) {
        this.app = app
        this.table = table
        this.fillables = fillables
        this.hiddens = hiddens
        this.rules = rules
        this.validator = new Validator(this.rules)
        this.attributes = {}
        this.timestamps = true
        this.transaction = false
        this.primaryKey = 'id'

        this.resertFields()
    }

    /**
     * ----------------------------------------------------------------------------
     * Clean to default value the properties allowed of the model
     * ----------------------------------------------------------------------------
     */
    resertFields()
    {
        let fields = this.fillables.concat(this.hiddens)
        fields.forEach((value) => {
            this[value] = null
            this.attributes[value] = null
        })
    }

    /**
    * ----------------------------------------------------------------------------
    * Fill the properties of the class, according the post sent that exists in fillables
    * ----------------------------------------------------------------------------
    * @param object data the data sent
    * @return array|bool
    */
    bindFillables(data) {
        for (let field in data) {
            let item = data[field]
            if (this.fillables.indexOf(field) != -1 || this.hiddens.indexOf(field) != -1) {
                this[field] = item
                this.attributes[field] = item
            }
        }
    }

    /**
     * ----------------------------------------------------------------------------
     * Update the properties in the attributes property the value in the respective property key
     * ----------------------------------------------------------------------------
     */
    refrashAttributes(){
        for (let field in this.attributes){
            this.attributes[field] = this[field]
        }
    }

    /**
     * ----------------------------------------------------------------------------
     * get the allowed properties of the model, to use in queries of CRUD
     * set the alias with base in table name
     * add the hidden fillables and timestamps fields when they are active respectively
     * ----------------------------------------------------------------------------
     * @param {bool} useHidden when true add the hidden fillables in the list
     */
    getFields(useHidden = true){
        let fields = this.fillables;
        if (useHidden){
            fields = fields.concat(this.hiddens);
        }
        if(this.timestamps){
            fields = fields.concat(timestamps)
        }
        return fields.map(r => `${this.table}.${r}`)
    }

    /**
     * ----------------------------------------------------------------------------
     * the current error running in the query
     * ----------------------------------------------------------------------------
     * @param {*} err 
     * @return bool
     */
    isQueryErr(err) {
        if (typeof err === "object") {
            return (err.sqlMessage && err.sql ? true : false)
        }
        return false
    }
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
    relations(alias) {
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
    }

    /**
    * ----------------------------------------------------------------------------
    * INSERT Record
    * ----------------------------------------------------------------------------
    * @param object data the fields to be inserting
    * @return Promise
    */
    create(data) {
        if (this.timestamps){
            data[timestamps[0]] = new Date()
        }
        if (data.id) {
            delete data.id
        }

        let db = this.app.db(this.table)
        if (this.transaction){
            db = db.transacting(this.transaction)
        }
        return db.insert(data)
    }

    /**
    * ----------------------------------------------------------------------------
    * UPDATE Record
    * ----------------------------------------------------------------------------
    * @param object data the fields to be updated
    * @return Promise
    */
    update(data) {
        if (this.timestamps) {
            data[timestamps[1]] = new Date()
        }
        if (data.id) {
            delete data.id
        }
        
        let db = this.app.db(this.table)

        if (this.transaction){
            db = db.transacting(this.transaction)
        }
        
        return new Promise((resolve, reject) => {
            db.update(data).where({ id: this.id })
                .then(_ => resolve(this.id))
                .catch(err => reject(err))
        })
    }

    delete(params){
        return this.app.db(this.table).where(params).del()
    }
    /**
    * ----------------------------------------------------------------------------
    * CREATE OR UPDATE a Record
    * validate the fields sent in $data and check in fillables to set the data
    * ----------------------------------------------------------------------------
    * @param object data the fields to be updated
    * @param int|null the id of the record to update
    * @return bool
    */
    save (data, transaction = false) {
        return new Promise((resolve, reject) =>
        {
            this.transaction = transaction
            this.resertFields()
            this.bindFillables(data)

            if(!this.validator.validate(data)){
                return reject(is400(this.validator.getErrors()));
            }

            this.beforeSave().then(() => {
                let result = null;
                this.refrashAttributes()

                if (this.id){
                    result = this.update(this.attributes);
                } else{
                    result = this.create(this.attributes);
                }
                
                result.then(r => {
                    let insertedId = (Array.isArray(r) ? r[0] : r)
                    this.afterSave(insertedId).then(
                        () => resolve(insertedId),
                        err => reject(err)
                    )
                }).catch(err => reject(err))
            }, (err) => reject(err))
        })
    }

    /**
     * ----------------------------------------------------------------------------
     * Behavior to process a logic before save the record
     * ----------------------------------------------------------------------------
     */
    beforeSave(){
        return Promise.resolve()
    }

    /**
     * ----------------------------------------------------------------------------
     * Behavior to process a logic after save the record
     * ----------------------------------------------------------------------------
     */
    afterSave() { return Promise.resolve() }

    /**
     * ----------------------------------------------------------------------------
     * Behavior to process the join relation select one
     * ----------------------------------------------------------------------------
     * @param {array} relations the alias list of the pre-defined relations of the model
     * @param {object} base the data of the current data of loaded model
     */
    oneRelations(relations, base) {
        if (relations) {
            let promises = []
            
            relations.forEach(index => {
                let rel = this.relations(index)
                if (Array.isArray(rel)) {
                    let [t, fk, f, many, parent] = rel
                    let condition, value
                    
                    if (parent){
                        condition = `${index}.${this.primaryKey}`
                        value = base[fk]
                    } else{
                        condition = `${index}.${fk}`
                        value = base[this.primaryKey]
                    }
                    
                    promises.push(
                        new Promise(resolve => {
                            let query = this.app.db(`${t} as ${index}`)
                                query.select(f || []).where(condition, value).orderBy(condition, 'desc')
                            
                                if (!many) { query.first() }
                                
                                query.then(r => resolve({ table: index, items: r })).catch(err => {
                                    console.log(err)
                                    resolve({})
                                })
                        })
                    )
                }
            })
            if (promises.length>0){
                return Promise.all(promises)
            }
        }
        return Promise.resolve([])
    }

    /**
     * ----------------------------------------------------------------------------
     * Behavior to process the join relation for select all
     * ----------------------------------------------------------------------------
     * @param {array} relations the alias list of the pre-defined relations of the model
     * @param {*} query the select query base
     */
    allRelations(relations = [], query) {
        let relFields = []
        relations.forEach(index => {
            let rel = this.relations(index)
            if (Array.isArray(rel)) {
                let [t, fk, f] = rel
                relFields = relFields.concat(f || [])
                query.innerJoin(`${t} as ${index}`, `${index}.${this.primaryKey}`, `${this.table}.${fk}`)
                query.groupBy(`${this.table}.${this.primaryKey}`)
            }
        })

        return relFields
    }

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
    one(params, relations = [], hiddenOrCustom = false){
        let query = this.app.db(this.table)
        let fields = (Array.isArray(hiddenOrCustom) ? hiddenOrCustom : this.getFields(hiddenOrCustom))

        return new Promise( (resolve, reject) => {
            query
                .select(...fields)
                .where(params)
                .first()
                .then(item => {
                    if(item){
                        return this.oneRelations(relations, item).then(results => {
                            results.forEach(row => item[row.table] = row.items)
                            resolve(item)
                        })
                    }
                    return reject(is404(`Registro em ${this.validator.getLabel(this.table)} não encontrado`))
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })
        })
    }

    count(params){
        return this.app.db(this.table).where(params).first().count('id as total')
    }

    /**
     * ----------------------------------------------------------------------------
     * standard query to make select of many results in database
     * ----------------------------------------------------------------------------
     * @param {array} relations the joins with the foreign tables
     * @param {bool|array} hiddenOrCustom when bool add the hidden fillable, when array use their as fields in query
     * @return Promise
     */
    all(relations = [], hiddenOrCustom = false){
        let query = this.app.db(this.table)
        let fields = (
            Array.isArray(hiddenOrCustom) 
            ? hiddenOrCustom 
            : this.getFields(hiddenOrCustom).concat(this.allRelations(relations, query))
        )

        query.select(...fields)

        return query
    }
}

module.exports = Model;
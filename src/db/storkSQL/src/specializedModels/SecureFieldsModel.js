import Model from '../Model';
import _ from 'lodash';
import uuid from 'uuid-v4';
const crypto = require('crypto');

export default class SecureFields extends Model {
  constructor(tableName, db, password, secureFields) {
    super(tableName, db);
    this.algorithm = 'aes-256-ctr';
    this.password = password;
    this.secureFields = secureFields;
  }

  create(obj) {
    const salt = this.salt(10);
    // obj.id = uuid();
    let encryptedModel = this.encryptModel(obj, salt);
    return this._ModelCreate(encryptedModel);
  }

  update(criteriaObj, updateObj) {
    const salt = this.salt(10);
    console.log('CRITERIA', criteriaObj);
    console.log('encrypted update', this.encryptModel(updateObj, salt));
    return this._ModelUpdate(criteriaObj, this.encryptModel(updateObj, salt));
  }

  findOrCreate(obj) {
    // finds only on first val
    let firstProperty = Object.keys(obj)[0];
    this.findOne(obj)
    .then((foundObj) => {
      if (!foundObj || foundObj.length === 0) {
        return this.create(obj);
      } else {
        return foundObj;
      }
    });
  }

  decryptCollection(collection) {
    return collection.map((model) => this.decryptModel(model));
  }

  decryptModel(obj) {
    let decrypted = _.extend({}, obj);
    _(this.secureFields).each((field) => {
      if (decrypted[field]) {
        decrypted[field] = this.decrypt(decrypted[field]);
        decrypted[field] = decrypted[field].slice(0, decrypted[field].length - 10);
      }
    });
    return decrypted;
  }


  encryptModel(obj, salt) {
    let encrypted = _.extend({}, obj);
    _(this.secureFields).each((field) => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field].concat(salt));
      }
    });
    return encrypted;
  }

  encryptCollection(collection) {
    return collection.map((model) => {
      const salt = this.salt(10);
      return this.encryptModel(model, salt);
    });
  }

  salt(numOfRounds) {
    const results = [];
    for (var i = 0; i < numOfRounds; i++) {
      results.push(Math.random().toString(36).substr(2, 1));
    }
    return results.join('');
  }

  encrypt(text) {
    const cipher = crypto.createCipher(this.algorithm, this.password);
    let crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }

  decrypt(text) {
    const decipher = crypto.createDecipher(this.algorithm, this.password);
    let dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }

}

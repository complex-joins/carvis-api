import _ from 'lodash';

class Model {
  constructor(table, db) {
    this.db = db;
    this.table = table;
    this.relationships = [];
  }

  findAll() {
    return this.db.select().from(this.table);
  }

  findById(id) {
    return this.db.select().from(this.table).where({id: id});
  }

  find(obj) {
    let orWhereBuild = _(obj).reduce((ors, val, key) => ors.orWhere(key, val), this.db.select().from(this.table));
    return orWhereBuild;
  }

  findOne(obj) {
    let orWhereBuild = _(obj).reduce((ors, val, key) => ors.orWhere(key, val), this.db.select().from(this.table));
    return orWhereBuild
      .then((user) => user[0]);
  }

  findOrCreate(obj) {
    // finds only on first val
    if (_.isEmpty(findCriteria)) {
      return this.create(updateCriteria);
    }
    let firstProperty = Object.keys(obj)[0];
    this.db.select().from(this.table).orWhere({[firstProperty]: obj[firstProperty]})
    .then((foundObj) => {
      if (!foundObj || !foundObj.length) {
        return this.create(obj);
      } else {
        return foundObj;
      }
    });
  }

  updateOrCreate(findCriteria, updateCriteria) {
    if (_.isEmpty(findCriteria)) {
      return this.create(updateCriteria);
    }
    return this.find(findCriteria)
    .then((foundObj) => {
      if (!foundObj || !foundObj.length) {
        return this.create(updateCriteria);
      } else {
        return this.update(findCriteria, updateCriteria);
      }
    });
  }

  _ModelCreate(obj) {
    return this.db.insert(obj).into(this.table).returning('*');
  }

  create(obj) {
    return this._ModelCreate(obj);
  }

  save(obj) {
    return this.create(obj);
  }

  update(criteriaObj, updateObj, options) {
    let findCriteria = removeNullOrEmpty(criteriaObj);
    console.log('fff', findOrCreate);
    if (options && options.matchBy) {
      return this._ModelUpdate( {[options.matchBy]: findCriteria[options.matchBy] });
    }

    return this._ModelUpdate(findCriteria, updateObj);
  }

  _ModelUpdate(criteriaObj, updateObj) {
    let orWhereBuild = _(criteriaObj).reduce((ors, val, key) => ors.orWhere(key, val), this.db(this.table).update(updateObj));
    return orWhereBuild.returning('*');
  }

  remove(obj) {
    return this.db(this.table)
      .where(obj)
      .del();
  }

  // TODO create event and lifecycle hooks
  // on(event) {
  //
  // }

}

export default Model;

function removeNullOrEmpty(obj) {
  let newObj = _.extend({}, obj);
  _(newObj).each((val, key) => {
    if (val === null || val === '') {
      delete newObj[key];
    }
  });
  return newObj;
}

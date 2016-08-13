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
    return this.db.select().from(this.table).where(obj);
  }

  findOrCreate(obj) {
    // finds only on first val
    console.log('called find or create');
    let firstProperty = Object.keys(obj)[0];
    this.db.select().from(this.table).where({[firstProperty]: obj[firstProperty]})
    .then((foundObj) => {
      if (!foundObj) {
        return this.create(obj);
      } else {
        return foundObj;
      }
    });
  }

  updateOrCreate(obj) {
    return this.db.find(obj)
    .then((foundObj) => {
      if (!foundObj) {
        return this.create(obj);
      } else {
        return update(foundObj, obj);
      }
    });
  }

  create(obj) {
    return this.db.insert(obj).into(this.table).returning(...Object.keys(obj), 'id');
  }

  save(obj) {
    return this.create(obj);
  }

  update(criteriaObj, updateObj) {
    return this.db(this.table)
      .update(updateObj, [...updateObj])
      .where(criteriaObj)
      .returning(...Object.keys(updateObj), 'id');
  }

  remove(obj) {
    return this.db(this.table)
      .where(obj)
      .del();
  }

}

export default Model;

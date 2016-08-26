import Model from './Model';
import SecureFieldsModel from './specializedModels/SecureFieldsModel';
import _ from 'lodash';
import knex from 'knex';

export default class DatabaseInstance {
  constructor(configObj, options) {
    if (options && options.testing) {
      this.knex = this.db = knex({});
    } else {
      this.knex = this.db = knex(configObj);
    }
  }

  model(table, schema, options) {
    if (options && options.secureFields) {
      return new SecureFieldsModel(table, this.db, options.secureFields.password, options.secureFields.fields);
    }
    return new Model(table, this.db);
  }

  dropTableIfExists(tableName) {
    return this.db.schema.dropTableIfExists(tableName);
  }

  hasTable(tableName) {
    return this.db.schema.hasTable(tableName);
  }

  createTable(tableName, schema) {
    return this.db.schema.createTable(tableName, schema);
  }

  migrate(tables) {
    return Promise.all(
      _(tables).map((table) => this.dropTableIfExists(table.name)
        .then(() => this.createTable(table.name, table.schema)))
    );
  }

  endConnection() {
    return this.db.destroy();
  }
}

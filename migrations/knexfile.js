// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: JSON.parse(process.env.DB_CONFIG_OBJ_JSON),
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.PG_PORT_5432_TCP_ADDR,
      port: 5432,
      // ssl: true,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};

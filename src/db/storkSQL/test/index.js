const expect = require('chai').expect;
import Stork from '../src/index';

const testDB = new Stork({
  client: 'sqlite3',
  connection: {filename: './mydb.sqlite'},
  useNullAsDefault: true
});


let UserSchema = function (user) {
  user.increments('id').primary();
  user.timestamp('created_at').defaultTo(testDB.knex.fn.now());
  user.string('email', 255).unique().defaultTo(null);
  user.string('password', 100);
  user.integer('coolId');
};

const User = testDB.model('users', UserSchema, { secureFields: { fields: ['password', 'token'], password: 'yo' } });
let tables = [
  { name: 'users', schema: UserSchema }
];

describe('Testing suite for Stork ORM', () => {
  describe('=============\nSCHEMA HANDLING', () => {
    before((done) => {
      testDB.dropTableIfExists('users')
      .then(() => testDB.createTable('users', UserSchema))
      .then(() => done());
    });

    xit('should implement UUIDs properly', (done) => {
      User.create({email: 'chris@chris.com', password: 'cheezits'})
      .then(() => User.find({email: 'chris@chris.com'}))
      .then((user) => {
        console.log(user);
        expect(user[0].id).to.exist;
        expect(user[0].id).to.have.length.above(8);
        done();
      })
      .catch((err) => done(err));
    });
  });

  describe('=============\nBASIC OPERATIONS', () => {
    before((done) => {
      testDB.dropTableIfExists('users')
      .then(() => testDB.createTable('users', UserSchema))
      .then(() => done());
    });

    it('should insert users correctly into the database', (done) => {
      User.create({email: 'chris@chris.com', password: 'cheezits'})
      .then(() => User.find({email: 'chris@chris.com'}))
      .then((user) => {
        expect(user[0].email).to.equal('chris@chris.com');
        done();
      })
      .catch((err) => done(err));
    });
  });

  describe('=============\nBUG PREVENTION', () => {
    beforeEach((done) => {
      testDB.dropTableIfExists('users')
      .then(() => testDB.createTable('users', UserSchema))
      .then(() => done());
    });

    it('should not overwrite empty users', (done) => {
      let existingUserId;
      User.create({})
      .then(() => User.find({}))
      .then((user) => {
        existingUserId = user[0].id;
        return User.updateOrCreate({}, {email: 'asdfes@chris.com', password: 'cheezits'});
      })
      .then(() => User.find({email: 'asdfes@chris.com'}))
      .then((user) => {
        expect(user[0].id).to.not.equal(existingUserId);
        done();
      })
      .catch((err) => done(err));
    });

    it('should update if user exists', (done) => {
      let existingUserId;
      User.create({email: 'test@gmail.com', password: 'yoohoo', coolId: 5})
      .then(() => User.updateOrCreate({coolId: 6, email: 'test@gmail.com'}, {password: 'johnson'}))
      .then(() => User.find({email: 'test@gmail.com'}))
      .then((user) => {
        console.log(user[0]);
        expect(User.decryptModel(user[0]).password).to.equal('johnson');
        done();
      })
      .catch((err) => done(err));
    });

    it('should put in user properly', (done) => {
      let existingUserId;
      User.create({email: 'asdfes@chris.com', password: 'cheezits'})
      .then(() => User.find({email: 'asdfes@chris.com'}))
      .then((user) => console.log(User.decryptModel(user[0])))
      .then(() => done())
      .catch((err) => done(err));

    });

  });

  describe('=============\nMIGRATIONS', () => {

    before((done) => {
      testDB.dropTableIfExists('users')
      .then(() => done());
    });

    it('should create initial tables properly', (done) => {
      testDB.createTable('users', UserSchema)
      .then(() => testDB.hasTable('users'))
      .then((exists) => {
        expect(exists).to.equal(true);
        done();
      })
      .catch((err) => done(err));
    });

    it('should allow migrations when the schema changes', (done) => {
      let newUserSchema = function (user) {
        user.increments('id').primary();
        user.timestamp('created_at').defaultTo(testDB.knex.fn.now());
        user.string('email', 255).unique();
        user.string('password', 100);
        user.string('myNewField', 100);
      };
      tables = [
        { name: 'users', schema: newUserSchema }
      ];
      testDB.migrate(tables)
      .then(() => testDB.db.schema.hasColumn('users', 'myNewField'))
      .then((exists) => {
        expect(exists).to.equal(true);
        done();
      })
      .catch((err) => done(err));
    });
  });
  describe('=============\nSECURE FIELDS', () => {
    it('should encrypt and decrypt a single model properly', (done) => {
      const userToEncrypt = {
        username: 'alex',
        password: 'hello',
        token: 'ilovewerewolves'
      };
      const salt = User.salt(10);
      const encryptedUser = User.encryptModel(userToEncrypt, salt);
      const decryptedUser = User.decryptModel(encryptedUser, salt);
      expect(decryptedUser).to.deep.equal(userToEncrypt);
      done();
    });

    it('should encrypt and decrypt collections properly', (done) => {
      const usersCollectionToEncrypt = [
        {
          username: 'alex',
          password: 'hello',
          token: 'ilovewerewolves'
        },
        {
          username: 'jason',
          password: 'jambo2o81',
          token: 'a./sdjfljas#@#'
        },
        {
          username: 'chris',
          password: 'asdl,j13on@!',
          token: 'ateta3q23kj5lka@#'
        }
      ];
      const encryptedUserCollection = User.encryptCollection(usersCollectionToEncrypt);
      const decryptedUserCollection = User.decryptCollection(encryptedUserCollection);
      expect(decryptedUserCollection).to.deep.equal(usersCollectionToEncrypt);
      done();
    });
  });
});

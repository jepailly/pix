const { expect, knex, databaseBuilder, factory } = require('../../../test-helper');
const faker = require('faker');
const bcrypt = require('bcrypt');
const _ = require('lodash');

const Bookshelf = require('../../../../lib/infrastructure/bookshelf');
const BookshelfUser = require('../../../../lib/infrastructure/data/user');
const userRepository = require('../../../../lib/infrastructure/repositories/user-repository');
const { AlreadyRegisteredEmailError, UserNotFoundError } = require('../../../../lib/domain/errors');
const User = require('../../../../lib/domain/models/User');
const OrganizationAccess = require('../../../../lib/domain/models/OrganizationAccess');
const Organization = require('../../../../lib/domain/models/Organization');
const OrganizationRole = require('../../../../lib/domain/models/OrganizationRole');

describe('Integration | Infrastructure | Repository | UserRepository', () => {

  const userToInsert = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: bcrypt.hashSync('A124B2C3#!', 1),
    cgu: true,
  };

  function _insertUser() {
    return knex('users')
      .insert(userToInsert)
      .returning('id')
      .then((result) => {
        userToInsert.id = result.shift();
        return userToInsert;
      });
  }

  function _insertUserWithOrganizationsAccesses() {
    const organizationToInsert = {
      type: 'PRO',
      name: 'Mon Entreprise',
      code: 'ABCD12',
    };
    const organizationRoleToInsert = { name: 'ADMIN' };
    const organizationAccessToInsert = {};

    let organizationId, organizationRoleId;
    return knex('users').insert(userToInsert)
      .then((insertedUser) => {
        userToInsert.id = insertedUser[0];
        organizationAccessToInsert.userId = insertedUser[0];
        return knex('organizations').insert(organizationToInsert);
      })
      .then((insertedOrganization) => {
        organizationId = insertedOrganization[0];
        organizationToInsert.id = organizationId;
        organizationAccessToInsert.organizationId = organizationId;
        return knex('organization-roles').insert(organizationRoleToInsert);
      })
      .then((insertedOrganizationRole) => {
        organizationRoleId = insertedOrganizationRole[0];
        organizationRoleToInsert.id = organizationRoleId;
        organizationAccessToInsert.organizationRoleId = organizationRoleId;
        return knex('organizations-accesses').insert(organizationAccessToInsert);
      })
      .then((insertedOrganizationAccess) => {
        organizationAccessToInsert.id = insertedOrganizationAccess[0];
        return {
          userInDB: userToInsert,
          organizationInDB: organizationToInsert,
          organizationRoleInDB: organizationRoleToInsert,
          organizationAccessInDB: organizationAccessToInsert
        };
      });
  }

  describe('find user', () => {

    describe('#findUserById', () => {

      let userInDb;

      beforeEach(() => {
        return _insertUser().then((insertedUser) => userInDb = insertedUser);
      });

      afterEach(() => {
        return knex('users').delete();
      });

      describe('Success management', () => {

        it('should find a user by provided id', () => {
          return userRepository.findUserById(userInDb.id)
            .then((foundedUser) => {
              expect(foundedUser).to.exist;
              expect(foundedUser).to.be.an('object');
              expect(foundedUser.attributes.email).to.equal(userInDb.email);
              expect(foundedUser.attributes.firstName).to.equal(userInDb.firstName);
              expect(foundedUser.attributes.lastName).to.equal(userInDb.lastName);
            });
        });

        it('should handle a rejection, when user id is not found', () => {
          const inexistenteId = 10093;
          return userRepository.findUserById(inexistenteId)
            .catch((err) => {
              expect(err).to.be.an.instanceof(BookshelfUser.NotFoundError);
            });
        });
      });
    });

    describe('#findByEmail', () => {

      let userInDb;

      beforeEach(() => {
        return _insertUser().then((insertedUser) => userInDb = insertedUser);
      });

      afterEach(() => {
        return knex('users').delete();
      });

      it('should be a function', () => {
        // then
        expect(userRepository.findByEmail).to.be.a('function');
      });

      it('should handle a rejection, when user id is not found', () => {
        // given
        const emailThatDoesNotExist = 10093;

        // when
        const promise = userRepository.findByEmail(emailThatDoesNotExist);

        // then
        return promise.catch((err) => {
          expect(err).to.be.instanceof(Bookshelf.Model.NotFoundError);
        });
      });

      it('should return a domain user when found', () => {
        // when
        const promise = userRepository.findByEmail(userInDb.email);

        // then
        return promise.then((user) => {
          expect(user.email).to.equal(userInDb.email);
        });
      });
    });

    describe('#findByEmailWithRoles', () => {

      let userInDB, organizationInDB, organizationRoleInDB, organizationAccessInDB;

      beforeEach(() => {
        return _insertUserWithOrganizationsAccesses()
          .then((persistedEntities) =>
            ({ userInDB, organizationInDB, organizationRoleInDB, organizationAccessInDB } = persistedEntities));
      });

      afterEach(() => {
        return knex('organizations-accesses').delete()
          .then(() => {
            return Promise.all([
              knex('organizations').delete(),
              knex('users').delete(),
              knex('organization-roles').delete()
            ]);
          });
      });

      it('should return user informations for the given email', () => {
        // given
        const expectedUser = new User(userInDB);

        // when
        const promise = userRepository.findByEmailWithRoles(userInDB.email);

        // then
        return promise.then((user) => {
          expect(user).to.be.an.instanceof(User);
          expect(user.id).to.equal(expectedUser.id);
          expect(user.firstName).to.equal(expectedUser.firstName);
          expect(user.lastName).to.equal(expectedUser.lastName);
          expect(user.email).to.equal(expectedUser.email);
          expect(user.password).to.equal(expectedUser.password);
          expect(user.cgu).to.equal(expectedUser.cgu);
        });
      });

      it('should return organization access associated to the user', () => {
        // when
        const promise = userRepository.findByEmailWithRoles(userToInsert.email);

        // then
        return promise.then((user) => {

          expect(user.organizationAccesses).to.be.an('array');

          const firstOrganizationAccess = user.organizationAccesses[0];
          expect(firstOrganizationAccess).to.be.an.instanceof(OrganizationAccess);
          expect(firstOrganizationAccess.id).to.equal(organizationAccessInDB.id);

          const accessibleOrganization = firstOrganizationAccess.organization;
          expect(accessibleOrganization).to.be.an.instanceof(Organization);
          expect(accessibleOrganization.id).to.equal(organizationInDB.id);
          expect(accessibleOrganization.code).to.equal(organizationInDB.code);
          expect(accessibleOrganization.name).to.equal(organizationInDB.name);
          expect(accessibleOrganization.type).to.equal(organizationInDB.type);

          const associatedRole = firstOrganizationAccess.organizationRole;
          expect(associatedRole).to.be.an.instanceof(OrganizationRole);
          expect(associatedRole.id).to.equal(organizationRoleInDB.id);
          expect(associatedRole.name).to.equal(organizationRoleInDB.name);
        });
      });

      it('should reject with a UserNotFound error when no user was found with this email', () => {
        // given
        const unusedEmail = 'kikou@pix.fr';

        // when
        const promise = userRepository.findByEmailWithRoles(unusedEmail);

        // then
        return expect(promise).to.be.rejectedWith(UserNotFoundError);
      });
    });

  });

  describe('get user', () => {

    describe('#get', () => {

      let userInDb;

      beforeEach(() => {
        return _insertUser().then((insertedUser) => userInDb = insertedUser);
      });

      afterEach(() => {
        return knex('users').delete();
      });

      it('should return the found user', () => {
        // when
        const promise = userRepository.get(userInDb.id);

        // then
        return promise.then((user) => {
          expect(user).to.be.an.instanceOf(User);
          expect(user.id).to.equal(userInDb.id);
          expect(user.firstName).to.equal(userInDb.firstName);
          expect(user.lastName).to.equal(userInDb.lastName);
          expect(user.email).to.equal(userInDb.email);
          expect(user.cgu).to.be.true;
          expect(user.pixRoles).to.be.an('array');
        });
      });

      it('should return a UserNotFoundError if no user is found', () => {
        // given
        const nonExistentUserId = 678;

        // when
        const promise = userRepository.get(nonExistentUserId);

        // then
        return expect(promise).to.be.rejectedWith(UserNotFoundError);
      });
    });

    describe('#getWithOrganizationAccesses', () => {
      let userInDB, organizationInDB, organizationRoleInDB, organizationAccessInDB;

      beforeEach(() => {
        return _insertUserWithOrganizationsAccesses()
          .then((persistedEntities) =>
            ({ userInDB, organizationInDB, organizationRoleInDB, organizationAccessInDB } = persistedEntities));
      });

      afterEach(() => {
        return knex('organizations-accesses').delete()
          .then(() => {
            return Promise.all([
              knex('organizations').delete(),
              knex('users').delete(),
              knex('organization-roles').delete()
            ]);
          });
      });

      it('should return user for the given id', () => {
        // given
        const expectedUser = new User(userInDB);

        // when
        const promise = userRepository.getWithOrganizationAccesses(userInDB.id);

        // then
        return promise.then((user) => {
          expect(user).to.be.an.instanceof(User);
          expect(user.id).to.equal(expectedUser.id);
          expect(user.firstName).to.equal(expectedUser.firstName);
          expect(user.lastName).to.equal(expectedUser.lastName);
          expect(user.email).to.equal(expectedUser.email);
          expect(user.password).to.equal(expectedUser.password);
          expect(user.cgu).to.equal(expectedUser.cgu);
        });
      });

      it('should return organization access associated to the user', () => {
        // when
        const promise = userRepository.getWithOrganizationAccesses(userInDB.id);

        // then
        return promise.then((user) => {

          expect(user.organizationAccesses).to.be.an('array');

          const organizationAccess = user.organizationAccesses[0];
          expect(organizationAccess).to.be.an.instanceof(OrganizationAccess);
          expect(organizationAccess.id).to.equal(organizationAccessInDB.id);

          const accessibleOrganization = organizationAccess.organization;
          expect(accessibleOrganization).to.be.an.instanceof(Organization);
          expect(accessibleOrganization.id).to.equal(organizationInDB.id);
          expect(accessibleOrganization.code).to.equal(organizationInDB.code);
          expect(accessibleOrganization.name).to.equal(organizationInDB.name);
          expect(accessibleOrganization.type).to.equal(organizationInDB.type);

          const associatedRole = organizationAccess.organizationRole;
          expect(associatedRole).to.be.an.instanceof(OrganizationRole);
          expect(associatedRole.id).to.equal(organizationRoleInDB.id);
          expect(associatedRole.name).to.equal(organizationRoleInDB.name);
        });
      });

      it('should reject with a UserNotFound error when no user was found with the given id', () => {
        // given
        const unknownUserId = 666;

        // when
        const promise = userRepository.getWithOrganizationAccesses(unknownUserId);

        // then
        return expect(promise).to.be.rejectedWith(UserNotFoundError);
      });
    });

  });

  describe('#create', () => {

    afterEach(() => {
      return knex('users').delete();
    });

    it('should save the user', () => {
      // given
      const email = 'my-email-to-save@example.net';
      const user = new User({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: email,
        password: 'Pix1024#',
        cgu: true,
      });

      // when
      const promise = userRepository.create(user);

      // then
      return promise
        .then(() => knex('users').select())
        .then((usersSaved) => {
          expect(usersSaved).to.have.lengthOf(1);
        });
    });

    it('should return a Domain User object', () => {
      // given
      const email = 'my-email-to-save@example.net';
      const user = new User({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: email,
        password: 'Pix1024#',
        cgu: true,
      });

      // when
      const promise = userRepository.create(user);

      // then
      return promise.then((userSaved) => {
        expect(userSaved).to.be.an.instanceOf(User);
        expect(userSaved.firstName).to.equal(user.firstName);
        expect(userSaved.lastName).to.equal(user.lastName);
        expect(userSaved.email).to.equal(user.email);
        expect(userSaved.cgu).to.equal(user.cgu);
      });
    });
  });

  describe('#isEmailAvailable', () => {

    let userInDb;

    beforeEach(() => {
      return _insertUser().then((insertedUser) => userInDb = insertedUser);
    });

    afterEach(() => {
      return knex('users').delete();
    });

    it('should return the email when the email is not registered', () => {
      // when
      const promise = userRepository.isEmailAvailable('email@example.net');

      // then
      return promise.then((email) => {
        expect(email).to.equal('email@example.net');
      });
    });

    it('should reject an AlreadyRegisteredEmailError when it already exists', () => {
      // when
      const promise = userRepository.isEmailAvailable(userInDb.email);

      // then
      return promise.catch((err) => {
        expect(err).to.be.an.instanceOf(AlreadyRegisteredEmailError);
      });

    });

  });

  describe('#updatePassword', () => {

    let userInDb;

    beforeEach(() => {
      return _insertUser().then((insertedUser) => userInDb = insertedUser);
    });

    afterEach(() => {
      return knex('users').delete();
    });

    it('should save the user', () => {
      // given
      const newPassword = '1235Pix!';

      // when
      const promise = userRepository.updatePassword(userInDb.id, newPassword);

      // then
      return promise
        .then((updatedUser) => {
          expect(updatedUser).to.be.an.instanceOf(User);
          expect(updatedUser.password).to.equal(newPassword);
        });
    });
  });

  describe('#updateUser', () => {

    let userToUpdate;

    beforeEach(async () => {
      userToUpdate = factory.buildUser({ pixOrgaTermsOfServiceAccepted: true });
      databaseBuilder.factory.buildUser({ id: userToUpdate.id, pixOrgaTermsOfServiceAccepted: false });
      await databaseBuilder.commit();
    });

    afterEach(async () => {
      await databaseBuilder.clean();
    });

    it('should update pixOrgaTermsOfServiceAccepted field', () => {
      // when
      const promise = userRepository.updateUser(userToUpdate);

      // then
      return promise.then((user) => {
        expect(user).be.instanceOf(User);
        expect(user.pixOrgaTermsOfServiceAccepted).to.be.true;
        knex('users').select().where({ id: userToUpdate.id })
          .then((usersSaved) => {
            expect(Boolean(usersSaved[0].pixOrgaTermsOfServiceAccepted)).to.be.true;
          });
      });
    });
  });

  describe('#find', () => {

    context('when there are users in the database', () => {

      beforeEach(() => {
        _.times(3, databaseBuilder.factory.buildUser);
        return databaseBuilder.commit();
      });

      afterEach(() => {
        return databaseBuilder.clean();
      });

      it('should return an Array of Users', async () => {
        // given
        const filters = {};
        const pagination = { page: 1, pageSize: 10 };

        // when
        const promise = userRepository.find(filters, pagination);

        // then
        return promise.then((matchingUsers) => {
          expect(matchingUsers).to.exist;
          expect(matchingUsers).to.have.lengthOf(3);
          expect(matchingUsers[0]).to.be.an.instanceOf(User);
        });
      });

    });

    context('when there are lots of users (> 10) in the database', () => {

      beforeEach(() => {
        _.times(12, databaseBuilder.factory.buildUser);
        return databaseBuilder.commit();
      });

      afterEach(() => {
        return databaseBuilder.clean();
      });

      it('should return paginated matching users', async () => {
        // given
        const filters = {};
        const pagination = { page: 1, pageSize: 3 };

        // when
        const promise = userRepository.find(filters, pagination);

        // then
        return promise.then((matchingUsers) => {
          expect(matchingUsers).to.have.lengthOf(3);
        });
      });
    });

    context('when there are multiple users matching the same "first name" search pattern', () => {

      beforeEach(() => {
        databaseBuilder.factory.buildUser({ firstName: 'Son Gohan' });
        databaseBuilder.factory.buildUser({ firstName: 'Son Goku' });
        databaseBuilder.factory.buildUser({ firstName: 'Son Goten' });
        databaseBuilder.factory.buildUser({ firstName: 'Vegeta' });
        databaseBuilder.factory.buildUser({ firstName: 'Piccolo' });
        return databaseBuilder.commit();
      });

      afterEach(() => {
        return databaseBuilder.clean();
      });

      it('should return only users matching "first name" if given in filters', async () => {
        // given
        const filters = { firstName: 'Go' };
        const pagination = { page: 1, pageSize: 10 };

        // when
        const promise = userRepository.find(filters, pagination);

        // then
        return promise.then((matchingUsers) => {
          expect(matchingUsers).to.have.lengthOf(3);
        });
      });
    });

    context('when there are multiple users matching the same "last name" search pattern', () => {

      beforeEach(() => {
        databaseBuilder.factory.buildUser({ firstName: 'Anakin', lastName: 'Skywalker' });
        databaseBuilder.factory.buildUser({ firstName: 'Luke', lastName: 'Skywalker' });
        databaseBuilder.factory.buildUser({ firstName: 'Leia', lastName: 'Skywalker' });
        databaseBuilder.factory.buildUser({ firstName: 'Han', lastName: 'Solo' });
        databaseBuilder.factory.buildUser({ firstName: 'Ben', lastName: 'Solo' });
        return databaseBuilder.commit();
      });

      afterEach(() => {
        return databaseBuilder.clean();
      });

      it('should return only users matching "last name" if given in filters', async () => {
        // given
        const filters = { lastName: 'walk' };
        const pagination = { page: 1, pageSize: 10 };

        // when
        const promise = userRepository.find(filters, pagination);

        // then
        return promise.then((matchingUsers) => {
          expect(matchingUsers).to.have.lengthOf(3);
        });
      });
    });

    context('when there are multiple users matching the same "email" search pattern', () => {

      beforeEach(() => {
        databaseBuilder.factory.buildUser({ email: 'playpus@pix.fr' });
        databaseBuilder.factory.buildUser({ email: 'panda@pix.fr' });
        databaseBuilder.factory.buildUser({ email: 'otter@pix.fr' });
        databaseBuilder.factory.buildUser({ email: 'playpus@example.net' });
        databaseBuilder.factory.buildUser({ email: 'panda@example.net' });
        return databaseBuilder.commit();
      });

      afterEach(() => {
        return databaseBuilder.clean();
      });

      it('should return only users matching "email" if given in filters', async () => {
        // given
        const filters = { email: 'pix.fr' };
        const pagination = { page: 1, pageSize: 10 };

        // when
        const promise = userRepository.find(filters, pagination);

        // then
        return promise.then((matchingUsers) => {
          expect(matchingUsers).to.have.lengthOf(3);
        });
      });
    });

    context('when there are multiple users matching the fields "first name", "last name" and "email" search pattern', () => {

      beforeEach(() => {
        // Matching users
        databaseBuilder.factory.buildUser({ firstName: 'fn_ok_1', lastName: 'ln_ok_1', email: 'email_ok_1@mail.com' });
        databaseBuilder.factory.buildUser({ firstName: 'fn_ok_2', lastName: 'ln_ok_2', email: 'email_ok_2@mail.com' });
        databaseBuilder.factory.buildUser({ firstName: 'fn_ok_3', lastName: 'ln_ok_3', email: 'email_ok_3@mail.com' });

        // Unmatching users
        databaseBuilder.factory.buildUser({ firstName: 'fn_ko_4', lastName: 'ln_ok_4', email: 'email_ok_4@mail.com' });
        databaseBuilder.factory.buildUser({ firstName: 'fn_ok_5', lastName: 'ln_ko_5', email: 'email_ok_5@mail.com' });
        databaseBuilder.factory.buildUser({ firstName: 'fn_ok_6', lastName: 'ln_ok_6', email: 'email_ko_6@mail.com' });

        return databaseBuilder.commit();
      });

      afterEach(() => {
        return databaseBuilder.clean();
      });

      it('should return only users matching "first name" AND "last name" AND "email" if given in filters', async () => {
        // given
        const filters = { firstName: 'fn_ok', lastName: 'ln_ok', email: 'email_ok' };
        const pagination = { page: 1, pageSize: 10 };

        // when
        const promise = userRepository.find(filters, pagination);

        // then
        return promise.then((matchingUsers) => {
          expect(matchingUsers).to.have.lengthOf(3);
        });
      });
    });
  });

  describe('#count', () => {

    context('when there are multiple users in database', () => {

      beforeEach(() => {
        _.times(8, databaseBuilder.factory.buildUser);
        return databaseBuilder.commit();
      });

      afterEach(() => {
        return databaseBuilder.clean();
      });

      it('should return the total number of Users when there is no filter', async () => {
        // given
        const filters = {};

        // when
        const promise = userRepository.count(filters);

        // then
        return promise.then((totalMatchingUsers) => {
          expect(totalMatchingUsers).to.equal(8);
        });
      });
    });

    context('when there are multiple users matching the same "email" search pattern', () => {

      beforeEach(() => {
        databaseBuilder.factory.buildUser({ email: 'playpus@pix.fr' });
        databaseBuilder.factory.buildUser({ email: 'panda@pix.fr' });
        databaseBuilder.factory.buildUser({ email: 'otter@pix.fr' });
        databaseBuilder.factory.buildUser({ email: 'playpus@example.net' });
        databaseBuilder.factory.buildUser({ email: 'panda@example.net' });
        return databaseBuilder.commit();
      });

      afterEach(() => {
        return databaseBuilder.clean();
      });

      it('should return the total number of matching Users', async () => {
        // given
        const filters = { email: 'pix.fr' };

        // when
        const promise = userRepository.count(filters);

        // then
        return promise.then((totalMatchingUsers) => {
          expect(totalMatchingUsers).to.equal(3);
        });
      });
    });
  });
});

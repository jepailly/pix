const _ = require('lodash');

const { expect, knex } = require('../../../test-helper');
const certificationCourseRepository = require('../../../../lib/infrastructure/repositories/certification-course-repository');
const { NotFoundError } = require('../../../../lib/domain/errors');

const CertificationCourse = require('../../../../lib/domain/models/CertificationCourse');

describe('Integration | Repository | Certification Course', function() {

  const courseId = 20;
  const associatedAssessment = {
    id: 7,
    courseId: courseId,
    userId: 1
  };

  const certificationCourse = {
    id: courseId,
    userId: 1,
    completedAt: null,
    firstName: 'Timon',
    lastName: 'De La Havane',
    birthdate: '14/08/1993',
    birthplace: 'Cuba',
    sessionId: 'HakunaMatata',
    isPublished: true,
  };

  const certificationChallenges = [
    {
      id: 1,
      courseId: courseId,
      challengeId: 'recChallenge1'
    },
    {
      id: 2,
      courseId: courseId,
      challengeId: 'recChallenge2'
    },
    {
      id: 3,
      courseId: 19,
      challengeId: 'recChallenge3'
    }
  ];

  describe('#changeCompletionDate', () => {

    before(() => {
      return knex('certification-courses').delete();
    });

    beforeEach(() => {
      return knex('certification-courses').insert(certificationCourse);
    });

    afterEach(() => {
      return knex('certification-courses').delete();
    });

    it('should update completedAt of the certificationCourse if one date is passed', () => {
      // when
      const promise = certificationCourseRepository.changeCompletionDate(courseId, '2018-01-01');

      // then
      return promise.then(() => knex('certification-courses').first('id', 'completedAt'))
        .then((certificationCourse) => {
          expect(certificationCourse.completedAt).to.equal('2018-01-01');
        });
    });
  });

  describe('#get', function() {

    beforeEach(() => {
      return Promise.all([
        knex('certification-courses').insert(certificationCourse),
        knex('assessments').insert(associatedAssessment),
        knex('certification-challenges').insert(certificationChallenges),
      ]);
    });

    afterEach(() => {
      return Promise.all([
        knex('certification-courses').delete(),
        knex('assessments').delete(),
        knex('certification-challenges').delete()
      ]);
    });

    context('When the certification course exists', () => {
      it('should retrieve certification course informations', function() {
        // when
        const promise = certificationCourseRepository.get(courseId);

        // then
        return promise.then((certificationCourse) => {
          expect(certificationCourse.id).to.equal(courseId);
          expect(certificationCourse.type).to.equal('CERTIFICATION');
          expect(certificationCourse.completedAt).to.equal(null);
          expect(certificationCourse.firstName).to.equal('Timon');
          expect(certificationCourse.lastName).to.equal('De La Havane');
          expect(certificationCourse.birthdate).to.equal('14/08/1993');
          expect(certificationCourse.birthplace).to.equal('Cuba');
          expect(certificationCourse.sessionId).to.equal('HakunaMatata');
          expect(certificationCourse.isPublished).to.be.ok;
        });
      });

      it('should retrieve associated assessment and challenges with the certification course', function() {
        // when
        const promise = certificationCourseRepository.get(20);

        // then
        return promise.then((certificationCourse) => {
          expect(certificationCourse.assessment.id).to.equal(7);
          expect(certificationCourse.challenges.length).to.equal(2);
        });
      });
    });

    context('When the certification course does not exist', () => {
      it('should retrieve a NotFoundError Error', function() {
        // when
        const promise = certificationCourseRepository.get(4);

        // then
        return expect(promise).to.be.rejectedWith(NotFoundError);
      });
    });

  });

  describe('#update', function() {

    const certificationCourse = {
      id: 1,
      firstName: 'Freezer',
      lastName: 'The all mighty',
      birthplace: 'Namek',
      birthdate: '24/10/1989',
      externalId: 'xenoverse2'
    };

    beforeEach(() => {
      return knex('certification-courses').insert(certificationCourse);
    });

    afterEach(() => {
      return knex('certification-courses').delete();
    });

    it('should insert in the certification course table', function() {
      // given
      const modifiedCertifcationCourse = {
        id: 1,
        completedAt: null,
        updatedAt: '2018-03-07 14:38:11',
        userId: null,
        firstName: 'Freezer',
        lastName: 'The all mighty',
        birthplace: 'Namek',
        birthdate: '24/10/1989',
        sessionId: null,
        isPublished: 0,
        externalId: ''
      };

      // when
      const promise = certificationCourseRepository.update(modifiedCertifcationCourse);

      // then
      return promise.then(() => knex('certification-courses').where({ id: 1 }).first())
        .then((certificationCourseInDatabase) => {
          const certificationCourseInDatabaseWithoutCreationDate = _.omit(certificationCourseInDatabase, ['createdAt']);
          expect(certificationCourseInDatabaseWithoutCreationDate).to.be.deep.equal(modifiedCertifcationCourse);
        });
    });

    it('should assert the certification course has been updated', function() {
      // given
      const modifiedCertifcationCourse = {
        id: 1,
        firstName: 'Freezer',
        lastName: 'The all mighty',
        birthplace: 'Namek',
        birthdate: '24/10/1989',
        externalId: 'Death Beam'
      };

      // when
      const promise = certificationCourseRepository.update(modifiedCertifcationCourse);

      // then
      return promise.then((certificationCourseUpdated) => {
        expect(certificationCourseUpdated).to.be.instanceOf(CertificationCourse);
        expect(certificationCourseUpdated.id).to.equal(1);
        expect(certificationCourseUpdated.firstName).to.equal('Freezer');
        expect(certificationCourseUpdated.lastName).to.equal('The all mighty');
        expect(certificationCourseUpdated.birthplace).to.equal('Namek');
        expect(certificationCourseUpdated.birthdate).to.equal('24/10/1989');
        expect(certificationCourseUpdated.externalId).to.equal('Death Beam');
      });
    });

    it('should return a NotFoundError when ID doesnt exist', function() {
      // given
      const modifiedCertifcationCourse = {
        id: 2,
        firstName: 'Freezer',
        lastName: 'The all mighty',
        birthplace: 'Namek',
        birthdate: '24/10/1989',
      };

      // when
      const promise = certificationCourseRepository.update(modifiedCertifcationCourse);

      // then
      return expect(promise).to.be.rejectedWith(NotFoundError);

    });

  });
});


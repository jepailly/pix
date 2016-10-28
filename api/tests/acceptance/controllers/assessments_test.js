'use strict';

const server = require('../../../server');
const Assessment = require('../../../app/models/data/assessment');

describe('API | Assessments', function () {

  before(function (done) {
    knex.migrate.latest().then(() => {
      knex.seed.run().then(() => {
        nock('https://api.airtable.com')
          .get('/v0/test-base/Tests/assessment_id')
          .times(4)
          .reply(200, {
            "id": "assessment_id",
            "fields": {
              // a bunch of fields
              "\u00c9preuves": [
                "recLt9uwa2dR3IYpi",
                "recB9k5U9GUCSVTuP",
              ],
            },
          }
        );
        nock('https://api.airtable.com')
          .get('/v0/test-base/Epreuves/recLt9uwa2dR3IYpi')
          .times(3)
          .reply(200, {
            "id": "recLt9uwa2dR3IYpi",
            "fields": {
              // a bunch of fields
            },
          }
        );
        nock('https://api.airtable.com')
          .get('/v0/test-base/Epreuves/recB9k5U9GUCSVTuP')
          .reply(200, {
            "id": "recB9k5U9GUCSVTuP",
            "fields": {
              // a bunch of fields
            },
          }
        );
        done();
      });
    });
  });

  after(function (done) {
    server.stop(done);
  });

  describe('POST /api/assessments', function () {

    const options = {
      method: "POST", url: "/api/assessments", payload: {
        data: {
          type: "assessment",
          attributes: {
            "user-name": 'Jon Snow',
            "user-email": 'jsnow@winterfell.got'
          },
          relationships: {
            course: {
              data: {
                type: 'course',
                id: 'course_id'
              }
            }
          }
        }
      }
    };

    it("should return 201 HTTP status code", function (done) {
      server.injectThen(options).then((response) => {
        expect(response.statusCode).to.equal(201);
        done();
      });
    });

    it("should return application/json", function (done) {
      server.injectThen(options).then((response) => {
        const contentType = response.headers['content-type'];
        expect(contentType).to.contain('application/json');
        done();
      });
    });

    it("should add a new assessment into the database", function (done) {
      // given
      Assessment.count().then(function (beforeAssessmentsNumber) {
        // when
        server.injectThen(options).then((response) => {
          Assessment.count().then(function (afterAssessmentsNumber) {
            // then
            expect(afterAssessmentsNumber).to.equal(beforeAssessmentsNumber + 1);
            done();
          });
        });
      });
    });

    it("should persist the given course ID and user ID", function (done) {

      // when
      server.injectThen(options).then((response) => {

        new Assessment({ id: response.result.data.id })
          .fetch()
          .then(function (model) {
            expect(model.get('courseId')).to.equal(options.payload.data.relationships.course.data.id);
            expect(model.get('userName')).to.equal(options.payload.data.attributes["user-name"]);
            expect(model.get('userEmail')).to.equal(options.payload.data.attributes["user-email"]);
            done();
          });

      });
    });

    it("should return persisted assessement", function (done) {

      // when
      server.injectThen(options).then((response) => {
        const assessment = response.result.data;

        // then
        expect(assessment.id).to.exist;
        expect(assessment.attributes["user-id"]).to.equal(options.payload.data.attributes["user-id"]);
        expect(assessment.attributes["user-name"]).to.equal(options.payload.data.attributes["user-name"]);
        expect(assessment.attributes["user-email"]).to.equal(options.payload.data.attributes["user-email"]);
        expect(assessment.relationships.course.data.id).to.equal(options.payload.data.relationships.course.data.id);

        done();
      });
    });

  });

  describe('GET /api/assessments/:assessment_id/next', function () {

    const assessmentData = {
      method: "POST", url: "/api/assessments", payload: {
        data: {
          type: "assessment",
          attributes: {
            "user-name": 'Jon Snow',
            "user-email": 'jsnow@winterfell.got'
          },
          relationships: {
            course: {
              data: {
                type: 'course',
                id: 'assessment_id'
              }
            }
          }
        }
      }
    };

    it("should return 200 HTTP status code", function (done) {
      server.injectThen(assessmentData).then((response) => {
        const challengeData = { method: "GET", url: "/api/assessments/" + response.result.data.id + "/next" };
        server.injectThen(challengeData).then((response) => {
          expect(response.statusCode).to.equal(200);
          done();
        });
      });
    });

    it("should return application/json", function (done) {
      server.injectThen(assessmentData).then((response) => {
        const challengeData = { method: "GET", url: "/api/assessments/" + response.result.data.id + "/next" };
        server.injectThen(challengeData).then((response) => {
          const contentType = response.headers['content-type'];
          expect(contentType).to.contain('application/json');
          done();
        });
      });
    });

    it("should return the first challenge if no challenge specified", function (done) {
      server.injectThen(assessmentData).then((response) => {
        const challengeData = { method: "GET", url: "/api/assessments/" + response.result.data.id + "/next" };
        server.injectThen(challengeData).then((response) => {
          expect(response.result.data.id).to.equal('recLt9uwa2dR3IYpi');
          done();
        });
      });
    });

    it("should return the next challenge otherwise", function (done) {
      server.injectThen(assessmentData).then((response) => {
        const challengeData = { method: "GET", url: "/api/assessments/" + response.result.data.id + "/next/recLt9uwa2dR3IYpi" };
        server.injectThen(challengeData).then((response) => {
          expect(response.result.data.id).to.equal('recB9k5U9GUCSVTuP');
          done();
        });
      });
    });

  });

});

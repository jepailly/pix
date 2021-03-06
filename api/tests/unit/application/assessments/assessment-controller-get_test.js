const { expect, sinon } = require('../../../test-helper');

const Boom = require('boom');

const assessmentController = require('../../../../lib/application/assessments/assessment-controller');
const assessmentRepository = require('../../../../lib/infrastructure/repositories/assessment-repository');
const assessmentService = require('../../../../lib/domain/services/assessment-service');
const assessmentSerializer = require('../../../../lib/infrastructure/serializers/jsonapi/assessment-serializer');

const { NotFoundError } = require('../../../../lib/domain/errors');

describe('Unit | Controller | assessment-controller', () => {

  describe('#get', () => {

    let sandbox;

    const ASSESSMENT_ID = 12;
    const reply = sinon.spy();

    let request;

    beforeEach(() => {
      request = { params: { id: ASSESSMENT_ID } };

      sandbox = sinon.sandbox.create();

      sandbox.stub(assessmentService, 'fetchAssessment').resolves();
      sandbox.stub(assessmentSerializer, 'serialize');
      sandbox.stub(assessmentRepository, 'get');
    });

    afterEach(() => {

      sandbox.restore();

    });

    it('checks sanity', () => {
      expect(assessmentController.get).to.exist;
    });

    it('should call AssessmentService#fetchAssessment with request param', () => {
      // given
      request = { params: { id: 1234567 } };

      // when
      assessmentController.get(request, reply);

      // then
      sinon.assert.calledWithExactly(assessmentService.fetchAssessment, 1234567);
    });

    it('should return a NotFound error when the assessment does not exist', () => {
      // given
      const expectedError = { error: 'Expected API Return 404' };

      const boomNotFound = sinon.stub(Boom, 'notFound').returns(expectedError);
      const getScoredError = new NotFoundError('Expected API Return 404');
      assessmentService.fetchAssessment.rejects(getScoredError);

      // when
      const promise = assessmentController.get(request, reply);

      // then
      return promise.then(() => {
        boomNotFound.restore();
        sinon.assert.calledWithExactly(boomNotFound, getScoredError);

      });
    });

    it('should return a Bad Implementation error when we cannot retrieve the score', () => {
      // given
      const expectedError = { error: 'Expected API Return ' };

      const boomBadImplementationStub = sinon.stub(Boom, 'badImplementation').returns(expectedError);
      assessmentService.fetchAssessment.rejects(new Error('Expected Error Message'));

      // when
      const promise = assessmentController.get(request, reply);

      // then
      return promise.then(() => {
        boomBadImplementationStub.restore();
        sinon.assert.calledWithExactly(reply, expectedError);
      });
    });

    it('should reply with the scored assessment', () => {
      // given
      const serializedAssessment = { data: { type: 'Assessment' } };
      const scoredAssessment = { id: 'assessment_id' };
      const expectedSerializerArgs = {
        assessmentPix: scoredAssessment,
        skills: {}
      };

      assessmentSerializer.serialize.returns(serializedAssessment);
      assessmentService.fetchAssessment.resolves(expectedSerializerArgs);

      // when
      const promise = assessmentController.get(request, reply);

      // then
      return promise.then(() => {
        sinon.assert.calledWithExactly(assessmentSerializer.serialize, scoredAssessment);
        sinon.assert.calledWithExactly(reply, serializedAssessment);
      });
    });

  });

});

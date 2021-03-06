const { expect, sinon, factory } = require('../../../test-helper');
const JSONAPIError = require('jsonapi-serializer').Error;

const BookshelfSnapshot = require('../../../../lib/infrastructure/data/snapshot');
const Organization = require('../../../../lib/domain/models/Organization');
const organizationController = require('../../../../lib/application/organizations/organization-controller');
const snapshotRepository = require('../../../../lib/infrastructure/repositories/snapshot-repository');
const organizationSerializer = require('../../../../lib/infrastructure/serializers/jsonapi/organization-serializer');
const organizationService = require('../../../../lib/domain/services/organization-service');
const snapshotSerializer = require('../../../../lib/infrastructure/serializers/jsonapi/snapshot-serializer');
const validationErrorSerializer = require('../../../../lib/infrastructure/serializers/jsonapi/validation-error-serializer');
const bookshelfUtils = require('../../../../lib/infrastructure/utils/bookshelf-utils');
const { EntityValidationError, NotFoundError } = require('../../../../lib/domain/errors');
const { InfrastructureError } = require('../../../../lib/infrastructure/errors');
const logger = require('../../../../lib/infrastructure/logger');
const usecases = require('../../../../lib/domain/usecases');
const campaignSerializer = require('../../../../lib/infrastructure/serializers/jsonapi/campaign-serializer');
const targetProfileSerializer = require('../../../../lib/infrastructure/serializers/jsonapi/target-profile-serializer');

describe('Unit | Application | Organizations | organization-controller', () => {

  let sandbox;
  let codeStub;
  let request;
  let replyStub;

  describe('#getOrganizationDetails', () => {

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(usecases, 'getOrganizationDetails');
      sandbox.stub(organizationSerializer, 'serialize');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call the usecase and serialize the response', () => {
      // given
      const organizationId = 1234;
      request = { params: { id: organizationId } };
      replyStub = () => {
        return {
          code() {
          }
        };
      };
      usecases.getOrganizationDetails.resolves();
      organizationSerializer.serialize.returns();

      // when
      const promise = organizationController.getOrganizationDetails(request, replyStub);

      // then
      return promise.then(() => {
        expect(usecases.getOrganizationDetails).to.have.been.calledOnce;
        expect(usecases.getOrganizationDetails).to.have.been.calledWith({ organizationId });
        expect(organizationSerializer.serialize).to.have.been.calledOnce;
      });
    });
  });

  describe('#create', () => {

    beforeEach(() => {
      codeStub = sinon.stub();
      replyStub = sinon.stub().returns({ code: codeStub });

      sandbox = sinon.sandbox.create();

      sandbox.stub(usecases, 'createOrganization');
      sandbox.stub(organizationSerializer, 'serialize');

      request = {
        payload: {
          data: {
            attributes: {
              name: 'Acme',
              type: 'PRO',
            }
          }
        }
      };
    });

    afterEach(() => {
      sandbox.restore();
    });

    context('successful case', () => {

      let savedOrganization;
      let serializedOrganization;

      beforeEach(() => {

        savedOrganization = factory.buildOrganization();
        serializedOrganization = { foo: 'bar' };

        usecases.createOrganization.resolves(savedOrganization);
        organizationSerializer.serialize.withArgs(savedOrganization).returns(serializedOrganization);
      });

      it('should create an organization', () => {
        // when
        const promise = organizationController.create(request, replyStub);

        // then
        return promise.then(() => {
          expect(usecases.createOrganization).to.have.been.calledOnce;
          expect(usecases.createOrganization).to.have.been.calledWith({ name: 'Acme', type: 'PRO' });
        });
      });

      it('should serialized organization into JSON:API', () => {
        // when
        const promise = organizationController.create(request, replyStub);

        // then
        return promise.then(() => {
          expect(organizationSerializer.serialize).to.have.been.calledOnce;
          expect(organizationSerializer.serialize).to.have.been.calledWith(savedOrganization);
        });
      });

      it('should return the serialized organization', () => {
        // when
        const promise = organizationController.create(request, replyStub);

        // then
        return promise.then(() => {
          expect(replyStub).to.have.been.calledWith(serializedOrganization);
        });
      });
    });

    context('error cases', () => {

      let error;

      context('when an input params validation error occurred', () => {

        beforeEach(() => {
          const expectedValidationError = new EntityValidationError({
            invalidAttributes: [
              {
                attribute: 'name',
                message: 'Le nom n’est pas renseigné.',
              },
              {
                attribute: 'type',
                message: 'Le type n’est pas renseigné.',
              },
            ]
          });

          error = new EntityValidationError(expectedValidationError);
          usecases.createOrganization.rejects(error);
        });

        it('should return an error with HTTP status code 422 when a validation error occurred', () => {
          // given
          const jsonApiValidationErrors = {
            errors: [
              {
                status: '422',
                source: { 'pointer': '/data/attributes/name' },
                title: 'Invalid data attribute "name"',
                detail: 'Le nom n’est pas renseigné.'
              },
              {
                status: '422',
                source: { 'pointer': '/data/attributes/type' },
                title: 'Invalid data attribute "type"',
                detail: 'Le type n’est pas renseigné.'
              }
            ]
          };

          // when
          const promise = organizationController.create(request, replyStub);

          // then
          return promise.then(() => {
            sinon.assert.calledWith(codeStub, 422);
            sinon.assert.calledWith(replyStub, jsonApiValidationErrors);
          });
        });
      });

      context('when a treatment error occurred (other than validation)', () => {

        beforeEach(() => {
          error = new InfrastructureError('Une erreur est survenue lors de la création de l’organisation');
          usecases.createOrganization.rejects(error);
        });

        it('should return an error with HTTP status code 500', () => {
          // when
          const promise = organizationController.create(request, replyStub);

          // then
          return promise.then(() => {
            expect(codeStub).to.have.been.calledWith(500);
          });
        });
      });
    });
  });

  describe('#search', () => {

    let sandbox;
    let replyStub;
    let codeStub;
    const arrayOfSerializedOrganization = [{ code: 'AAA111' }, { code: 'BBB222' }];
    const arrayOfOrganizations = [new Organization({ code: 'AAA111' }), new Organization({ code: 'BBB222' })];

    beforeEach(() => {
      codeStub = sinon.stub();
      replyStub = sinon.stub().returns({ code: codeStub });
      sandbox = sinon.sandbox.create();

      sandbox.stub(logger, 'error');
      sandbox.stub(organizationService, 'search').resolves(arrayOfOrganizations);
      sandbox.stub(organizationSerializer, 'serialize').returns(arrayOfSerializedOrganization);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should retrieve organizations with one filter', () => {
      // given
      const userId = 1234;
      const request = {
        auth: { credentials: { userId: 1234 } },
        query: { 'filter[query]': 'my search' }
      };

      // when
      const promise = organizationController.search(request, replyStub);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(organizationService.search, userId, { query: 'my search' });
      });
    });

    it('should retrieve organizations with two different filters', () => {
      // given
      const userId = 1234;
      const request = {
        auth: { credentials: { userId } },
        query: {
          'filter[query]': 'my search',
          'filter[code]': 'with params'
        }
      };

      // when
      const promise = organizationController.search(request, replyStub);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(organizationService.search, userId, { query: 'my search', code: 'with params' });
      });
    });

    it('should log when there is an error', () => {
      // given
      const error = new Error('');
      organizationService.search.rejects(error);
      const request = {
        auth: { credentials: { userId: 1234 } },
        query: { 'filter[first]': 'with params' }
      };

      // when
      const promise = organizationController.search(request, replyStub);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(logger.error, error);
      });
    });

    it('should reply 500 while getting data is on error', () => {
      // given
      const error = new Error('');
      organizationService.search.rejects(error);
      const request = {
        auth: { credentials: { userId: 1234 } },
        query: { 'filter[first]': 'with params' }
      };

      // when
      const promise = organizationController.search(request, replyStub);

      // then
      return promise.then(() => {
        sinon.assert.callOrder(organizationService.search, replyStub);
        sinon.assert.calledWith(codeStub, 500);
      });
    });

    it('should serialize results', () => {
      // given
      const request = {
        auth: { credentials: { userId: 1234 } },
        query: { 'filter[first]': 'with params' }
      };

      // when
      const promise = organizationController.search(request, replyStub);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(organizationSerializer.serialize, arrayOfOrganizations);
        sinon.assert.calledWith(replyStub, arrayOfSerializedOrganization);
      });
    });

  });

  describe('#getSharedProfiles', () => {

    let sandbox;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(logger, 'error');
      sandbox.stub(snapshotRepository, 'getSnapshotsByOrganizationId');
      sandbox.stub(snapshotSerializer, 'serialize');
      sandbox.stub(validationErrorSerializer, 'serialize');
      sandbox.stub(bookshelfUtils, 'mergeModelWithRelationship');
    });

    afterEach(() => {
      sandbox.restore();
    });

    describe('Collaborations', () => {
      it('should be an existing function', () => {
        // then
        expect(organizationController.getSharedProfiles).to.be.a('function');
      });

      it('should call snapshot repository', () => {
        // given
        snapshotRepository.getSnapshotsByOrganizationId.resolves();
        const request = {
          params: {
            id: 7
          }
        };
        const reply = sinon.stub().returns({
          code: () => {
          }
        });
        // when
        const promise = organizationController.getSharedProfiles(request, reply);

        // then
        return promise.then(() => {
          sinon.assert.calledOnce(snapshotRepository.getSnapshotsByOrganizationId);
          sinon.assert.calledWith(snapshotRepository.getSnapshotsByOrganizationId, 7);
        });
      });

      it('should call snapshot serializer', () => {
        // given
        const snapshots = [{
          toJSON: () => {
            return {};
          }
        }];
        snapshotRepository.getSnapshotsByOrganizationId.resolves({});
        bookshelfUtils.mergeModelWithRelationship.resolves(snapshots);
        const request = {
          params: {
            id: 7
          }
        };
        const reply = sinon.stub().returns({
          code: () => {
          }
        });

        // when
        const promise = organizationController.getSharedProfiles(request, reply);

        // then
        return promise.then(() => {
          sinon.assert.calledOnce(snapshotSerializer.serialize);
          sinon.assert.calledWith(snapshotSerializer.serialize, [{}]);
        });
      });

      it('should call a reply function', () => {
        // then
        const snapshots = [];
        const serializedSnapshots = { data: [] };
        snapshotRepository.getSnapshotsByOrganizationId.resolves(snapshots);
        snapshotSerializer.serialize.resolves(serializedSnapshots);
        const request = {
          params: {
            id: 7
          }
        };

        const reply = sinon.stub().returns({
          code: () => {
          }
        });

        // when
        const promise = organizationController.getSharedProfiles(request, reply);

        // then
        return promise.then(() => {
          sinon.assert.calledOnce(reply);
        });
      });

    });

    describe('Error cases', () => {

      it('should return an serialized NotFoundError, when no snapshot was found', () => {
        // given
        const error = BookshelfSnapshot.NotFoundError;
        snapshotRepository.getSnapshotsByOrganizationId.rejects(error);
        const serializedError = { errors: [] };
        validationErrorSerializer.serialize.returns(serializedError);
        const request = {
          params: {
            id: 156778
          }
        };
        const replyStub = sinon.stub().returns({
          code: () => {
          }
        });

        // when
        const promise = organizationController.getSharedProfiles(request, replyStub);

        // then
        return promise.then(() => {
          sinon.assert.calledWith(replyStub, serializedError);
        });
      });

      it('should log an error, when unknown error has occured', () => {
        // given
        const error = new Error();
        snapshotRepository.getSnapshotsByOrganizationId.rejects(error);
        const serializedError = { errors: [] };
        validationErrorSerializer.serialize.returns(serializedError);
        const request = {
          params: {
            id: 156778
          }
        };
        const codeStub = sinon.stub().callsFake(() => {
        });
        const replyStub = sinon.stub().returns({
          code: codeStub
        });

        // when
        const promise = organizationController.getSharedProfiles(request, replyStub);

        // then
        return promise.then(() => {
          sinon.assert.calledWith(replyStub, serializedError);
          sinon.assert.calledOnce(logger.error);
          sinon.assert.calledWith(codeStub, 500);
        });
      });

    });

  });

  describe('#exportSharedSnapshotsAsCsv', () => {

    beforeEach(() => {
      sinon.stub(organizationService, 'getOrganizationSharedProfilesAsCsv').resolves();
      sinon.stub(validationErrorSerializer, 'serialize');
    });

    afterEach(() => {
      organizationService.getOrganizationSharedProfilesAsCsv.restore();
      validationErrorSerializer.serialize.restore();
    });

    it('should call the use case service that exports shared profile of an organization as CSV (and reply an HTTP response)', () => {
      // given
      const request = {
        params: {
          id: 7
        }
      };
      const header = sinon.stub();
      header.returns({ header }); // <--- "inception"... I'm sure you appreciate it ;-)
      const response = { header };
      const reply = () => response;

      // when
      const promise = organizationController.exportSharedSnapshotsAsCsv(request, reply);

      // then
      return promise.then(() => {
        expect(response.header).to.have.been.calledTwice;
      });
    });

    describe('Error cases', () => {

      it('should return a JSONAPI serialized NotFoundError, when expected organization does not exist', () => {
        // given

        organizationService.getOrganizationSharedProfilesAsCsv.rejects(NotFoundError);
        const serializedError = { errors: [] };
        validationErrorSerializer.serialize.returns(serializedError);
        const request = {
          params: {
            id: 'unexisting id'
          }
        };
        const codeStub = sinon.stub().callsFake(() => {
        });
        const replyStub = sinon.stub().returns({
          code: codeStub
        });

        // when
        const promise = organizationController.exportSharedSnapshotsAsCsv(request, replyStub);

        // then
        return promise.then(() => {
          sinon.assert.calledWith(replyStub, serializedError);
          sinon.assert.calledWith(codeStub, 500);
        });
      });

      it('should log an error, when unknown error has occured', () => {
        // given
        const error = new NotFoundError();
        organizationService.getOrganizationSharedProfilesAsCsv.rejects(error);
        const serializedError = { errors: [] };
        validationErrorSerializer.serialize.returns(serializedError);
        const request = {
          params: {
            id: 'unexisting id'
          }
        };
        const codeStub = sinon.stub().callsFake(() => {
        });
        const replyStub = sinon.stub().returns({
          code: codeStub
        });

        // when
        const promise = organizationController.exportSharedSnapshotsAsCsv(request, replyStub);

        // then
        return promise.then(() => {
          sinon.assert.calledWith(replyStub, serializedError);
          sinon.assert.calledWith(codeStub, 500);
        });
      });

    });

  });

  describe('#getCampaigns', () => {

    let sandbox;
    let organizationId;
    let request;
    let campaign;
    let serializedCampaigns;

    beforeEach(() => {
      organizationId = 1;
      request = {
        params: { id: organizationId },
        auth: {
          credentials: {
            userId: 1
          }
        }
      };
      campaign = factory.buildCampaign();
      serializedCampaigns = { data: [{ name: campaign.name, code: campaign.code }] };

      sandbox = sinon.sandbox.create();
      sandbox.stub(usecases, 'getOrganizationCampaigns');
      sandbox.stub(campaignSerializer, 'serialize');
      codeStub = sandbox.stub();
      replyStub = sandbox.stub().returns({ code: codeStub });
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call the usecase to get the campaigns', () => {
      // given
      usecases.getOrganizationCampaigns.resolves([campaign]);
      campaignSerializer.serialize.returns(serializedCampaigns);

      // when
      const promise = organizationController.getCampaigns(request, replyStub);

      // then
      return promise.then(() => {
        expect(usecases.getOrganizationCampaigns).to.have.been.calledWith({ organizationId });
      });
    });

    it('should return the serialized campaigns belonging to the organization', () => {
      // given
      usecases.getOrganizationCampaigns.resolves([campaign]);
      campaignSerializer.serialize.returns(serializedCampaigns);

      // when
      const promise = organizationController.getCampaigns(request, replyStub);

      // then
      return promise.then(() => {
        expect(replyStub).to.have.been.calledWith(serializedCampaigns);
        expect(codeStub).to.have.been.calledWith(200);
      });
    });

    it('should return a 500 error when an error occurs', () => {
      // given
      const errorMessage = 'Unexpected error';
      const expectedError = new JSONAPIError({
        code: '500',
        title: 'Internal Server Error',
        detail: errorMessage
      });

      usecases.getOrganizationCampaigns.rejects(new Error(errorMessage));

      // when
      const promise = organizationController.getCampaigns(request, replyStub);

      // then
      return promise.then(() => {
        expect(replyStub).to.have.been.calledWith(expectedError);
        expect(codeStub).to.have.been.calledWith(500);
      });
    });
  });

  describe('#findTargetProfiles', () => {

    let codeStub;
    let replyStub;
    const connectedUserId = 1;
    const organizationId = '145';

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      request = {
        auth: { credentials: { userId: connectedUserId } },
        params: { id: organizationId }
      };
      codeStub = sandbox.stub();
      replyStub = sandbox.stub().returns({
        code: codeStub
      });
      sandbox.stub(organizationService, 'findAllTargetProfilesAvailableForOrganization').resolves();
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call usecases with appropriated arguments', () => {
      // when
      const promise = organizationController.findTargetProfiles(request, replyStub);

      // then
      return promise.then(() => {
        expect(organizationService.findAllTargetProfilesAvailableForOrganization).to.have.been.calledOnce;
        expect(organizationService.findAllTargetProfilesAvailableForOrganization).to.have.been.calledWith(145);
      });
    });

    context('success cases', () => {

      let foundTargetProfiles;

      beforeEach(() => {
        // given
        foundTargetProfiles = [factory.buildTargetProfile()];
        organizationService.findAllTargetProfilesAvailableForOrganization.resolves(foundTargetProfiles);
        sandbox.stub(targetProfileSerializer, 'serialize');
      });

      it('should serialize the array of target profile', () => {
        // when
        const promise = organizationController.findTargetProfiles(request, replyStub);

        // then
        return promise.then(() => {
          expect(targetProfileSerializer.serialize).to.have.been.calledWith(foundTargetProfiles);
        });
      });

      it('should reply 200 with serialized target profiles', () => {
        // given
        const serializedTargetProfiles = {};
        targetProfileSerializer.serialize.returns(serializedTargetProfiles);

        // when
        const promise = organizationController.findTargetProfiles(request, replyStub);

        // then
        return promise.then(() => {
          expect(replyStub).to.have.been.calledWith(serializedTargetProfiles);
          expect(codeStub).to.have.been.calledWith(200);
        });
      });

    });

    context('error cases', () => {

      beforeEach(() => {
        sandbox.stub(logger, 'error');
      });

      it('should log the error and reply with 500 error', () => {
        // given
        const error = new Error();
        organizationService.findAllTargetProfilesAvailableForOrganization.rejects(error);

        // when
        const promise = organizationController.findTargetProfiles(request, replyStub);

        // then
        return promise.then(() => {
          expect(logger.error).to.have.been.called;
          expect(codeStub).to.have.been.calledWith(500);
        });
      });
    });
  });

});

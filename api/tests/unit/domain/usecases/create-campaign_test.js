const { expect, sinon, factory } = require('../../../test-helper');
const createCampaign = require('../../../../lib/domain/usecases/create-campaign');
const campaignCodeGenerator = require('../../../../lib/domain/services/campaigns/campaign-code-generator');
const campaignValidator = require('../../../../lib/domain/validators/campaign-validator');
const { EntityValidationError, UserNotAuthorizedToCreateCampaignError } = require('../../../../lib/domain/errors');

describe('Unit | UseCase | create-campaign', () => {

  let sandbox;
  const availableCampaignCode = 'ABCDEF123';
  const targetProfileId = 12;
  const campaignToCreate = factory.buildCampaign({ id: '', code: '', targetProfileId  });
  const savedCampaign = factory.buildCampaign({ code: availableCampaignCode });
  const targetProfile = factory.buildTargetProfile({ id: targetProfileId, isPublic: true });
  const campaignRepository = { save: () => undefined };
  const userRepository = { getWithOrganizationAccesses: () => undefined };
  const organizationService = { findAllTargetProfilesAvailableForOrganization: () => undefined };

  function _stubGetUserWithOrganizationsAccesses(organizationIdUserHasAccessTo) {
    const userWithOrganizationAccess = factory.buildUser();
    userWithOrganizationAccess.organizationAccesses[0].organization.id = organizationIdUserHasAccessTo;
    userRepository.getWithOrganizationAccesses.resolves(userWithOrganizationAccess);
    organizationService.findAllTargetProfilesAvailableForOrganization.resolves([targetProfile]);
  }

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(campaignCodeGenerator, 'generate');
    sandbox.stub(campaignRepository, 'save');
    sandbox.stub(campaignValidator, 'validate');
    sandbox.stub(userRepository, 'getWithOrganizationAccesses');
    sandbox.stub(organizationService, 'findAllTargetProfilesAvailableForOrganization');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should throw an EntityValidationError if campaign is not valid', () => {
    // given
    campaignValidator.validate.rejects(new EntityValidationError({ invalidAttributes: [] }));

    // when
    const promise = createCampaign({ campaign: campaignToCreate, campaignRepository, userRepository, organizationService });

    // then
    return expect(promise).to.be.rejectedWith(EntityValidationError);
  });

  it('should throw an error if user do not have an access to the campaign organization', () => {
    // given
    const organizationIdDifferentFromCampaign = 98437;
    campaignValidator.validate.resolves();
    _stubGetUserWithOrganizationsAccesses(organizationIdDifferentFromCampaign);

    // when
    const promise = createCampaign({ campaign: campaignToCreate, campaignRepository, userRepository, organizationService  });

    // then
    return expect(promise).to.be.rejectedWith(UserNotAuthorizedToCreateCampaignError);
  });

  it('should generate a new code to the campaign', () => {
    // given
    campaignValidator.validate.resolves();
    _stubGetUserWithOrganizationsAccesses(campaignToCreate.organizationId);
    campaignCodeGenerator.generate.resolves(availableCampaignCode);
    campaignRepository.save.resolves(savedCampaign);

    // when
    const promise = createCampaign({ campaign: campaignToCreate, campaignRepository, userRepository, organizationService });

    // then
    return promise.then(() => {
      expect(campaignCodeGenerator.generate).to.have.been.called;
    });

  });

  it('should save the campaign with name, userId, organizationId and generated code', () => {
    // given
    campaignValidator.validate.resolves();
    _stubGetUserWithOrganizationsAccesses(campaignToCreate.organizationId);
    campaignCodeGenerator.generate.resolves(availableCampaignCode);
    campaignRepository.save.resolves(savedCampaign);

    // when
    const promise = createCampaign({ campaign: campaignToCreate, campaignRepository, userRepository, organizationService });

    // then
    return promise.then(() => {
      expect(campaignRepository.save).to.have.been.called;

      const campaignToCreateWithCode = campaignRepository.save.firstCall.args[0];
      expect(campaignToCreateWithCode.name).to.equal(campaignToCreate.name);
      expect(campaignToCreateWithCode.code).to.equal(availableCampaignCode);
      expect(campaignToCreateWithCode.userId).to.equal(campaignToCreate.userId);
      expect(campaignToCreateWithCode.organizationId).to.equal(campaignToCreate.organizationId);
    });
  });

  it('should return the newly created campaign', () => {
    // given
    campaignValidator.validate.resolves();
    _stubGetUserWithOrganizationsAccesses(campaignToCreate.organizationId);
    campaignCodeGenerator.generate.resolves(availableCampaignCode);
    campaignRepository.save.resolves(savedCampaign);

    // when
    const promise = createCampaign({ campaign: campaignToCreate, campaignRepository, userRepository, organizationService });

    // then
    return promise.then((campaign) => {
      expect(campaign).to.deep.equal(savedCampaign);
    });
  });

});

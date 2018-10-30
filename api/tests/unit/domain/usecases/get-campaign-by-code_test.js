const { expect, sinon, factory } = require('../../../test-helper');
const usecases = require('../../../../lib/domain/usecases');
const { NotFoundError } = require('../../../../lib/domain/errors');
const Campaign = require('../../../../lib/domain/models/Campaign');

describe('Unit | UseCase | get-campaign-by-code', () => {

  let sandbox;
  let error;

  const organizationId = 'organizationId';
  const campaignCode = 'QWERTY123';
  const campaign = factory.buildCampaign({ code: campaignCode, organizationId });
  const organization = factory.buildOrganization({ id: organizationId, logoUrl: 'a logo url' });
  const campaignRepository = {};
  const organizationRepository = {};

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    campaignRepository.getByCode = sandbox.stub();
    organizationRepository.get = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should call the campaign repository to retrieve the campaign with the given code', () => {
    // given
    campaignRepository.getByCode.resolves(campaign);
    organizationRepository.get.resolves(organization);

    // when
    const promise = usecases.getCampaignByCode({ code: campaignCode, campaignRepository, organizationRepository });

    // then
    return promise.then(() => {
      expect(campaignRepository.getByCode).to.have.been.calledWith(campaignCode);
    });
  });

  context('when a campaign was found', () => {

    beforeEach(() => {
      campaignRepository.getByCode.resolves(campaign);
    });

    context('when an organization was found', () => {

      beforeEach(() => {
        organizationRepository.get.resolves(organization);
      });

      it('should call the organization repository to retrieve the associated organization', () => {
        // when
        const promise = usecases.getCampaignByCode({ code: campaignCode, campaignRepository, organizationRepository });

        // then
        return promise.then(() => {
          expect(organizationRepository.get).to.have.been.calledWith(organizationId);
        });
      });

      it('should return the found campaign with the organization logo url', () => {
        // when
        const promise = usecases.getCampaignByCode({ code: campaignCode, campaignRepository, organizationRepository });

        // then
        return promise.then((foundCampaign) => {
          expect(foundCampaign).to.be.instanceOf(Campaign);
          expect(foundCampaign.name).to.deep.equal(campaign.name);
          expect(foundCampaign.code).to.deep.equal(campaign.code);
          expect(foundCampaign.title).to.deep.equal(campaign.title);
          expect(foundCampaign.idPixLabel).to.deep.equal(campaign.idPixLabel);
          expect(foundCampaign.organizationLogoUrl).to.deep.equal(organization.logoUrl);
        });
      });

    });

    context('When the organization could not be retrieved', () => {

      beforeEach(() => {
        organizationRepository.get.returns(Promise.reject(error));
      });

      it('should forward the error', () => {
        // when
        const promise = usecases.getCampaignByCode({ code: campaignCode, campaignRepository, organizationRepository });

        // then
        return promise.catch((err) => {
          expect(err).to.deep.equal(error);
        });
      });

    });

  });

  context('when no campaign was found', () => {
    it('should return an error if no campaign found for the given code', () => {
      // given
      campaignRepository.getByCode.resolves(null);

      // when
      const promise = usecases.getCampaignByCode({ code: campaignCode, campaignRepository, organizationRepository });

      // then
      return expect(promise).to.be.rejectedWith(NotFoundError);
    });
  });

});

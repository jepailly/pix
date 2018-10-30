const { NotFoundError } = require('../../domain/errors');

module.exports = function getCampaignByCode({ code, campaignRepository, organizationRepository }) {
  let campaign;
  return campaignRepository.getByCode(code)
    .then((foundCampaign) => {
      if(foundCampaign === null) {
        return Promise.reject(new NotFoundError(`Campaign with code ${code} not found`));
      }
      campaign = foundCampaign;
      return organizationRepository.get(campaign.organizationId);
    })
    .then((foundOrganization) => {
      campaign.organizationLogoUrl = foundOrganization.logoUrl;
      return campaign;
    });
};

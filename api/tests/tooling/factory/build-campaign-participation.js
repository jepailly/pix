const CampaignParticipation = require('../../../lib/domain/models/CampaignParticipation');
const buildCampaign = require('./build-campaign');

const faker = require('faker');

module.exports = function buildCampaignParticipation(
  {
    id = 1,
    assessmentId = faker.random.number(2),
    campaign = buildCampaign(),
    isShared = faker.random.boolean(),
    sharedAt = faker.date.recent(),
    createdAt = faker.date.recent(),
    participantExternalId = 'Mon mail pro',
    campaignId = faker.random.number(2),
    userId = faker.random.number(2),
  } = {}) {
  return new CampaignParticipation({ id, assessmentId, campaign, isShared, sharedAt, createdAt, participantExternalId, campaignId, userId });
};

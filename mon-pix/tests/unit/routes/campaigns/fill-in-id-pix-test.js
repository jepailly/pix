import EmberObject from '@ember/object';
import { A } from '@ember/array';
import Service from '@ember/service';
import { describe, it, beforeEach } from 'mocha';
import { setupTest } from 'ember-mocha';
import sinon from 'sinon';

describe('Unit | Route | campaigns/fill-in-id-pix', function() {

  setupTest('route:campaigns/fill-in-id-pix', {
    needs: ['service:session', 'service:current-routed-modal']
  });

  let route;
  let storeStub;
  let createCampaignParticipationStub;
  let queryChallengeStub;
  let queryStub;
  let savedAssessment;
  let createdCampaignParticipation;
  let campaign;
  const campaignCode = 'CODECAMPAIGN';

  beforeEach(function() {
    createCampaignParticipationStub = sinon.stub();
    queryChallengeStub = sinon.stub();
    queryStub = sinon.stub();
    storeStub = Service.extend({
      queryRecord: queryChallengeStub, query: queryStub, createRecord: createCampaignParticipationStub });
    this.register('service:store', storeStub);
    this.inject.service('store', { as: 'store' });
    savedAssessment = EmberObject.create({ id: 1234, codeCampaign: 'CODECAMPAIGN', reload: sinon.stub() });
    createdCampaignParticipation = EmberObject.create({ id: 456, assessment: savedAssessment });
    campaign = EmberObject.create({ code: campaignCode });
    route = this.subject();
  });

  describe('#model', function() {

    beforeEach(function() {
    });

    it('should retrieve campaign with given campaign code', function() {
      // given
      const params = {
        campaign_code: campaignCode
      };

      const campaigns = A([campaign]);
      queryStub.resolves(campaigns);

      // when
      const promise = route.model(params);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(queryStub, 'campaign', { filter: { code: campaignCode } });
      });
    });

    it('should redirect to campaign when id pix is not required', function() {
      // given
      const params = {
        campaign_code: campaignCode
      };
      const campaigns = A([campaign]);
      queryStub.resolves(campaigns);
      route.transitionTo = sinon.stub();

      // when
      const promise = route.model(params);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(route.transitionTo, 'assessments.challenge');
      });
    });

    it('should not redirect to campaign when id pix is not required', function() {
      // given
      const params = {
        campaign_code: campaignCode
      };
      campaign.idPixLabel = 'email';
      const campaigns = A([campaign]);
      queryStub.resolves(campaigns);
      route.transitionTo = sinon.stub();

      // when
      const promise = route.model(params);

      // then
      return promise.then(() => {
        sinon.assert.notCalled(route.transitionTo);
      });
    });
  });

  describe('#afterModel', function() {

    beforeEach(function() {
      savedAssessment.reload.resolves();
      route.transitionTo = sinon.stub();
    });

    it('should transition to challenge when there already is an assessment', function() {
      // given
      const model = {
        campaignCode: 'campaignCode'
      };

      // given
      const assessments = A([savedAssessment]);
      queryStub.resolves(assessments);
      queryChallengeStub.resolves({ id: 23 });

      // when
      const promise = route.afterModel(model);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(route.transitionTo, 'assessments.challenge');
      });
    });

    it('should do nothing if there is not assessment', function() {
      // given
      const model = {
        campaignCode: 'campaignCode'
      };

      // given
      queryStub.resolves([]);
      queryChallengeStub.resolves();

      // when
      const promise = route.afterModel(model);

      // then
      return promise.then(() => {
        sinon.assert.notCalled(route.transitionTo);
      });
    });
  });

  describe('#start', function() {

    const campaignCode = 'CODECAMPAIGN';
    const participantExternalId = 'Identifiant professionnel';

    beforeEach(function() {
      savedAssessment.reload.resolves();
      route.transitionTo = sinon.stub();
    });

    it('should retrieve assement with type "SMART_PLACEMENT" and given campaign code', function() {
      // given
      const assessments = A([savedAssessment]);
      queryStub.resolves(assessments);
      queryChallengeStub.resolves();

      // when
      const promise = route.start(campaign, campaignCode, participantExternalId);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(queryStub, 'assessment', { filter: { type: 'SMART_PLACEMENT', codeCampaign: campaignCode } });
      });
    });

    it('should create new campaignParticipation if nothing found', function() {
      // given
      const assessments = A([]);
      queryStub.resolves(assessments);
      createCampaignParticipationStub.returns({ save: () => Promise.resolve(createdCampaignParticipation) });
      queryChallengeStub.resolves();

      // when
      const promise = route.start(campaign, campaignCode, participantExternalId);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(createCampaignParticipationStub, 'campaign-participation', { campaign, participantExternalId });
      });
    });

    it('should retrieve challenge with given assessment id', function() {
      // given
      const assessments = A([savedAssessment]);
      queryStub.resolves(assessments);
      queryChallengeStub.resolves();

      // when
      const promise = route.start(campaign, campaignCode, participantExternalId);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(queryChallengeStub, 'challenge', { assessmentId: savedAssessment.get('id') });
      });
    });

    it('should redirect to next challenge if one was found', function() {
      // given
      const assessments = A([savedAssessment]);
      queryStub.resolves(assessments);
      queryChallengeStub.resolves({ id: 23 });

      // when
      const promise = route.start(campaign, campaignCode, participantExternalId);

      // then
      return promise.then(() => {
        sinon.assert.calledWith(route.transitionTo, 'assessments.challenge');
      });
    });
  });
});
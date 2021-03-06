import { inject as service } from '@ember/service';
import RSVP from 'rsvp';
import BaseRoute from 'mon-pix/routes/base-route';
import ENV from 'mon-pix/config/environment';

export default BaseRoute.extend({

  session: service(),

  model(params) {
    const store = this.get('store');

    const assessmentId = params.assessment_id;
    const challengeId = params.challenge_id;

    return RSVP.hash({
      assessment: store.findRecord('assessment', assessmentId),
      challenge: store.findRecord('challenge', challengeId),
    }).catch((err) => {
      const meta = ('errors' in err) ? err.errors.get('firstObject').meta : null;
      if (meta.field === 'authorization') {
        return this.transitionTo('index');
      }
    });
  },

  afterModel(model) {
    const store = this.get('store');

    return RSVP.hash({
      user: model.assessment.get('isCertification') ? store.findRecord('user', this.get('session.data.authenticated.userId')) : null,
      answers: store.queryRecord('answer', { assessment: model.assessment.id, challenge: model.challenge.id })
    }).then((hash) => {
      model.user = hash.user;
      model.answers = hash.answers;
      return model;
    });
  },

  serialize(model) {
    return {
      assessment_id: model.assessment.id,
      challenge_id: model.challenge.id
    };
  },

  _findOrCreateAnswer(challenge, assessment) {
    let answer = assessment.get('answers').findBy('challenge.id', challenge.get('id'));
    if (!answer) {
      answer = this.get('store').createRecord('answer', { assessment, challenge });
    }
    return answer;
  },

  _getNextChallenge(assessment, challenge) {
    return this.get('store')
      .queryRecord('challenge', { assessmentId: assessment.get('id'), challengeId: challenge.get('id') });
  },

  _hasReachedCheckpoint(assessment) {
    return assessment.get('answers.length') % ENV.APP.NUMBER_OF_CHALLENGE_BETWEEN_TWO_CHECKPOINTS_IN_SMART_PLACEMENT === 0;
  },

  actions: {

    saveAnswerAndNavigate(challenge, assessment, answerValue, answerTimeout, answerElapsedTime) {
      const answer = this._findOrCreateAnswer(challenge, assessment);
      answer.setProperties({
        value: answerValue,
        timeout: answerTimeout,
        elapsedTime: answerElapsedTime
      });

      return answer.save()
        .then(() => this._getNextChallenge(assessment, challenge))
        .then((nextChallenge) => {
          if(nextChallenge) {
            if(assessment.get('hasCheckpoints') && this._hasReachedCheckpoint(assessment)) {
              return this.transitionTo('assessments.checkpoint', assessment.get('id'));
            }
            this.transitionTo('assessments.challenge', { assessment, challenge: nextChallenge });
          } else {
            this.transitionTo('assessments.rating', assessment.get('id'));
          }
        })
        .catch(() => {
          this.send('error');
        });
    },
    error() {
      return true;
    }
  }
});

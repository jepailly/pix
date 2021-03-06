import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupTest } from 'ember-mocha';

describe('Unit | Component | challenge statement', function() {

  setupTest('component:challenge-statement', {
    needs: ['service:mailGenerator']
  });

  describe('[CP] #challengeEmbedDocument', function() {
    it('should return a JSON object with the challenge embedded document when the challenge has a valid one', function() {
      // given
      const component = this.subject({
        challenge: {
          hasValidEmbedDocument: true,
          embedUrl: 'https://challenge-embed.url',
          embedTitle: 'Challenge embed document title',
          embedHeight: 300
        }
      });

      // when
      const challengeEmbedDocument = component.get('challengeEmbedDocument');

      // then
      expect(challengeEmbedDocument).to.deep.equal({
        url: 'https://challenge-embed.url',
        title: 'Challenge embed document title',
        height: 300
      });
    });

    it('should return "undefined" when the challenge does not have a (valid) embedded document', function() {
      // given
      const component = this.subject({
        challenge: {
          hasValidEmbedDocument: false
        }
      });

      // when
      const challengeEmbedDocument = component.get('challengeEmbedDocument');

      // then
      expect(challengeEmbedDocument).to.be.undefined;
    });
  });

});

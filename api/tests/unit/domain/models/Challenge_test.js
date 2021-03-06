const { expect, factory } = require('../../../test-helper');
const Challenge = require('../../../../lib/domain/models/Challenge');
const Skill = require('../../../../lib/domain/models/Skill');

describe('Unit | Domain | Models | Challenge', () => {

  describe('#constructor', () => {

    it('should construct a model Challenge from attributes', () => {
      // given
      const challengeRawData = {
        id: 'recwWzTquPlvIl4So',
        type: 'QCM',
        instruction: 'Les moteurs de recherche affichent certains liens en raison d\'un accord commercial.\n\nDans quels encadrés se trouvent ces liens ?',
        proposals: '- 1\n- 2\n- 3\n- 4\n- 5',
        timer: 1234,
        illustrationUrl: 'https://dl.airtable.com/2MGErxGTQl2g2KiqlYgV_venise4.png',
        attachments: [
          'https://dl.airtable.com/nHWKNZZ7SQeOKsOvVykV_navigationdiaporama5.pptx',
          'https://dl.airtable.com/rsXNJrSPuepuJQDByFVA_navigationdiaporama5.odp',
        ],
        embedUrl: 'https://github.page.io/pages/mon-epreuve.html',
        embedTitle: 'Epreuve de selection d’imprimante',
        embedHeight: 400,
        status: 'validé',
        answer: [],
        skills: [new Skill('recUDrCWD76fp5MsE')],
        validator: undefined,
        competenceId: 'recsvLz0W2ShyfD63',
      };

      // when
      const challengeDataObject = new Challenge(challengeRawData);

      // then
      expect(challengeDataObject).to.be.an.instanceof(Challenge);
      expect(challengeDataObject).to.deep.equal(challengeRawData);
    });
  });

  describe('#hasSkill', () => {

    it('should return false when the skill is not known', () => {
      // given
      const challenge = Challenge.fromAttributes();

      // when
      const result = challenge.hasSkill(new Skill('@recherche1'));

      // then
      expect(result).to.be.false;
    });

    it('should return true when the skill is known', () => {
      // given
      const challenge = Challenge.fromAttributes();
      challenge.skills.push(new Skill('@recherche1'));

      // when
      const result = challenge.hasSkill(new Skill('@recherche1'));

      // then
      expect(result).to.be.true;
    });
  });

  describe('#addSkill', () => {

    it('should add a skill', () => {
      // given
      const skill = new Skill('@web3');
      const challenge = Challenge.fromAttributes();

      // when
      challenge.addSkill(skill);

      // then
      expect(challenge.skills).to.have.lengthOf(1);
      expect(challenge.skills[0]).to.equal(skill);
    });

  });

  describe('#isPublished', () => {
    [
      { status: 'validé', expectedResult: true },
      { status: 'validé sans test', expectedResult: true },
      { status: 'proposé', expectedResult: false },
      { status: 'pré-validé', expectedResult: true },
      { status: 'archive', expectedResult: false },
    ].forEach((testCase) => {
      it(`should return ${testCase.expectedResult} when the status is "${testCase.status}"`, () => {
        // given
        const challenge = new Challenge({ status: testCase.status });

        // when
        const result = challenge.isPublished();

        // then
        expect(result).to.equal(testCase.expectedResult);
      });
    });
  });

  describe('#hardestSkill', function() {
    it('should exist', function() {
      // given
      const url1 = new Skill({ name: '@url1' });
      const challenge = Challenge.fromAttributes();
      challenge.addSkill(url1);

      // then
      expect(challenge.hardestSkill).to.exist;
    });

    it('should be web5 if challenge requires url1 and web5', function() {
      // given
      const web5 = new Skill({ name: '@web5' });
      const url1 = new Skill({ name: '@url1' });
      const challenge = Challenge.fromAttributes();
      challenge.addSkill(url1);
      challenge.addSkill(web5);

      // then
      expect(challenge.hardestSkill).to.equal(web5);
    });
  });

  describe('#testsAtLeastOneNewSkill', function() {

    it('returns true if the challenge is not already assessed', function() {
      // given
      const [s1] = factory.buildSkillCollection();
      const challenge = factory.buildChallenge({ skills: [s1] });
      const assessedSkills = [];
      // whe
      const response = challenge.testsAtLeastOneNewSkill(assessedSkills);
      // then
      expect(response).to.be.true;
    });

    it('should return false if the challenge\'s skill is already assessed', function() {
      // given
      const [s1] = factory.buildSkillCollection();
      const challenge = factory.buildChallenge({ skills: [s1] });
      const assessedSkills = [s1];
      // when
      const response = challenge.testsAtLeastOneNewSkill(assessedSkills);
      // then
      expect(response).to.be.false;
    });

    it('should return true if the challenge has a unique skill not assessed', function() {
      // given
      const [s1, s2, s3] = factory.buildSkillCollection({ minLevel: 1, maxLevel: 3 });
      const challenge = factory.buildChallenge({ skills: [s3] });
      const assessedSkills = [s1, s2];
      // when
      const response = challenge.testsAtLeastOneNewSkill(assessedSkills);
      // then
      expect(response).to.be.true;
    });

    it('should return true if the challenge has at least a skill not assessed', function() {
      // given
      const [s1, s2, s3] = factory.buildSkillCollection({ minLevel: 1, maxLevel: 3 });
      const challenge = factory.buildChallenge({ skills: [s2, s3] });
      const assessedSkills = [s1, s2];
      // when
      const response = challenge.testsAtLeastOneNewSkill(assessedSkills);
      // then
      expect(response).to.be.true;
    });

    it('should return false if the challenge has a skill assessed of the same name (but different object)', function() {
      // given
      const skill = factory.buildSkill({ name: '@skill1' });
      const sameSkill = factory.buildSkill({ name: '@skill1' });
      const challenge = factory.buildChallenge({ skills: [skill] });
      // when
      const response = challenge.testsAtLeastOneNewSkill([sameSkill]);
      // then
      expect(response).to.be.false;
    });

    it('should return false if the challenge has only one skill and is already assessed', function() {
      // given
      const [s1, s2] = factory.buildSkillCollection({ minLevel: 1, maxLevel: 3 });
      const challenge = factory.buildChallenge({ skills: [s2] });
      const assessedSkills = [s1, s2];
      // when
      const response = challenge.testsAtLeastOneNewSkill(assessedSkills);
      // then
      expect(response).to.be.false;
    });
  });
});

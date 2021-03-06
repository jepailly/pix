const { expect, sinon, factory } = require('../../../test-helper');
const certificationService = require('../../../../lib/domain/services/certification-service');
const Answer = require('../../../../lib/domain/models/Answer');
const CertificationChallenge = require('../../../../lib/domain/models/CertificationChallenge');
const CertificationCourse = require('../../../../lib/domain/models/CertificationCourse');

const Competence = require('../../../../lib/domain/models/Competence');
const Assessment = require('../../../../lib/domain/models/Assessment');
const AssessmentResult = require('../../../../lib/domain/models/AssessmentResult');
const CompetenceMarks = require('../../../../lib/domain/models/CompetenceMark');

const { CertificationComputeError, UserNotAuthorizedToCertifyError } = require('../../../../lib/domain/errors');

const userService = require('../../../../lib/domain/services/user-service');
const certificationChallengesService = require('../../../../lib/domain/services/certification-challenges-service');
const assessmentRepository = require('../../../../lib/infrastructure/repositories/assessment-repository');
const assessmentResultRepository = require('../../../../lib/infrastructure/repositories/assessment-result-repository');
const answersRepository = require('../../../../lib/infrastructure/repositories/answer-repository');
const certificationChallengesRepository = require('../../../../lib/infrastructure/repositories/certification-challenge-repository');
const certificationCourseRepository = require('../../../../lib/infrastructure/repositories/certification-course-repository');
const challengeRepository = require('../../../../lib/infrastructure/repositories/challenge-repository');

const competenceRepository = require('../../../../lib/infrastructure/repositories/competence-repository');

function _buildAnswer(challengeId, result) {
  return new Answer({ id: 'answer_id', challengeId, result, value: 'something' });
}

function _buildCompetenceMarks(level, score, area_code, competence_code) {
  return new CompetenceMarks({ level, score, area_code, competence_code });
}

function _buildAssessmentResult(pixScore, level) {
  return new AssessmentResult({
    id: 'assessment_result_id',
    pixScore,
    level,
    emitter: 'PIX-ALGO',
  });
}

function _buildCertificationChallenge(challengeId, competenceId, associatedSkillName) {
  return CertificationChallenge.fromAttributes({ challengeId, competenceId, associatedSkillName });
}

function _buildChallenge(id, competence, type) {
  return { id, competence, type, testedSkill: '@skill' };
}

function _buildAssessment(courseId, pixScore, estimatedLevel) {
  const assessmentResult = factory.buildAssessmentResult({ pixScore, level: estimatedLevel });
  const assessment = factory.buildAssessment({
    pixScore,
    level: estimatedLevel,
    assessmentResults: [assessmentResult],
    courseId });
  return assessment;
}

const pixForCompetence1 = 10;
const pixForCompetence2 = 20;
const pixForCompetence3 = 30;
const pixForCompetence4 = 40;
const UNCERTIFIED_LEVEL = -1;

const challengesFromAirTable = [
  _buildChallenge('challenge_A_for_competence_1', 'competence_1', 'QCM'),
  _buildChallenge('challenge_B_for_competence_1', 'competence_1', 'QCM'),
  _buildChallenge('challenge_C_for_competence_1', 'competence_1', 'QCM'),
  _buildChallenge('challenge_D_for_competence_2', 'competence_2', 'QCM'),
  _buildChallenge('challenge_E_for_competence_2', 'competence_2', 'QCM'),
  _buildChallenge('challenge_F_for_competence_2', 'competence_2', 'QCM'),
  _buildChallenge('challenge_G_for_competence_3', 'competence_3', 'QCM'),
  _buildChallenge('challenge_H_for_competence_3', 'competence_3', 'QCM'),
  _buildChallenge('challenge_I_for_competence_3', 'competence_3', 'QCM'),
  _buildChallenge('challenge_J_for_competence_4', 'competence_4', 'QCM'),
  _buildChallenge('challenge_K_for_competence_4', 'competence_4', 'QCM'),
  _buildChallenge('challenge_L_for_competence_4', 'competence_4', 'QCM'),
];

const challenges = [
  _buildCertificationChallenge('challenge_A_for_competence_1', 'competence_1', '@skillChallengeA_1'),
  _buildCertificationChallenge('challenge_C_for_competence_1', 'competence_1', '@skillChallengeC_1'),
  _buildCertificationChallenge('challenge_B_for_competence_1', 'competence_1', '@skillChallengeB_1'),
  _buildCertificationChallenge('challenge_D_for_competence_2', 'competence_2', '@skillChallengeD_2'),
  _buildCertificationChallenge('challenge_E_for_competence_2', 'competence_2', '@skillChallengeE_2'),
  _buildCertificationChallenge('challenge_F_for_competence_2', 'competence_2', '@skillChallengeF_2'),
  _buildCertificationChallenge('challenge_G_for_competence_3', 'competence_3', '@skillChallengeG_3'),
  _buildCertificationChallenge('challenge_H_for_competence_3', 'competence_3', '@skillChallengeH_3'),
  _buildCertificationChallenge('challenge_I_for_competence_3', 'competence_3', '@skillChallengeI_3'),
  _buildCertificationChallenge('challenge_J_for_competence_4', 'competence_4', '@skillChallengeJ_4'),
  _buildCertificationChallenge('challenge_K_for_competence_4', 'competence_4', '@skillChallengeK_4'),
  _buildCertificationChallenge('challenge_L_for_competence_4', 'competence_4', '@skillChallengeL_4'),
];

const assessments = [
  _buildAssessment('competence_1', pixForCompetence1, 1),
  _buildAssessment('competence_2', pixForCompetence2, 2),
  _buildAssessment('competence_3', pixForCompetence3, 3),
  _buildAssessment('competence_4', pixForCompetence4, 4),
];

const competencesFromAirtable = [
  new Competence({ id: 'competence_1', index: '1.1', name: 'Mener une recherche', courseId: 'competence_1' }),
  new Competence({ id: 'competence_2', index: '2.2', name: 'Partager', courseId: 'competence_2' }),
  new Competence({ id: 'competence_3', index: '3.3', name: 'Adapter', courseId: 'competence_3' }),
  new Competence({ id: 'competence_4', index: '4.4', name: 'Résoudre', courseId: 'competence_4' }),
  new Competence({ id: 'competence_5', index: '5.5', name: 'Chercher', courseId: 'competence_5' }),
  new Competence({ id: 'competence_6', index: '6.6', name: 'Trouver', courseId: 'competence_6' }),
];

function _buildCorrectAnswersForAllChallenges() {
  return [
    _buildAnswer('challenge_A_for_competence_1', 'ok'),
    _buildAnswer('challenge_B_for_competence_1', 'ok'),
    _buildAnswer('challenge_C_for_competence_1', 'ok'),
    _buildAnswer('challenge_D_for_competence_2', 'ok'),
    _buildAnswer('challenge_E_for_competence_2', 'ok'),
    _buildAnswer('challenge_F_for_competence_2', 'ok'),
    _buildAnswer('challenge_G_for_competence_3', 'ok'),
    _buildAnswer('challenge_H_for_competence_3', 'ok'),
    _buildAnswer('challenge_I_for_competence_3', 'ok'),
    _buildAnswer('challenge_J_for_competence_4', 'ok'),
    _buildAnswer('challenge_K_for_competence_4', 'ok'),
    _buildAnswer('challenge_L_for_competence_4', 'ok'),
  ];
}

function _buildWrongAnswersForAllChallenges() {
  return [
    _buildAnswer('challenge_A_for_competence_1', 'ko'),
    _buildAnswer('challenge_B_for_competence_1', 'ko'),
    _buildAnswer('challenge_C_for_competence_1', 'ko'),
    _buildAnswer('challenge_D_for_competence_2', 'ko'),
    _buildAnswer('challenge_E_for_competence_2', 'ko'),
    _buildAnswer('challenge_F_for_competence_2', 'ko'),
    _buildAnswer('challenge_G_for_competence_3', 'ko'),
    _buildAnswer('challenge_H_for_competence_3', 'ko'),
    _buildAnswer('challenge_I_for_competence_3', 'ko'),
    _buildAnswer('challenge_J_for_competence_4', 'ko'),
    _buildAnswer('challenge_K_for_competence_4', 'ko'),
    _buildAnswer('challenge_L_for_competence_4', 'ko'),
  ];
}

function _buildAnswersToHaveOnlyTheLastCompetenceFailed() {
  return [
    _buildAnswer('challenge_A_for_competence_1', 'ok'),
    _buildAnswer('challenge_B_for_competence_1', 'ok'),
    _buildAnswer('challenge_C_for_competence_1', 'ok'),
    _buildAnswer('challenge_D_for_competence_2', 'ok'),
    _buildAnswer('challenge_E_for_competence_2', 'ok'),
    _buildAnswer('challenge_F_for_competence_2', 'ok'),
    _buildAnswer('challenge_G_for_competence_3', 'ok'),
    _buildAnswer('challenge_H_for_competence_3', 'ok'),
    _buildAnswer('challenge_I_for_competence_3', 'ok'),
    _buildAnswer('challenge_J_for_competence_4', 'ko'),
    _buildAnswer('challenge_K_for_competence_4', 'ko'),
    _buildAnswer('challenge_L_for_competence_4', 'ko'),
  ];
}

function _buildAnswersToHaveAThirdOfTheCompetencesFailedAndReproductibilityRateLessThan80() {
  return [
    _buildAnswer('challenge_A_for_competence_1', 'ok'),
    _buildAnswer('challenge_B_for_competence_1', 'ko'),
    _buildAnswer('challenge_C_for_competence_1', 'ok'),
    _buildAnswer('challenge_D_for_competence_2', 'ok'),
    _buildAnswer('challenge_E_for_competence_2', 'ok'),
    _buildAnswer('challenge_F_for_competence_2', 'ok'),
    _buildAnswer('challenge_G_for_competence_3', 'ok'),
    _buildAnswer('challenge_H_for_competence_3', 'ko'),
    _buildAnswer('challenge_I_for_competence_3', 'ko'),
    _buildAnswer('challenge_J_for_competence_4', 'ok'),
    _buildAnswer('challenge_K_for_competence_4', 'ko'),
    _buildAnswer('challenge_L_for_competence_4', 'ok'),
  ];
}

const totalPix = pixForCompetence1 + pixForCompetence2 + pixForCompetence3 + pixForCompetence4;

describe('Unit | Service | Certification Service', function() {

  describe('#calculateCertificationResultByCertificationCourseId', () => {

    let sandbox;
    const dateCreationCertif = '2018-01-01';
    const certificationAssessment = Assessment.fromAttributes({
      id: 'assessment_id',
      userId: 'user_id',
      courseId: 'course_id',
      createdAt: dateCreationCertif,
      state: 'completed',
    });

    const certificationCourse = { id: 'course1', status: 'completed', completedAt: dateCreationCertif };

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(assessmentRepository, 'getByCertificationCourseId').resolves(certificationAssessment);
      sandbox.stub(assessmentRepository, 'findLastCompletedAssessmentsForEachCoursesByUser').resolves(assessments);
      sandbox.stub(answersRepository, 'findByAssessment').resolves(_buildWrongAnswersForAllChallenges());
      sandbox.stub(certificationChallengesRepository, 'findByCertificationCourseId').resolves(challenges);
      sandbox.stub(certificationCourseRepository, 'get').resolves(certificationCourse);
      sandbox.stub(competenceRepository, 'list').resolves(competencesFromAirtable);
      sandbox.stub(challengeRepository, 'list').resolves(challengesFromAirTable);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call Assessment Repository to get Assessment by CertificationCourseId', function() {
      // when
      const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

      // then
      return promise.then(() => {
        sinon.assert.calledOnce(assessmentRepository.getByCertificationCourseId);
        sinon.assert.calledWith(assessmentRepository.getByCertificationCourseId, 'course_id');
      });
    });

    it('should call Answers Repository to get Answers of certification', function() {
      // when
      const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

      // then
      return promise.then(() => {
        sinon.assert.calledOnce(answersRepository.findByAssessment);
        sinon.assert.calledWith(answersRepository.findByAssessment, certificationAssessment.id);
      });
    });

    it('should call Certification Challenges Repository to find challenges by certification id', function() {
      // when
      const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

      // then
      return promise.then(() => {
        sinon.assert.calledOnce(certificationChallengesRepository.findByCertificationCourseId);
        sinon.assert.calledWith(certificationChallengesRepository.findByCertificationCourseId, 'course_id');
      });
    });

    it('should call challenge Repository to get List', function() {
      // when
      const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

      // then
      return promise.then(() => {
        sinon.assert.calledOnce(challengeRepository.list);
      });
    });

    it('should call assessment Repository to findLastCompletedAssessmentsForEachCoursesByUser', function() {
      // when
      const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

      // then
      return promise.then(() => {
        sinon.assert.calledOnce(assessmentRepository.findLastCompletedAssessmentsForEachCoursesByUser);
        sinon.assert.calledWith(assessmentRepository.findLastCompletedAssessmentsForEachCoursesByUser, certificationAssessment.userId, dateCreationCertif);
      });
    });

    context('when reproductibility rate is < 50%', () => {

      it('should return totalScore = 0', () => {
        // given
        const answers = _buildWrongAnswersForAllChallenges();
        answersRepository.findByAssessment.resolves(answers);

        // when
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result.totalScore).to.equal(0);
        });
      });

      it('should return list of competences with all certifiedLevel at -1', () => {
        // given
        const answers = _buildWrongAnswersForAllChallenges();
        answersRepository.findByAssessment.resolves(answers);

        const expectedCertifiedCompetences = [{
          index: '1.1',
          id: 'competence_1',
          name: 'Mener une recherche',
          obtainedLevel: UNCERTIFIED_LEVEL,
          positionedLevel: 1,
          positionedScore: 10,
          obtainedScore: 0,
        }, {
          index: '2.2',
          id: 'competence_2',
          name: 'Partager',
          obtainedLevel: UNCERTIFIED_LEVEL,
          positionedLevel: 2,
          positionedScore: 20,
          obtainedScore: 0,
        }, {
          index: '3.3',
          id: 'competence_3',
          name: 'Adapter',
          obtainedLevel: UNCERTIFIED_LEVEL,
          positionedLevel: 3,
          positionedScore: 30,
          obtainedScore: 0,
        }, {
          index: '4.4',
          id: 'competence_4',
          name: 'Résoudre',
          obtainedLevel: UNCERTIFIED_LEVEL,
          positionedLevel: 4,
          positionedScore: 40,
          obtainedScore: 0,
        }];

        // when
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });
    });

    context('when reproductibility rate is between 80% and 100%', () => {

      beforeEach(() => {
        const answers = _buildCorrectAnswersForAllChallenges();
        answersRepository.findByAssessment.resolves(answers);
      });

      it('should ignore answers with no matching challenge', function() {
        // when
        certificationChallengesRepository.findByCertificationCourseId.resolves([]);
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result.totalScore).to.equal(0);
        });
      });

      it('should return totalScore = all pix', () => {
        // when
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result.totalScore).to.equal(totalPix);
        });
      });

      it('should return list of competences with all certifiedLevel equal to estimatedLevel', () => {
        // given
        const expectedCertifiedCompetences = [
          {
            index: '1.1',
            id: 'competence_1',
            name: 'Mener une recherche',
            obtainedLevel: 1,
            positionedLevel: 1,
            positionedScore: 10,
            obtainedScore: pixForCompetence1,
          }, {
            index: '2.2',
            id: 'competence_2',
            name: 'Partager',
            obtainedLevel: 2,
            positionedLevel: 2,
            positionedScore: 20,
            obtainedScore: pixForCompetence2,
          }, {
            index: '3.3',
            id: 'competence_3',
            name: 'Adapter',
            obtainedLevel: 3,
            positionedLevel: 3,
            positionedScore: 30,
            obtainedScore: pixForCompetence3,
          }, {
            index: '4.4',
            id: 'competence_4',
            name: 'Résoudre',
            obtainedLevel: 4,
            positionedLevel: 4,
            positionedScore: 40,
            obtainedScore: pixForCompetence4,
          },
        ];

        // when
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });

      it('should return totalScore = (all pix - one competence pix) when one competence is totally false', () => {
        // given
        const answers = _buildAnswersToHaveOnlyTheLastCompetenceFailed();
        answersRepository.findByAssessment.resolves(answers);

        // when
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result.totalScore).to.equal(totalPix - pixForCompetence4);
        });
      });

      it('should return list of competences with certifiedLevel = estimatedLevel except for failed competence', () => {
        // given
        const answers = _buildAnswersToHaveOnlyTheLastCompetenceFailed();
        answersRepository.findByAssessment.resolves(answers);
        const expectedCertifiedCompetences = [{
          index: '1.1',
          id: 'competence_1',
          name: 'Mener une recherche',
          obtainedLevel: 1,
          positionedLevel: 1,
          positionedScore: 10,
          obtainedScore: pixForCompetence1,
        }, {
          index: '2.2',
          id: 'competence_2',
          name: 'Partager',
          obtainedLevel: 2,
          positionedLevel: 2,
          positionedScore: 20,
          obtainedScore: pixForCompetence2,
        }, {
          index: '3.3',
          id: 'competence_3',
          name: 'Adapter',
          obtainedLevel: 3,
          positionedLevel: 3,
          positionedScore: 30,
          obtainedScore: pixForCompetence3,
        }, {
          index: '4.4',
          id: 'competence_4',
          name: 'Résoudre',
          obtainedLevel: UNCERTIFIED_LEVEL,

          positionedLevel: 4,
          positionedScore: 40,
          obtainedScore: 0,
        }];

        // when
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });
    });

    context('when reproductibility rate is between 50% and 80%', () => {
      beforeEach(() => {
        const answers = _buildAnswersToHaveAThirdOfTheCompetencesFailedAndReproductibilityRateLessThan80();
        answersRepository.findByAssessment.resolves(answers);
      });

      it('should return totalScore = all pix minus 8 for one competence with 1 error and minus all pix for others false competences', () => {
        // given
        const malusForFalseAnswer = 8;
        const expectedScore = totalPix - pixForCompetence3 - 2 * malusForFalseAnswer;

        // when
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result.totalScore).to.equal(expectedScore);
        });
      });

      it('should return list of competences with certifiedLevel less or equal to estimatedLevel', () => {
        // given
        const malusForFalseAnswer = 8;
        const expectedCertifiedCompetences = [{
          index: '1.1',
          id: 'competence_1',
          name: 'Mener une recherche',
          obtainedLevel: 0,
          positionedLevel: 1,
          positionedScore: 10,
          obtainedScore: pixForCompetence1 - malusForFalseAnswer,
        }, {
          index: '2.2',
          id: 'competence_2',
          name: 'Partager',
          obtainedLevel: 2,
          positionedLevel: 2,
          positionedScore: 20,
          obtainedScore: pixForCompetence2,
        }, {
          index: '3.3',
          id: 'competence_3',
          name: 'Adapter',
          obtainedLevel: UNCERTIFIED_LEVEL,

          positionedLevel: 3,
          positionedScore: 30,
          obtainedScore: 0,
        }, {
          index: '4.4',
          id: 'competence_4',
          name: 'Résoudre',
          obtainedLevel: 3,
          positionedLevel: 4,
          positionedScore: 40,
          obtainedScore: pixForCompetence4 - malusForFalseAnswer,
        }];

        // when
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });

      it('should return a object contains information about competences and challenges', () => {
        // given
        const malusForFalseAnswer = 8;
        const expectedCertifiedCompetences = [{
          index: '1.1',
          id: 'competence_1',
          name: 'Mener une recherche',
          obtainedLevel: 0,
          positionedLevel: 1,
          positionedScore: 10,
          obtainedScore: pixForCompetence1 - malusForFalseAnswer,
        }, {
          index: '2.2',
          id: 'competence_2',
          name: 'Partager',
          obtainedLevel: 2,
          positionedLevel: 2,
          positionedScore: 20,
          obtainedScore: pixForCompetence2,
        }, {
          index: '3.3',
          id: 'competence_3',
          name: 'Adapter',
          positionedLevel: 3,
          positionedScore: 30,
          obtainedLevel: UNCERTIFIED_LEVEL,

          obtainedScore: 0,
        }, {
          index: '4.4',
          id: 'competence_4',
          name: 'Résoudre',
          obtainedLevel: 3,
          positionedLevel: 4,
          positionedScore: 40,
          obtainedScore: pixForCompetence4 - malusForFalseAnswer,
        }];

        const expectedChallenges = [
          {
            challengeId: 'challenge_A_for_competence_1',
            competence: '1.1',
            skill: '@skillChallengeA_1',
            result: 'ok',
            value: 'something',
          },
          {
            challengeId: 'challenge_B_for_competence_1',
            competence: '1.1',
            skill: '@skillChallengeB_1',
            result: 'ko',
            value: 'something',
          },
          {
            challengeId: 'challenge_C_for_competence_1',
            competence: '1.1',
            skill: '@skillChallengeC_1',
            result: 'ok',
            value: 'something',
          },
          {
            challengeId: 'challenge_D_for_competence_2',
            competence: '2.2',
            skill: '@skillChallengeD_2',
            result: 'ok',
            value: 'something',
          },
          {
            challengeId: 'challenge_E_for_competence_2',
            competence: '2.2',
            skill: '@skillChallengeE_2',
            result: 'ok',
            value: 'something',
          },
          {
            challengeId: 'challenge_F_for_competence_2',
            competence: '2.2',
            skill: '@skillChallengeF_2',
            result: 'ok',
            value: 'something',
          },
          {
            challengeId: 'challenge_G_for_competence_3',
            competence: '3.3',
            skill: '@skillChallengeG_3',
            result: 'ok',
            value: 'something',
          },
          {
            challengeId: 'challenge_H_for_competence_3',
            competence: '3.3',
            skill: '@skillChallengeH_3',
            result: 'ko',
            value: 'something',
          },
          {
            challengeId: 'challenge_I_for_competence_3',
            competence: '3.3',
            skill: '@skillChallengeI_3',
            result: 'ko',
            value: 'something',
          },
          {
            challengeId: 'challenge_J_for_competence_4',
            competence: '4.4',
            skill: '@skillChallengeJ_4',
            result: 'ok',
            value: 'something',
          },
          {
            challengeId: 'challenge_K_for_competence_4',
            competence: '4.4',
            skill: '@skillChallengeK_4',
            result: 'ko',
            value: 'something',
          },
          {
            challengeId: 'challenge_L_for_competence_4',
            competence: '4.4',
            skill: '@skillChallengeL_4',
            result: 'ok',
            value: 'something',
          },

        ];
        const expectedResult = {
          competencesWithMark: expectedCertifiedCompetences,
          listChallengesAndAnswers: expectedChallenges,
          percentageCorrectAnswers: 67,
          status: 'completed',
          totalScore: 54,
          userId: 'user_id',
          completedAt: dateCreationCertif,
          createdAt: dateCreationCertif,
        };

        // when
        const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

        // then
        return promise.then((result) => {
          expect(result).to.deep.equal(expectedResult);
        });
      });

      context('when one competence is evaluated with 3 challenges', () => {

        context('with one OK, one KO and one QROCM-dep OK', () => {

          it('should return level obtained equal to level positioned minus one', function() {
            // Given
            const positionedLevel = 2;
            const positionedScore = 20;

            const answers = [
              _buildAnswer('challenge_A_for_competence_1', 'ok'),
              _buildAnswer('challenge_B_for_competence_1', 'ok'),
              _buildAnswer('challenge_C_for_competence_1', 'ko'),
            ];

            const challenges = [
              _buildCertificationChallenge('challenge_A_for_competence_1', 'competence_1', '@skillChallengeA_1'),
              _buildCertificationChallenge('challenge_B_for_competence_1', 'competence_1', '@skillChallengeB_1'),
              _buildCertificationChallenge('challenge_C_for_competence_1', 'competence_1', '@skillChallengeC_1'),
            ];

            const userProfile = [
              _buildAssessment('competence_1', positionedScore, positionedLevel),
            ];

            answersRepository.findByAssessment.resolves(answers);
            certificationChallengesRepository.findByCertificationCourseId.resolves(challenges);
            assessmentRepository.findLastCompletedAssessmentsForEachCoursesByUser.resolves(userProfile);

            // When
            const promise = certificationService.calculateCertificationResultByCertificationCourseId('course_id');

            // Then
            return promise.then((result) => {
              expect(result.competencesWithMark[0].obtainedLevel).to.deep.equal(positionedLevel - 1);
              expect(result.competencesWithMark[0].obtainedScore).to.deep.equal(positionedScore - 8);
            });
          });

        });

      });

    });
  });

  describe('#calculateCertificationResultByAssessmentId', () => {

    let sandbox;
    const certificationCourse = { id: 'course1', status: 'completed' };
    const dateCreationCertif = '2018-02-02';

    const certificationAssessment = Assessment.fromAttributes({
      id: 'assessment_id',
      userId: 'user_id',
      createdAt: dateCreationCertif,
      courseId: 'course_id',
      status: 'completed',
    });

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(assessmentRepository, 'get').resolves(certificationAssessment);
      sandbox.stub(assessmentRepository, 'findLastCompletedAssessmentsForEachCoursesByUser').resolves(assessments);
      sandbox.stub(answersRepository, 'findByAssessment').resolves(_buildWrongAnswersForAllChallenges());
      sandbox.stub(certificationChallengesRepository, 'findByCertificationCourseId').resolves(challenges);
      sandbox.stub(certificationCourseRepository, 'get').resolves(certificationCourse);
      sandbox.stub(competenceRepository, 'list').resolves(competencesFromAirtable);
      sandbox.stub(challengeRepository, 'list').resolves(challengesFromAirTable);

    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should call Assessment Repository to get Assessment by CertificationCourseId', function() {
      // when
      const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

      // then
      return promise.then(() => {
        expect(assessmentRepository.get).to.have.been.calledWith('assessment_id');
      });
    });

    it('should call Answers Repository to get Answers of certification', function() {
      // when
      const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

      // then
      return promise.then(() => {
        sinon.assert.calledOnce(answersRepository.findByAssessment);
        sinon.assert.calledWith(answersRepository.findByAssessment, certificationAssessment.id);
      });
    });

    it('should call Certification Challenges Repository to find challenges by certification id', function() {
      // when
      const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

      // then
      return promise.then(() => {
        sinon.assert.calledOnce(certificationChallengesRepository.findByCertificationCourseId);
        sinon.assert.calledWith(certificationChallengesRepository.findByCertificationCourseId, 'course_id');
      });
    });

    it('should call challenge Repository to get List', function() {
      // when
      const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

      // then
      return promise.then(() => {
        sinon.assert.calledOnce(challengeRepository.list);
      });
    });

    it('should call assessment Repository to findLastCompletedAssessmentsForEachCoursesByUser', function() {
      // when
      const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

      // then
      return promise.then(() => {
        sinon.assert.calledOnce(assessmentRepository.findLastCompletedAssessmentsForEachCoursesByUser);
        sinon.assert.calledWith(assessmentRepository.findLastCompletedAssessmentsForEachCoursesByUser, certificationAssessment.userId, dateCreationCertif);
      });
    });

    context('when reproductibility rate is < 50%', () => {

      it('should return totalScore = 0', () => {
        // given
        const answers = _buildWrongAnswersForAllChallenges();
        answersRepository.findByAssessment.resolves(answers);

        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.totalScore).to.equal(0);
        });
      });

      it('should return list of competences with all certifiedLevel at -1', () => {
        // given
        const answers = _buildWrongAnswersForAllChallenges();
        answersRepository.findByAssessment.resolves(answers);

        const expectedCertifiedCompetences = [{
          index: '1.1',
          id: 'competence_1',
          name: 'Mener une recherche',
          obtainedLevel: UNCERTIFIED_LEVEL,

          positionedLevel: 1,
          positionedScore: 10,
          obtainedScore: 0,
        }, {
          index: '2.2',
          id: 'competence_2',
          name: 'Partager',
          obtainedLevel: UNCERTIFIED_LEVEL,

          positionedLevel: 2,
          positionedScore: 20,
          obtainedScore: 0,
        }, {
          index: '3.3',
          id: 'competence_3',
          name: 'Adapter',
          obtainedLevel: UNCERTIFIED_LEVEL,

          positionedLevel: 3,
          positionedScore: 30,
          obtainedScore: 0,
        }, {
          index: '4.4',
          id: 'competence_4',
          name: 'Résoudre',
          obtainedLevel: UNCERTIFIED_LEVEL,

          positionedLevel: 4,
          positionedScore: 40,
          obtainedScore: 0,
        }];

        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });
    });

    context('when reproductibility rate is between 80% and 100%', () => {

      beforeEach(() => {
        const answers = _buildCorrectAnswersForAllChallenges();
        answersRepository.findByAssessment.resolves(answers);
      });

      it('should return totalScore = all pix', () => {
        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.totalScore).to.equal(totalPix);
        });
      });

      it('should fail if an answer has no matching challenge', function() {
        // when
        const answers = _buildCorrectAnswersForAllChallenges().concat([_buildAnswer('non_existing_challenge', 'ok')]);
        answersRepository.findByAssessment.resolves(answers);
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return expect(promise).to.be.rejectedWith(CertificationComputeError,
          'Problème de chargement de la compétence pour le challenge non_existing_challenge');
      });

      it('should return list of competences with all certifiedLevel equal to estimatedLevel', () => {
        // given

        const expectedCertifiedCompetences = [
          {
            index: '1.1',
            id: 'competence_1',
            name: 'Mener une recherche',
            obtainedLevel: 1,
            positionedLevel: 1,
            positionedScore: 10,
            obtainedScore: pixForCompetence1,
          }, {
            index: '2.2',
            id: 'competence_2',
            name: 'Partager',
            obtainedLevel: 2,
            positionedLevel: 2,
            positionedScore: 20,
            obtainedScore: pixForCompetence2,
          }, {
            index: '3.3',
            id: 'competence_3',
            name: 'Adapter',
            obtainedLevel: 3,
            positionedLevel: 3,
            positionedScore: 30,
            obtainedScore: pixForCompetence3,
          }, {
            index: '4.4',
            id: 'competence_4',
            name: 'Résoudre',
            obtainedLevel: 4,
            positionedLevel: 4,
            positionedScore: 40,
            obtainedScore: pixForCompetence4,
          },
        ];

        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });

      it('should return totalScore = (all pix - one competence pix) when one competence is totally false', () => {
        // given
        const answers = _buildAnswersToHaveOnlyTheLastCompetenceFailed();
        answersRepository.findByAssessment.resolves(answers);

        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.totalScore).to.equal(totalPix - pixForCompetence4);
        });
      });

      it('should return list of competences with certifiedLevel = estimatedLevel except for failed competence', () => {
        // given
        const answers = _buildAnswersToHaveOnlyTheLastCompetenceFailed();
        answersRepository.findByAssessment.resolves(answers);
        const expectedCertifiedCompetences = [{
          index: '1.1',
          id: 'competence_1',
          name: 'Mener une recherche',
          obtainedLevel: 1,
          positionedLevel: 1,
          positionedScore: 10,
          obtainedScore: pixForCompetence1,
        }, {
          index: '2.2',
          id: 'competence_2',
          name: 'Partager',
          obtainedLevel: 2,
          positionedLevel: 2,
          positionedScore: 20,
          obtainedScore: pixForCompetence2,
        }, {
          index: '3.3',
          id: 'competence_3',
          name: 'Adapter',
          obtainedLevel: 3,
          positionedLevel: 3,
          positionedScore: 30,
          obtainedScore: pixForCompetence3,
        }, {
          index: '4.4',
          id: 'competence_4',
          name: 'Résoudre',
          obtainedLevel: UNCERTIFIED_LEVEL,
          positionedLevel: 4,
          positionedScore: 40,
          obtainedScore: 0,
        }];

        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });
    });

    context('when reproductibility rate is between 50% and 80%', () => {

      beforeEach(() => {
        const answers = _buildAnswersToHaveAThirdOfTheCompetencesFailedAndReproductibilityRateLessThan80();
        answersRepository.findByAssessment.resolves(answers);
      });

      it('should return totalScore = all pix minus 8 for one competence with 1 error and minus all pix for others false competences', () => {
        // given
        const malusForFalseAnswer = 8;
        const expectedScore = totalPix - pixForCompetence3 - 2 * malusForFalseAnswer;

        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.totalScore).to.equal(expectedScore);
        });
      });

      it('should return list of competences with certifiedLevel less or equal to estimatedLevel', () => {
        // given
        const malusForFalseAnswer = 8;
        const expectedCertifiedCompetences = [{
          index: '1.1',
          id: 'competence_1',
          name: 'Mener une recherche',
          obtainedLevel: 0,
          positionedLevel: 1,
          positionedScore: 10,
          obtainedScore: pixForCompetence1 - malusForFalseAnswer,
        }, {
          index: '2.2',
          id: 'competence_2',
          name: 'Partager',
          obtainedLevel: 2,
          positionedLevel: 2,
          positionedScore: 20,
          obtainedScore: pixForCompetence2,
        }, {
          index: '3.3',
          id: 'competence_3',
          name: 'Adapter',
          obtainedLevel: UNCERTIFIED_LEVEL,
          positionedLevel: 3,
          positionedScore: 30,
          obtainedScore: 0,
        }, {
          index: '4.4',
          id: 'competence_4',
          name: 'Résoudre',
          obtainedLevel: 3,
          positionedLevel: 4,
          positionedScore: 40,
          obtainedScore: pixForCompetence4 - malusForFalseAnswer,
        }];

        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });

    });

    context('when challenges contains one QROCM-dep challenge to validate two skills', () => {
      beforeEach(() => {
        const listChallengeComp5WithOneQROCMDEPChallengeAndAnother = [_buildChallenge('challenge_A_for_competence_5', 'competence_5', 'QCM'),
          _buildChallenge('challenge_B_for_competence_5', 'competence_5', 'QROCM-dep'),
          _buildChallenge('challenge_A_for_competence_6', 'competence_6', 'QCM'),
          _buildChallenge('challenge_B_for_competence_6', 'competence_6', 'QCM'),
          _buildChallenge('challenge_C_for_competence_6', 'competence_6', 'QCM')];

        const assessments = [
          _buildAssessment('competence_5', 50, 5),
          _buildAssessment('competence_6', 36, 3),
        ];

        const challenges = [
          _buildCertificationChallenge('challenge_A_for_competence_5', 'competence_5', '@skillChallengeA_5'),
          _buildCertificationChallenge('challenge_B_for_competence_5', 'competence_5', '@skillChallengeB_5'),
          _buildCertificationChallenge('challenge_A_for_competence_6', 'competence_6', '@skillChallengeA_6'),
          _buildCertificationChallenge('challenge_B_for_competence_6', 'competence_6', '@skillChallengeB_6'),
          _buildCertificationChallenge('challenge_C_for_competence_6', 'competence_6', '@skillChallengeC_6'),
        ];

        challengeRepository.list.resolves(listChallengeComp5WithOneQROCMDEPChallengeAndAnother);
        certificationChallengesRepository.findByCertificationCourseId.resolves(challenges);
        assessmentRepository.findLastCompletedAssessmentsForEachCoursesByUser.resolves(assessments);

      });

      it('should compute the result as if QROCM-dep was two OK challenges', function() {
        // given
        answersRepository.findByAssessment.resolves([
          _buildAnswer('challenge_A_for_competence_5', 'ok'),
          _buildAnswer('challenge_B_for_competence_5', 'ok'),
          _buildAnswer('challenge_A_for_competence_6', 'ko'),
          _buildAnswer('challenge_B_for_competence_6', 'ok'),
          _buildAnswer('challenge_C_for_competence_6', 'ko'),
        ]);

        const expectedCertifiedCompetences = [{
          index: '5.5',
          id: 'competence_5',
          name: 'Chercher',
          obtainedLevel: 5,
          positionedLevel: 5,
          positionedScore: 50,
          obtainedScore: 50,
        }, {
          index: '6.6',
          id: 'competence_6',
          name: 'Trouver',
          obtainedLevel: UNCERTIFIED_LEVEL,
          positionedLevel: 3,
          positionedScore: 36,
          obtainedScore: 0,
        }];

        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });

      it('should compute the result of QROCM-dep as only one OK because result is partially right', function() {
        // given
        answersRepository.findByAssessment.resolves([
          _buildAnswer('challenge_A_for_competence_5', 'ok'),
          _buildAnswer('challenge_B_for_competence_5', 'partially'),
          _buildAnswer('challenge_A_for_competence_6', 'ko'),
          _buildAnswer('challenge_B_for_competence_6', 'ok'),
          _buildAnswer('challenge_C_for_competence_6', 'ok'),
        ]);

        const expectedCertifiedCompetences = [{
          index: '5.5',
          id: 'competence_5',
          name: 'Chercher',
          obtainedLevel: 4,
          positionedLevel: 5,
          positionedScore: 50,
          obtainedScore: 42,
        }, {
          index: '6.6',
          id: 'competence_6',
          name: 'Trouver',
          obtainedLevel: 2,
          positionedLevel: 3,
          positionedScore: 36,
          obtainedScore: 28,
        }];

        // when
        const promise = certificationService.calculateCertificationResultByAssessmentId('assessment_id');

        // then
        return promise.then((result) => {
          expect(result.competencesWithMark).to.deep.equal(expectedCertifiedCompetences);
        });
      });
    });

  });

  describe('#startNewCertification', () => {

    let clock;
    let sandbox;

    const certificationCourse = { id: 'newlyCreatedCertificationCourse' };
    const certificationCourseWithNbOfChallenges = { id: 'certificationCourseWithChallenges', nbChallenges: 3 };
    const sessionId = 23;

    beforeEach(() => {
      clock = sinon.useFakeTimers(new Date('2018-02-04T01:00:00.000+01:00'));
      sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
      clock.restore();
      sandbox.restore();
    });

    const noCompetences = [];
    const oneCompetenceWithLevel0 = [{ id: 'competence1', estimatedLevel: 0 }];
    const oneCompetenceWithLevel5 = [{ id: 'competence1', estimatedLevel: 5 }];
    const fiveCompetencesAndOneWithLevel0 = [
      { id: 'competence1', estimatedLevel: 1 },
      { id: 'competence2', estimatedLevel: 2 },
      { id: 'competence3', estimatedLevel: 0 },
      { id: 'competence4', estimatedLevel: 4 },
      { id: 'competence5', estimatedLevel: 5 },
    ];
    const fiveCompetencesWithLevelHigherThan0 = [
      { id: 'competence1', estimatedLevel: 1 },
      { id: 'competence2', estimatedLevel: 0 },
      { id: 'competence3', estimatedLevel: 3 },
      { id: 'competence4', estimatedLevel: 4 },
      { id: 'competence5', estimatedLevel: 5 },
      { id: 'competence6', estimatedLevel: 6 },
    ];

    [{ label: 'User Has No AirtableCompetence', competences: noCompetences },
      { label: 'User Has Only 1 AirtableCompetence at Level 0', competences: oneCompetenceWithLevel0 },
      { label: 'User Has Only 1 AirtableCompetence at Level 5', competences: oneCompetenceWithLevel5 },
      { label: 'User Has 5 Competences with 1 at Level 0', competences: fiveCompetencesAndOneWithLevel0 },
    ].forEach(function(testCase) {
      it(`should not create a new certification if ${testCase.label}`, function() {
        // given
        const userId = 12345;
        sandbox.stub(userService, 'getProfileToCertify').resolves(testCase.competences);
        sandbox.stub(certificationCourseRepository, 'save');

        // when
        const createNewCertificationPromise = certificationService.startNewCertification(userId, sessionId);

        // then
        return createNewCertificationPromise.catch((error) => {
          expect(error).to.be.an.instanceOf(UserNotAuthorizedToCertifyError);
          sinon.assert.notCalled(certificationCourseRepository.save);
        });
      });
    });

    it('should create the certification course with status "started", if at least 5 competences with level higher than 0', function() {
      // given
      const userId = 12345;
      sandbox.stub(certificationCourseRepository, 'save').resolves(certificationCourse);
      sandbox.stub(userService, 'getProfileToCertify').resolves(fiveCompetencesWithLevelHigherThan0);
      sandbox.stub(certificationChallengesService, 'saveChallenges').resolves(certificationCourseWithNbOfChallenges);

      // when
      const promise = certificationService.startNewCertification(userId, sessionId);

      // then
      return promise.then((newCertification) => {
        sinon.assert.calledOnce(certificationCourseRepository.save);
        expect(certificationCourseRepository.save).to.have.been.calledWith(CertificationCourse.fromAttributes({ userId, sessionId }));
        expect(newCertification.id).to.equal('certificationCourseWithChallenges');
      });
    });

    it('should create the challenges for the certification course, based on the user profile', function() {
      // given
      const userId = 12345;
      sandbox.stub(certificationCourseRepository, 'save').resolves(certificationCourse);
      sandbox.stub(userService, 'getProfileToCertify').resolves(fiveCompetencesWithLevelHigherThan0);
      sandbox.stub(certificationChallengesService, 'saveChallenges').resolves(certificationCourseWithNbOfChallenges);

      // when
      const promise = certificationService.startNewCertification(userId);

      // then
      return promise.then((newCertification) => {
        expect(userService.getProfileToCertify).to.have.been.calledWith(userId, '2018-02-04T00:00:00.000Z');
        sinon.assert.calledOnce(certificationChallengesService.saveChallenges);
        expect(certificationChallengesService.saveChallenges).to.have.been.calledWith(fiveCompetencesWithLevelHigherThan0, certificationCourse);
        expect(newCertification.nbChallenges).to.equal(3);
      });
    });
  });

  describe('#getCertificationResult', () => {
    let sandbox;

    context('when certification is finished', () => {

      beforeEach(() => {
        sandbox = sinon.sandbox.create();
        const assessmentResult = _buildAssessmentResult(20, 3);
        sandbox.stub(assessmentRepository, 'getByCertificationCourseId').resolves(Assessment.fromAttributes({
          state: 'completed',
          assessmentResults: [
            _buildAssessmentResult(20, 3),
          ],
        }));
        sandbox.stub(certificationCourseRepository, 'get').resolves({
          createdAt: '2017-12-23 15:23:12',
          completedAt: '2017-12-23T16:23:12.232Z',
          firstName: 'Pumba',
          lastName: 'De La Savane',
          birthplace: 'Savane',
          birthdate: '28/01/1992',
          sessionId: 'MoufMufassa',
          externalId: 'TimonsFriend',
        });
        assessmentResult.competenceMarks = [_buildCompetenceMarks(3, 27, '2', '2.1')];
        sandbox.stub(assessmentResultRepository, 'get').resolves(
          assessmentResult,
        );
      });

      afterEach(() => {
        sandbox.restore();
      });

      it('should return certification results with pix score, date and certified competences levels', () => {
        // given
        const certificationCourseId = 1;

        // when
        const promise = certificationService.getCertificationResult(certificationCourseId);

        // then
        return promise.then((certification) => {
          expect(certification.pixScore).to.deep.equal(20);
          expect(certification.createdAt).to.deep.equal('2017-12-23 15:23:12');
          expect(certification.completedAt).to.deep.equal('2017-12-23T16:23:12.232Z');
          expect(certification.competencesWithMark).to.deep.equal([{
            area_code: '2',
            assessmentResultId: undefined,
            competence_code: '2.1',
            id: undefined,
            level: 3,
            score: 27,
          }]);
          expect(certification.sessionId).to.deep.equal('MoufMufassa');
        });
      });

      it('should return certified user informations', function() {
        // given
        const certificationCourseId = 1;

        // when
        const promise = certificationService.getCertificationResult(certificationCourseId);

        // then
        return promise.then((certification) => {
          expect(certification.firstName).to.deep.equal('Pumba');
          expect(certification.lastName).to.deep.equal('De La Savane');
          expect(certification.birthplace).to.deep.equal('Savane');
          expect(certification.birthdate).to.deep.equal('28/01/1992');
          expect(certification.externalId).to.deep.equal('TimonsFriend');
        });
      });

    });

    context('when certification is not finished', () => {

      beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(assessmentRepository, 'getByCertificationCourseId').resolves(Assessment.fromAttributes({
          state: 'started',
        }));
        sandbox.stub(certificationCourseRepository, 'get').resolves({
          createdAt: '2017-12-23 15:23:12',
          firstName: 'Pumba',
          lastName: 'De La Savane',
          birthplace: 'Savane',
          birthdate: '28/01/1992',
          sessionId: 'MoufMufassa',
          externalId: 'TimonsFriend',
        });
        sandbox.stub(assessmentResultRepository, 'get').resolves(null);
      });

      afterEach(() => {
        sandbox.restore();
      });

      it('should return certification results with state at started, empty marks and undefined for information not yet valid', () => {
        // given
        const certificationCourseId = 1;

        // when
        const promise = certificationService.getCertificationResult(certificationCourseId);

        // then
        return promise.then((certification) => {
          expect(certification.status).to.deep.equal('started');
          expect(certification.competencesWithMark).to.deep.equal([]);
          expect(certification.pixScore).to.deep.equal(undefined);
          expect(certification.completedAt).to.deep.equal(undefined);
          expect(certification.createdAt).to.deep.equal('2017-12-23 15:23:12');
          expect(certification.sessionId).to.deep.equal('MoufMufassa');
        });
      });

    });
  });
});

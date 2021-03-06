import {
  describe,
  it,
  beforeEach,
  afterEach
} from 'mocha';
import { expect } from 'chai';
import startApp from '../helpers/start-app';
import destroyApp from '../helpers/destroy-app';
import $ from 'jquery';
import { authenticateAsSimpleUser } from '../helpers/testing';
import defaultScenario from '../../mirage/scenarios/default';

describe('Acceptance | Points communs a toutes les épreuves | ', function() {

  let application;

  beforeEach(async function() {
    application = startApp();
    defaultScenario(server);
    await authenticateAsSimpleUser();
    await visit('/assessments/ref_assessment_id/challenges/ref_qrocm_challenge_id');
  });

  afterEach(function() {
    destroyApp(application);
  });

  it('Le nom du test est affiché', function() {
    expect(findWithAssert('.course-banner__name').text()).to.contain('First Course');
  });

  it('L\'instruction de l\'epreuve est affichée', function() {
    const $challengeInstruction = $('.challenge-statement__instruction');
    const instructiontext = 'Un QROCM est une question ouverte avec plusieurs champs texte libre pour repondre';
    expect($challengeInstruction.text().trim()).to.equal(instructiontext);
  });

  it('Le contenu de type [foo](bar) doit être converti sous forme de lien', function() {
    const $links = findWithAssert('.challenge-statement__instruction a');
    expect($links.length).to.equal(1);
    expect($links.text()).to.equal('ouverte');
    expect($links.attr('href')).to.equal('http://link.ouverte.url');
  });

  it('Les liens doivent s\'ouvrir dans un nouvel onglet', function() {
    const $links = findWithAssert('.challenge-statement__instruction a');
    expect($links.attr('target')).to.equal('_blank');
  });

  it('Un bouton de type "Skip" doit s\'afficher', function() {
    expect($('.challenge-actions__action-skip')).to.have.lengthOf(1);
  });

  it('Un bouton de type "Validate" doit s\'afficher', function() {
    expect($('.challenge-actions__action-skip')).to.have.lengthOf(1);
  });

  it('Il existe un bouton "Revenir à la liste des tests"', function() {
    const $courseListButton = findWithAssert('.course-banner__home-link');
    expect($courseListButton.text()).to.equal('Revenir à l\'accueil');
  });

  it('Quand je clique sur le bouton "Revenir à l\'accueil", je suis redirigé vers mon compte', function() {
    // when
    click('.course-banner__home-link');

    // then
    andThen(() => expect(currentURL()).to.equal('/compte'));
  });

  it('Il est possible de signaler l\'épreuve via le formulaire de Feedback', () => {
    expect($('.feedback-panel')).to.have.lengthOf(1);
  });
});

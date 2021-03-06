import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('login', { path: 'connexion' });

  this.route('authenticated', { path: '' }, function() {
    this.route('terms-of-service', { path: '/cgu'});
    this.route('campaigns', { path: '/campagnes' }, function() {
      this.route('new', { path: '/creation' });
      this.route('list', { path: '/liste' });
    });
  });

  this.route('logout');

  if (config.environment !== 'production') {
    this.route('style-guide', { path: 'guide-de-style' });
  }
});

export default Router;

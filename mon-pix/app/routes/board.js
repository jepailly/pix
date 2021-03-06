import { inject as service } from '@ember/service';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import BaseRoute from 'mon-pix/routes/base-route';
import RSVP from 'rsvp';
import ENV from 'mon-pix/config/environment';

export default BaseRoute.extend(AuthenticatedRouteMixin, {

  session: service(),

  model() {
    return this.get('store').findRecord('user', this.get('session.data.authenticated.userId'))
      .then((user) => {

        if (user.get('organizations.length') <= 0) {
          return this.transitionTo('compte');
        }
        const organization = user.get('organizations.firstObject');
        return RSVP.hash({
          organization,
          snapshots: organization.get('snapshots').reload(),
          organizationSnapshotsExportUrl:
            `${ENV.APP.API_HOST}/api/organizations/${organization.get('id')}/snapshots/export?userToken=${this.get('session.data.authenticated.token')}`
        });
      });
  }
});

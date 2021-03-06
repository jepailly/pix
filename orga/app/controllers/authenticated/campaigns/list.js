import Controller from '@ember/controller';
import { computed } from '@ember/object';

const SORTING_ORDER = ['name:asc', 'createdAt:desc'];

export default Controller.extend({
  sortingOrder: SORTING_ORDER,
  sortedCampaigns: computed.sort('model', 'sortingOrder'),
  hasCampaign: computed.notEmpty('model'),
});

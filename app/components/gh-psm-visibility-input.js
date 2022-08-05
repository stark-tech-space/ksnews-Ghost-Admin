import Component from '@ember/component';
import classic from 'ember-classic-decorator';
import { action, computed } from '@ember/object';
import { inject as service } from '@ember/service';

const VISIBILITIES = [
  { label: 'Public', name: 'public' },
  { label: 'Members_only', name: 'members' },
  { label: 'Paid-members_only', name: 'paid' },
];

@classic
export default class GhPsmVisibilityInput extends Component {
  @service settings;
  @service intl;

  // public attrs
  post = null;

  @computed('post.visibility')
  get selectedVisibility() {
    return this.get('post.visibility') || this.settings.get('defaultContentVisibility');
  }

  init() {
    super.init(...arguments);
    this.availableVisibilities = VISIBILITIES.map(({ label, name }) => ({
      label: this.intl.t(`Manual.Settings.${label}`),
      name: name,
    }));
    this.availableVisibilities.push({
      label: this.intl.t('Manual.Settings.Specific_tier_s'),
      name: 'tiers',
    });
  }

  @action
  updateVisibility(newVisibility) {
    this.post.set('visibility', newVisibility);
    if (newVisibility !== 'tiers') {
      this.post.set('tiers', []);
    }
  }
}

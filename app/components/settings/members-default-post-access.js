import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class SettingsMembersDefaultPostAccess extends Component {
  @service settings;
  @service feature;
  @tracked showSegmentError;
  @service intl;

  get options() {
    return [
      {
        name: this.intl.t('Manual.Settings.Public'),
        description: this.intl.t(
          'Manual.Settings.All_site_visitors_to_your_site,_no_login_required',
        ),
        value: 'public',
        icon: 'globe',
        icon_color: 'green',
      },
      {
        name: this.intl.t('Manual.Settings.Members_only'),
        description: this.intl.t('Manual.Settings.All_logged-in_members'),
        value: 'members',
        icon: 'members-all',
        icon_color: 'blue',
      },
      {
        name: this.intl.t('Manual.Settings.Paid-members_only'),
        description: this.intl.t(
          'Manual.Settings.Only_logged-in_members_with_an_active_Stripe_subscription',
        ),
        value: 'paid',
        icon: 'members-paid',
        icon_color: 'pink',
      },
      {
        name: this.intl.t('Manual.Settings.Specific_tier_s'),
        description: this.intl.t('Manual.Settings.Members_with_any_of_the_selected_tiers'),
        value: 'tiers',
        icon: 'members-segment',
        icon_color: 'yellow',
      },
    ];
  }

  get hasVisibilityFilter() {
    return !['public', 'members', 'paid'].includes(this.settings.get('defaultContentVisibility'));
  }

  get visibilityTiers() {
    const visibilityTiersData = this.settings.get('defaultContentVisibilityTiers');
    return (visibilityTiersData || []).map((id) => {
      return { id };
    });
  }

  get selectedOption() {
    if (this.settings.get('membersSignupAccess') === 'none') {
      return this.options.find((o) => o.value === 'public');
    }

    return this.options.find((o) => o.value === this.settings.get('defaultContentVisibility'));
  }

  @action
  setVisibility(segment) {
    if (segment) {
      const tierIds = segment?.map((tier) => {
        return tier.id;
      });
      this.settings.set('defaultContentVisibility', 'tiers');
      this.settings.set('defaultContentVisibilityTiers', tierIds);
      this.showSegmentError = false;
    } else {
      this.settings.set('defaultContentVisibility', '');
      this.showSegmentError = true;
    }
  }

  @action
  setDefaultContentVisibility(option) {
    if (this.settings.get('membersSignupAccess') !== 'none') {
      this.settings.set('defaultContentVisibility', option.value);
      if (option.value === 'tiers') {
        this.settings.set('defaultContentVisibilityTiers', []);
      }
    }
  }
}

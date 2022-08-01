import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class SettingsMembersSubscriptionAccess extends Component {
  @service settings;
  @service intl;

  get options() {
    return [
      {
        name: this.intl.t('Manual.Settings.Anyone_can_sign_up'),
        description: this.intl.t(
          'Manual.Settings.All_visitors_will_be_able_to_subscribe_and_sign_in',
        ),
        value: 'all',
        icon: 'globe',
        icon_color: 'green',
      },
      {
        name: this.intl.t('Manual.Settings.Only_people_I_invite'),
        description: this.intl.t(
          "Manual.Settings.People_can_sign_in_from_your_site_but_won't_be_able_to_sign_up",
        ),
        value: 'invite',
        icon: 'email-love-letter',
        icon_color: 'blue',
      },
      {
        name: this.intl.t('Manual.Settings.Nobody'),
        description: this.intl.t('Manual.Settings.No_one_will_be_able_to_subscribe_or_sign_in'),
        value: 'none',
        icon: 'no-members',
        icon_color: 'midlightgrey-d2',
      },
    ];
  }

  get selectedOption() {
    return this.options.find((o) => o.value === this.settings.get('membersSignupAccess'));
  }

  @action
  setSignupAccess(option) {
    this.settings.set('membersSignupAccess', option.value);
    this.args.onChange?.(option.value);

    if (option.value === 'none') {
      this.settings.set('defaultContentVisibility', 'public');
    }
  }
}

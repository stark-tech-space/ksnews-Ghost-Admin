import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class SettingsDefaultEmailRecipientsComponent extends Component {
  @service intl;

  get options() {
    return [
      {
        name: this.intl.t('Manual.Settings.Whoever_has_access_to_the_post'),
        description: this.intl.t(
          'Manual.Settings.Free_posts_to_everyone,_premium_posts_sent_to_paid_members',
        ),
        value: 'visibility',
        icon: 'members-post',
        icon_color: 'green',
      },
      {
        name: this.intl.t('Manual.Settings.All_members'),
        description: this.intl.t(
          'Manual.Settings.Everyone_who_is_subscribed_to_newsletter_updates,_whether_free_or_paid_members',
        ),
        value: 'all-members',
        icon: 'members-all',
        icon_color: 'blue',
      },
      {
        name: this.intl.t('Manual.Settings.Paid-members_only'),
        description: this.intl.t('Manual.Settings.People_who_have_a_premium_subscription'),
        value: 'paid-only',
        icon: 'members-paid',
        icon_color: 'pink',
      },
      {
        name: this.intl.t('Manual.Settings.Specific_people'),
        description: this.intl.t(
          'Manual.Settings.Only_people_with_any_of_the_selected_tiers_or_labels',
        ),
        value: 'segment',
        icon: 'members-segment',
        icon_color: 'yellow',
      },
      {
        name: this.intl.t('Manual.Settings.Usually_nobody'),
        description: this.intl.t(
          'Manual.Settings.Newsletters_are_off_for_new_posts,_but_can_be_enabled_when_needed',
        ),
        value: 'none',
        icon: 'no-members',
        icon_color: 'midlightgrey-d2',
      },
    ];
  }

  get selectedOption() {
    return this.options.find((o) => o.value === this.args.recipients);
  }

  @action
  setRecipients(option) {
    this.args.onRecipientsChange(option.value);
  }
}

import Component from '@glimmer/component';
import moment from 'moment';
import { htmlSafe } from '@ember/template';
import { isArray } from '@ember/array';
import { isServerUnreachableError } from 'ghost-admin/services/ajax';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

function isString(str) {
  return toString.call(str) === '[object String]';
}

export default class PublishFlowOptions extends Component {
  @service settings;
  @service intl;

  @tracked errorMessage;

  // store any derived state from PublishOptions on creation so the copy
  // doesn't change whilst the post is saving
  willEmail = this.args.publishOptions.willEmail;
  willPublish = this.args.publishOptions.willPublish;

  buttonTextMap = {
    'publish+send': {
      idle: this.intl.t('Manual.Components.Publish_&_send_'),
      running: this.intl.t('Manual.Components.Publishing_&_sending_'),
      success: this.intl.t('Manual.Components.Published_&_sent_'),
    },
    send: {
      idle: this.intl.t('Manual.Components.Send_email_'),
      running: this.intl.t('Manual.Components.Sending_'),
      success: this.intl.t('Manual.Components.Sent_'),
    },
    publish: {
      idle: this.intl.t('Manual.Components.Publish_'),
      running: this.intl.t('Manual.Components.Publishing_'),
      success: this.intl.t('Manual.Components.Published_'),
    },
    schedule: {
      // idle: '', - uses underlying publish type text
      running: this.intl.t('Manual.Components.Scheduling_'),
      success: this.intl.t('Manual.Components.Scheduled_'),
    },
  };

  get publishType() {
    const { publishOptions } = this.args;

    if (this.willPublish && this.willEmail) {
      return 'publish+send';
    } else if (publishOptions.willOnlyEmail) {
      return 'send';
    } else {
      return 'publish';
    }
  }

  get confirmButtonText() {
    let buttonText = '';

    buttonText = this.buttonTextMap[this.publishType].idle;

    if (this.publishType === 'publish') {
      let text = `Manual.Components.${this.args.publishOptions.post.displayName}`;
      buttonText += `${this.intl.t(text)}`;
    }

    if (this.args.publishOptions.isScheduled) {
      const scheduleMoment = moment.tz(
        this.args.publishOptions.scheduledAtUTC,
        this.settings.get('timezone'),
      );
      buttonText += `,${this.intl.t('Manual.Components._on_')}${scheduleMoment.format('MMMM Do')}`;
    } else {
      buttonText += `,${this.intl.t('Manual.Components._right_now')}`;
    }

    return buttonText;
  }

  get confirmRunningText() {
    const publishType = this.args.publishOptions.isScheduled ? 'schedule' : this.publishType;
    return this.buttonTextMap[publishType].running;
  }

  get confirmSuccessText() {
    const publishType = this.args.publishOptions.isScheduled ? 'schedule' : this.publishType;
    return this.buttonTextMap[publishType].success;
  }

  @task({ drop: true })
  *confirmTask() {
    this.errorMessage = null;

    try {
      yield this.args.saveTask.perform();
    } catch (e) {
      if (e === undefined && this.args.publishOptions.post.errors.length !== 0) {
        // validation error
        const validationError = this.args.publishOptions.post.errors.messages[0];
        this.errorMessage = `Validation failed: ${validationError}`;
        return false;
      }

      let errorMessage = '';

      if (isServerUnreachableError(e)) {
        errorMessage = 'Unable to connect, please check your internet connection and try again.';
      } else if (e && isString(e)) {
        errorMessage = e;
      } else if (e && isArray(e)) {
        // This is here because validation errors are returned as an array
        // TODO: remove this once validations are fixed
        errorMessage = e[0];
      } else if (e?.payload?.errors?.[0].message) {
        errorMessage = e.payload.errors[0].message;
      } else {
        errorMessage = 'Unknown Error';
      }

      this.errorMessage = htmlSafe(errorMessage);
      return false;
    }
  }
}

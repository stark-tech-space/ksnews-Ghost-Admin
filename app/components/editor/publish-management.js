import Component from '@glimmer/component';
import EmailFailedError from 'ghost-admin/errors/email-failed-error';
import PreviewModal from './modals/preview';
import PublishFlowModal from './modals/publish-flow';
import PublishOptionsResource from 'ghost-admin/helpers/publish-options';
import UpdateFlowModal from './modals/update-flow';
import envConfig from 'ghost-admin/config/environment';
import { action } from '@ember/object';
import { capitalize } from '@ember/string';
import { inject as service } from '@ember/service';
import { task, taskGroup, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { use } from 'ember-could-get-used-to-this';

const SHOW_SAVE_STATUS_DURATION = 3000;
export const CONFIRM_EMAIL_POLL_LENGTH = 1000;
export const CONFIRM_EMAIL_MAX_POLL_LENGTH = 15 * 1000;

// This component exists for the duration of the editor screen being open.
// It's used to store the selected publish options, control the publishing flow
// modal display, and provide an editor-specific save behaviour wrapper around
// PublishOptions saving.
export default class PublishManagement extends Component {
  @service modals;
  @service notifications;
  @service intl;

  // ensure we get a new PublishOptions instance when @post is replaced
  @use publishOptions = new PublishOptionsResource(() => [this.args.post]);

  @tracked previewTab = 'browser';

  publishFlowModal = null;
  updateFlowModal = null;

  willDestroy() {
    super.willDestroy(...arguments);
    this.publishFlowModal?.close();
  }

  @action
  async openPublishFlow(event, { skipAnimation } = {}) {
    event?.preventDefault();
    console.log('looking at publishoptions');
    console.log(this.publishOptions);
    console.log(this.publishOptions);
    this.updateFlowModal?.close();

    const isValid = await this._validatePost();

    if ((isValid && !this.publishFlowModal) || this.publishFlowModal?.isClosing) {
      this.publishOptions.resetPastScheduledAt();

      this.publishFlowModal = this.modals.open(PublishFlowModal, {
        publishOptions: this.publishOptions,
        saveTask: this.publishTask,
        togglePreviewPublish: this.togglePreviewPublish,
        skipAnimation,
      });

      const result = await this.publishFlowModal;

      if (result?.afterTask && this[result?.afterTask]) {
        await timeout(160); // wait for modal animation to finish
        this[result.afterTask].perform();
      }
    }
  }

  @action
  async openUpdateFlow(event) {
    event?.preventDefault();

    this.publishFlowModal?.close();

    const isValid = await this._validatePost();

    if ((isValid && !this.updateFlowModal) || this.updateFlowModal.isClosing) {
      this.updateFlowModal = this.modals.open(UpdateFlowModal, {
        publishOptions: this.publishOptions,
        saveTask: this.publishTask,
      });

      const result = await this.updateFlowModal;

      if (result?.afterTask && this[result?.afterTask]) {
        await timeout(160); // wait for modal animation to finish
        this[result.afterTask].perform();
      }
    }
  }

  @action
  openPreview(event, { skipAnimation } = {}) {
    event?.preventDefault();

    if (!this.previewModal || this.previewModal.isClosing) {
      // open publish flow modal underneath to offer quick switching
      // without restarting the flow or causing flicker

      this.previewModal = this.modals.open(PreviewModal, {
        publishOptions: this.publishOptions,
        hasDirtyAttributes: this.args.hasUnsavedChanges,
        saveTask: this.saveTask,
        togglePreviewPublish: this.togglePreviewPublish,
        currentTab: this.previewTab,
        changeTab: this.changePreviewTab,
        skipAnimation,
      });
    }
  }

  // triggered by ctrl/cmd+p
  @action
  togglePreview(event) {
    event?.preventDefault();

    if (!this.previewModal || this.previewModal.isClosing) {
      if (this.publishFlowModal && !this.publishFlowModal.isClosing) {
        this.togglePreviewPublish();
      } else {
        this.openPreview();
      }
    } else {
      this.previewModal.close();
    }
  }

  @action
  changePreviewTab(tab) {
    this.previewTab = tab;
  }

  @action
  async togglePreviewPublish(event) {
    event?.preventDefault();

    if (this.previewModal && !this.previewModal.isClosing) {
      this.openPublishFlow(event, { skipAnimation: true });
      await timeout(160);
      this.previewModal.close();
    } else if (this.publishFlowModal && !this.publishFlowModal.isClosing) {
      this.openPreview(event, { skipAnimation: true });
      await timeout(160);
      this.publishFlowModal.close();
    }
  }

  async _validatePost() {
    this.notifications.closeAlerts('post.save');

    try {
      await this.publishOptions.post.validate();
      return true;
    } catch (e) {
      if (e === undefined && this.publishOptions.post.errors.length !== 0) {
        // validation error
        const validationError = this.publishOptions.post.errors.messages[0];
        const errorMessage = `Validation failed: ${validationError}`;

        this.notifications.showAlert(errorMessage, { type: 'error', key: 'post.save' });
        return false;
      }

      this.notifications.showAPIError(e);
    }
  }

  @task
  *publishTask({ taskName = 'saveTask' } = {}) {
    const willEmail = this.publishOptions.willEmail;

    // clean up blank editor cards
    // apply cloned mobiledoc
    // apply scratch values
    // generate slug if needed (should never happen - publish flow can't be opened on new posts)
    yield this.args.beforePublish();

    // apply publish options (with undo on failure)
    // save with the required query params for emailing
    const result = yield this.publishOptions[taskName].perform();

    // perform any post-save cleanup for the editor
    yield this.args.afterPublish(result);

    // if emailed, wait until it has been submitted so we can show a failure message if needed
    if (willEmail && this.publishOptions.post.email) {
      yield this.confirmEmailTask.perform();
    }

    return result;
  }

  // used by the non-publish "Save" button shown for scheduled/published posts
  @task({ group: 'saveButtonTaskGroup' })
  *saveTask() {
    yield this.args.saveTask.perform();
    this.saveButtonTimeoutTask.perform();
    return true;
  }

  @task({ group: 'saveButtonTaskGroup' })
  *saveButtonTimeoutTask() {
    yield timeout(envConfig.environment === 'test' ? 1 : SHOW_SAVE_STATUS_DURATION);
  }

  @taskGroup saveButtonTaskGroup;

  @task
  *confirmEmailTask() {
    const post = this.publishOptions.post;

    let pollTimeout = 0;
    if (post.email && post.email.status !== 'submitted') {
      while (pollTimeout < CONFIRM_EMAIL_MAX_POLL_LENGTH) {
        yield timeout(CONFIRM_EMAIL_POLL_LENGTH);
        pollTimeout += CONFIRM_EMAIL_POLL_LENGTH;

        yield post.reload();

        if (post.email.status === 'submitted') {
          break;
        }
        if (post.email.status === 'failed') {
          throw new EmailFailedError(post.email.error);
        }
      }
    }

    return true;
  }

  @task
  *revertToDraftTask() {
    try {
      yield this.publishTask.perform({ taskName: 'revertToDraftTask' });

      const postType = this.intl.t(`Manual.JS.${capitalize(this.args.post.displayName)}`);
      this.notifications.showNotification(
        postType + `${this.intl.t('Manual.JS._successfully_reverted_to_a_draft.')}`,
        {
          type: 'success',
        },
      );

      return true;
    } catch (e) {
      console.log(e);
      this.notifications.showAPIError(e);
    }
  }
}

import ModalComponent from 'ghost-admin/components/modal-base';
import { alias } from '@ember/object/computed';
import { computed } from '@ember/object';
import { task } from 'ember-concurrency';
import { inject as service } from '@ember/service';

export default ModalComponent.extend({
  intl: service(),

  // Allowed actions
  confirm: () => {},

  tag: alias('model'),

  postInflection: computed('tag.count.posts', function () {
    return this.get('tag.count.posts') > 1
      ? this.intl.t('Manual.Tags.posts')
      : this.intl.t('Manual.Tags.post');
  }),

  actions: {
    confirm() {
      this.deleteTag.perform();
    },
  },

  deleteTag: task(function* () {
    try {
      yield this.confirm();
    } finally {
      this.send('closeModal');
    }
  }).drop(),
});

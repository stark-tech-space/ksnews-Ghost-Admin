import Component from '@glimmer/component';
import { isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';

/**
 * Renders one random error message when passed a DS.Errors object
 * and a property name. The message will be one of the ones associated with
 * that specific property. If there are no errors associated with the property,
 * nothing will be rendered.
 * @param  {DS.Errors} errors   The DS.Errors object
 * @param  {string} property    The property name
 */
export default class GhErrorMessage extends Component {
  @service intl;

  get message() {
    let { property, errors } = this.args;
    let messages = [];
    let index;

    if (!isEmpty(errors) && errors.get(property)) {
      errors.get(property).forEach((error) => {
        messages.push(error);
      });
      index = Math.floor(Math.random() * messages.length);
      return this.intl.t(`Manual.Errors.${messages[index].message}`);
    }

    return '';
  }
}

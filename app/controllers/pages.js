import PostsController from './posts';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';

const TYPES = [{
    name: 'All pages',
    value: null
}, {
    name: 'Draft pages',
    value: 'draft'
}, {
    name: 'Published pages',
    value: 'published'
}, {
    name: 'Scheduled pages',
    value: 'scheduled'
}, {
    name: 'Featured pages',
    value: 'featured'
}];

const ORDERS = [{
    name: 'Newest',
    value: null
}, {
    name: 'Oldest',
    value: 'published_at asc'
}, {
    name: 'Recently updated',
    value: 'updated_at desc'
}];

/* eslint-disable ghost/ember/alias-model-in-controller */
@classic
export default class PagesController extends PostsController {
    @service intl;

    init() {
        super.init(...arguments);

        this.availableTypes = TYPES.map(item => ({...item,
            name: this.intl.t(`Manual.JS.${item.name}`)}));
        this.availableOrders = ORDERS.map(item => ({
            ...item,
            name: this.intl.t(`Manual.JS.${item.name}`)
        }));
    }

    @action
    openEditor(page) {
        this.transitionToRoute('editor.edit', 'page', page.get('id'));
    }
}

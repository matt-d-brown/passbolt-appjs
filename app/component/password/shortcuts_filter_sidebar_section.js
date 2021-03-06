/**
 * Passbolt ~ Open source password manager for teams
 * Copyright (c) Passbolt SARL (https://www.passbolt.com)
 *
 * Licensed under GNU Affero General Public License version 3 of the or any later version.
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Passbolt SARL (https://www.passbolt.com)
 * @license       https://opensource.org/licenses/AGPL-3.0 AGPL License
 * @link          https://www.passbolt.com Passbolt(tm)
 * @since         2.0.0
 */
import Action from 'passbolt-mad/model/map/action';
import Filter from 'app/model/map/filter';
import MadBus from 'passbolt-mad/control/bus';
import MenuComponent from 'passbolt-mad/component/menu';
import PrimarySidebarSectionComponent from 'app/component/workspace/primary_sidebar_section';

import template from 'app/view/template/component/password/shortcuts_filter_sidebar_section.stache!';

var ShortcutsFilterSidebarSectionComponent = PrimarySidebarSectionComponent.extend('passbolt.component.password.ShortcutsFilterSidebarSection', /** @static */ {

	defaults: {
		allFilter: null,
		template: template
	}

}, /** @prototype */ {

	/**
	 * @inheritdoc
	 */
	afterStart: function() {
		this.options.menu = this._initShortcutsList();
		this._super();
	},

	/**
	 * Init the shortcuts list.
	 */
	_initShortcutsList: function() {
		var menu = new MenuComponent('#js_wsp_password_shortcuts_filter_list');
		menu.start();

		// All
		var allItem = new Action({
			id: 'js_pwd_wsp_filter_all',
			label: __('All items'),
			filter: this.options.allFilter
		});
		menu.insertItem(allItem);
		menu.selectItem(allItem);

		// Favorite
		var favoriteItem = new Action({
			id: 'js_pwd_wsp_filter_favorite',
			label: __('Favorite'),
			filter: new Filter({
				id: 'workspace_filter_favorite',
				label: __('Favorite'),
				rules: {
					'is-favorite': true
				},
				order: ['Resource.modified DESC']
			})
		});
		menu.insertItem(favoriteItem);

		// Modified
		var modifiedItem = new Action({
			id: 'js_pwd_wsp_filter_modified',
			label: __('Recently modified'),
			filter : new Filter({
				id: 'workspace_filter_modified',
				label: __('Recently modified'),
				order: ['Resource.modified DESC']
			})
		});
		menu.insertItem(modifiedItem);

		// Shared with me
		var sharedItem = new Action({
			id: 'js_pwd_wsp_filter_share',
			label: __('Shared with me'),
			filter: new Filter({
				id: 'workspace_filter_shared',
				label: __('Shared with me'),
				rules: {
					'is-shared-with-me': true
				},
				order: ['Resource.modified DESC']
			})
		});
		menu.insertItem(sharedItem);

		// I own
		var ownItem = new Action({
			id: 'js_pwd_wsp_filter_own',
			label: __('Items I own'),
			filter: new Filter({
				id: 'workspace_filter_own',
				label: __('Items I own'),
				rules: {
					'is-owned-by-me': true
				},
				order: ['Resource.modified DESC']
			})
		});
		menu.insertItem(ownItem);

		return menu;
	},

	/* ************************************************************** */
	/* LISTEN TO THE VIEW EVENTS */
	/* ************************************************************** */

	/**
	 * An item has been selected
	 * @parent mad.component.Menu.view_events
	 * @param {HTMLElement} el The element the event occured on
	 * @param {HTMLEvent} ev The event which occured
	 * @param {string} item The selected item
	 * @return {void}
	 */
	' item_selected': function (el, ev, item) {
		// If this item is not disabled, try to execute the item action.
		if (!item.state.is('disabled')) {
			MadBus.trigger('filter_workspace', item.filter);
		}
	},

	/* ************************************************************** */
	/* LISTEN TO THE APP EVENTS */
	/* ************************************************************** */

	/**
	 * Listen to the workspace is filtered
	 * @param {jQuery} element The source element
	 * @param {Event} event The jQuery event
	 * @param {Filter} filter The filter to apply
	 */
	'{mad.bus.element} filter_workspace': function (element, evt, filter) {
		var menu = this.options.menu;
		menu.unselectAll();

		// If the filter is relative to a filter registered in this component, select it.
		menu.options.items.each(function(item) {
			if (item.filter.id == filter.id) {
				menu.selectItem(item);
			}
		});
	}
});

export default ShortcutsFilterSidebarSectionComponent;

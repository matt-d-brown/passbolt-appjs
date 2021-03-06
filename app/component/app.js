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
import Ajax from 'app/net/ajax';
import Component from 'passbolt-mad/component/component';
import ComponentHelper from 'passbolt-mad/helper/component';
import Config from 'passbolt-mad/config/config';
import ContextualMenuComponent from 'passbolt-mad/component/contextual_menu';
import FilterComponent from 'app/component/navigation/filter';
import LoadingBarComponent from 'app/component/footer/loading_bar';
import MadBus from 'passbolt-mad/control/bus';
import NavigationLeftComponent from 'app/component/navigation/left';
import NotificationComponent from 'app/component/footer/notification';
import PasswordWorkspaceComponent from 'app/component/password/workspace';
import ProfileHeaderDropdownComponent from 'app/component/profile/header_dropdown';
import SettingsWorkspaceComponent from 'app/component/settings/workspace';
import User from 'app/model/map/user';
import UserWorkspaceComponent from 'app/component/user/workspace';

import template from 'app/view/template/app.stache!';

var App = Component.extend('passbolt.component.App', /** @static */ {

	defaults: {
        template: template
	}

}, /** @prototype */ {

	/**
	 * The currently enabled workspace.
	 * @type {passbolt.Component}
	 */
	workspace: null,

	/**
	 * @inheritdoc
	 */
	afterStart: function() {
		this._initHeader();
		this._initFooter();
		this._initSessionLookup();
	},

	/**
	 * Init header
 	 */
	_initHeader: function() {
		var navigationLeftComponent = new NavigationLeftComponent('#js_app_navigation_left');
		navigationLeftComponent.start();

		var filterComponent = new FilterComponent('#js_app_filter', {});
		filterComponent.start();

		var profileHeaderDropdownComponent = new ProfileHeaderDropdownComponent('#js_app_profile_dropdown', {
			user: User.getCurrent()
		});
		profileHeaderDropdownComponent.start();
	},

	/**
	 * Init footer
	 */
	_initFooter: function() {
		var notificationComponent = new NotificationComponent('#js_app_notificator');

		var loadingBarComponent = new LoadingBarComponent('#js_app_loading_bar');
		loadingBarComponent.start();
	},

	/**
	 * Initialise the session lookup process.
	 * If the user has been logged out, the server will answer a 403 message that is  caught by the
	 * passbolt.net.ResponseHandler and redirect the user to the login page.
	 */
	_initSessionLookup: function() {
		setTimeout(function() {
			var interval = setInterval(function() {
				Ajax.request({
					url: APP_URL + 'auth/checkSession.json',
					type: 'GET'
				}).then(null, function() {
					clearInterval(interval);
				});
			}, Config.read('session.checkTimeInterval'));
		}, Config.read('session.checkTimeInterval'));
	},

	/**
	 * Initialize the target workspace.
	 * @param {string} name The name of the workspace
	 * @param {array} options The additional options to use during the workspace creation
     */
	_initWorkspace: function(name, options) {
		var workspaceOptions = {
				id: 'js_passbolt_' + name + '_workspace_controller',
				label: name
			};
		// Extend default workspace options with the ones given in params.
		$.extend(workspaceOptions, options);

		// Destroy the previously instantiated workspace.
		this._destroyWorkspace();

		// Init the workspace
		this.workspace = ComponentHelper.create(
			$('#js_app_panel_main'),
			'last',
			this._getWorkspaceClassByName(name),
			workspaceOptions
		);
		this.workspace.start();

		$('#container').addClass('page ' + name);
		MadBus.trigger('workspace_enabled', this.workspace);
	},

	/**
	 * Get a workspace class by name
	 * @param {string} name The target workspace name
	 * @return {passbolt.Component}
	 */
	_getWorkspaceClassByName: function(name) {
		var WorkspaceClass = null;
		switch (name) {
			case 'password':
				WorkspaceClass = PasswordWorkspaceComponent;
				break;
			case 'settings':
				WorkspaceClass = SettingsWorkspaceComponent;
				break;
			case 'user':
				WorkspaceClass = UserWorkspaceComponent;
				break;
		}
		return WorkspaceClass;
	},

	/**
	 * Destroy the previously instantiated workspace.
	 */
	_destroyWorkspace: function() {
		if (this.workspace != null) {
			// Remove all the classes
			$('#container').removeClass();
			// Destroy the previous workspace controller.
			this.workspace.destroy();
			// Remove any HTMLElements relative to the previous workspace.
			$('#js_app_panel_main').empty();
			// Remove any existing contextual menu.
			ContextualMenuComponent.remove();
		}
	},

	/* ************************************************************** */
	/* LISTEN TO THE APP EVENTS */
	/* ************************************************************** */

	/**
	 * Observe when the user wants to switch to another workspace
	 * @param {HTMLElement} el The element the event occurred on
	 * @param {HTMLEvent} ev The event which occurred
	 * @param {string} workspaceName The target workspace name
	 * @param {array} options Workspace's options
	 */
	'{mad.bus.element} request_workspace': function (el, event, workspaceName, options) {
		options = options || {};
		this._initWorkspace(workspaceName, options);
	},

	/**
	 * Observe when the user requests a dialog to be opened.
	 * @param {HTMLElement} el The element the event occurred on
	 * @param {HTMLEvent} ev The event which occurred
	 * @param {string} label The label of the dialog
	 * @param {array} options (optional) Options to give to the dialog controller
	 */
	'{mad.bus.element} request_dialog': function (el, ev, options) {
		var options = options || {};
		new DialogComponent(null, options).start();
	},

	/**
	 * Remove all existing focus in the document.
	 *
	 * This way we can set the focus somewhere else in another iframe.
	 *
	 * @param el
	 * @param ev
	 * @param options
	 */
	'{mad.bus.element} remove_all_focuses': function (el, ev, options) {
		var $focused = $(':focus');
		$focused.blur();
	},

	/**
	 * Observe when the application processus have been all completed.
	 * @param {HTMLElement} el The element the event occurred on
	 * @param {HTMLEvent} ev The event which occurred
	 */
	'{mad.bus.element} passbolt_application_loading_completed': function (el, ev, options) {
		if(!$('html').hasClass('loaded')) {
			$('html')
				.removeClass('loading')
				.addClass('loaded');
		}
	},

	/**
	 * Observe when the user wants to close the latest dialog.
	 * @param {HTMLElement} el The element the event occurred on
	 * @param {HTMLEvent} ev The event which occurred
	 */
	'{mad.bus.element} passbolt_application_loading': function (el, ev, options) {
		if (!$('html').hasClass('loading')) {
			$('html')
				.removeClass('loaded')
				.addClass('loading');
		}
	},

	/**
	 * Observe when the user wants to close the latest dialog.
	 * @param {HTMLElement} el The element the event occurred on
	 * @param {HTMLEvent} ev The event which occurred
	 */
	'{mad.bus.element} request_dialog_close_latest': function (el, ev, options) {
		DialogComponent.closeLatest();
	},

	/**
	 * The p3 narrow external lib caught a window resize event and
	 * set the appropriated classes to the body HTML Element.
	 * @param {HTMLElement} el The element the event occurred on
	 * @param {HTMLEvent} ev The event which occurred
	 */
	'{window} p3_narrow_checked': function(el, ev) {
		MadBus.trigger('passbolt.html_helper.window_resized');
	},

	/* ************************************************************** */
	/* LISTEN TO THE STATE CHANGES */
	/* ************************************************************** */

	/**
	 * Listen to the change relative to the state Loading
	 * @param {boolean} go Enter or leave the state
	 */
	stateLoading: function (go) {
		// If the view has already been instantiated.
		// Notify it that the component is now loading.
		if (this.view) {
			this.view.loading(go);
		}
	},

	/**
	 * The application is ready.
	 * @param {boolean} go Enter or leave the state
	 */
	stateReady: function (go) {
		// Select the password workspace
		MadBus.trigger('request_workspace', 'password');
		// When the application is ready, remove the launching screen.
		$('html').removeClass('launching');
	}

});

export default App;

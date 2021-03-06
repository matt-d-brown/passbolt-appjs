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
import canEvent from 'can-event';
import connect from 'can-connect';
import connectDataUrl from 'can-connect/data/url/url';
import connectParse from 'can-connect/data/parse/parse';
import connectConstructor from 'can-connect/constructor/constructor';
import connectMap from 'can-connect/can/map/map';
import connectStore from 'can-connect/constructor/store/store';
import connectConstructorHydrate from 'can-connect/can/constructor-hydrate/constructor-hydrate';
import DefineList from 'passbolt-mad/model/list/list';
import DefineMap from 'passbolt-mad/model/map/map';
import Favorite from 'app/model/map/favorite';
import 'urijs/src/punycode';
import 'urijs/src/SecondLevelDomains';
import 'urijs/src/IPv6';
import URI from 'urijs/src/URI';
import Permission from 'app/model/map/permission';
import Secret from 'app/model/map/secret';
import Tag from 'app/model/map/tag';
import User from 'app/model/map/user';

var Resource = DefineMap.extend('passbolt.model.Resource', {
	id: 'string',
	name: 'string',
	username: 'string',
	uri: 'string',
	created: 'string',
	modified: 'string',
	description: 'string',
	creator: User,
	//modifier: User,
	favorite: Favorite,
	permission: Permission,
	//secrets: Secret.List,
	//tags: Tag.List

	/**
	 * Check if the resource is marked as favorite.
	 * @return {boolean}
	 */
	isFavorite: function () {
		return this.favorite && this.favorite.id;
	},

	/**
	 * Get a safe uri.
	 *
	 * @return {string}
	 */
	safeUri: function() {
		if (this.uri == '' || !this.uri) {
			return this.uri;
		}
		var safeUri = URI(this.uri);

		// If the uri is an url and is not absolute.
		// Add the default http:// protocol
		if (!safeUri.is('absolute') && safeUri.is('url')) {
			safeUri.protocol('http');
		}
		if (safeUri.protocol().trim().toLowerCase() === "javascript") {
			safeUri.protocol('http');
		}

		return safeUri.toString();
	},

	/**
	 * Share the resource.
	 * @param resource
	 * @param params
	 * @returns {Promise.<T>|*}
     */
	share: function(params) {
		return Ajax.request({
			url: 'share/resource/' + this.id + '.json?api-version=v1',
			type: 'PUT',
			params: params
		}).then(() => {
			this._reloadResource();
		});
	},

	_reloadResource: function() {
		var findOptions = {
			id: this.id,
			silentLoading: false,
			contain: {creator: 1, favorite: 1, modifier: 1, secret: 1, permission: 1}
		};
		Resource.findOne(findOptions)
		.then(null, () => {
			// If there is an error, ot means the user does not have anymore access to the resource.
			// notify other component about it by mimicing the destroy behavior.
			canEvent.dispatch.call(this, {type: 'destroyed', target: this});
		});
	}
});
DefineMap.setReference('Resource', Resource);
Resource.List = DefineList.extend({'#': { Type: Resource }});

/*
 * Default validation rules.
 * Keep these rules in sync with the passbolt API.
 * @see https://github.com/passbolt/passbolt_api/src/Model/Table/ResourcesTable.php
 */
Resource.validationRules = {
	id: [
		{rule: 'uuid'}
	],
	name: [
		{rule: 'required', message: __('A name is required.')},
		{rule: ['maxLength', 64], message: __('The name length should be maximum %s characters.', 64)},
		{rule: 'utf8Extended', message: __('The name should be a valid utf8 string.')}
	],
	username: [
		{rule: ['maxLength', 64], message: __('The username length should be maximum %s characters.', 64)},
		{rule: 'utf8Extended', message: __('The username should be a valid utf8 string.')}
	],
	uri: [
		{rule: ['maxLength', 255], message: __('The uri length should be maximum %s characters.', 255)},
		{rule: 'utf8', message: __('The uri should be a valid utf8 string (emoticons excluded).')}
	],
	description: [
		{rule: ['maxLength', 10000], message: __('The description length should be maximum %s characters.', 10000)},
		{rule: 'utf8Extended', message: __('The description should be a valid utf8 string.')}
	]
};

/**
 * @inherited-doc
 */
Resource.getFilteredFields = function(filteredCase) {
	var filteredFields = false;

	switch(filteredCase) {
		case 'edit':
			filteredFields = [
				'id',
				'name',
				'username',
				'expiry_date',
				'uri',
				'description'
			];
			break;
		case 'edit_with_secrets':
			filteredFields = [
				'id',
				'name',
				'username',
				'expiry_date',
				'uri',
				'description',
				'secrets'
			];
			break;
		case 'edit_description':
			filteredFields = [
				'id',
				'description'
			];
			break;
	}

	return filteredFields;
};

Resource.connection = connect([connectParse, connectDataUrl, connectConstructor, connectStore, connectMap, connectConstructorHydrate], {
	Map: Resource,
	List: Resource.List,
	url: {
		resource: '/',
		getData: function(params) {
			return Ajax.request({
				url: 'resources/{id}.json?api-version=v2',
				type: 'GET',
				params: params
			});
		},
		getListData: function(params) {
			return Ajax.request({
				url: 'resources.json?api-version=v2',
				type: 'GET',
				params: params
			});
		},
		destroyData: function(params) {
			var params = {
				id: params.id,
				'api-version': 'v2'
			};
			return Ajax.request({
				url: 'resources/{id}.json?api-version=v2',
				type: 'DELETE',
				params: params
			});
		},
		createData: function(params) {
			return Ajax.request({
				url: 'resources.json?api-version=v2',
				type: 'POST',
				params: params
			});
		},
		updateData: function(params) {
			// Filter the attributes that need to be send by the request.
			var params = Resource.filterAttributes(params);
			return Ajax.request({
				url: 'resources/{id}.json?api-version=v2',
				type: 'PUT',
				params: params
			});
		}
	}
});

export default Resource;

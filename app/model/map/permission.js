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
import connect from 'can-connect';
import connectDataUrl from 'can-connect/data/url/url';
import connectParse from 'can-connect/data/parse/parse';
import connectConstructor from 'can-connect/constructor/constructor';
import connectMap from 'can-connect/can/map/map';
import connectStore from 'can-connect/constructor/store/store';
import connectConstructorHydrate from 'can-connect/can/constructor-hydrate/constructor-hydrate';
import DefineList from 'passbolt-mad/model/list/list';
import Group from 'app/model/map/group';
import DefineMap from 'passbolt-mad/model/map/map';
import PermissionType from 'app/model/map/permission_type';
import User from 'app/model/map/user';

var Permission = DefineMap.extend('passbolt.model.Permission', {
	id: 'string',
	type: 'integer',
	aco: 'string',
	aco_foreign_key: 'string',
	aro: 'string',
	aro_foreign_key: 'string',
	aro_foreign_label: 'string',
	permissionType: PermissionType,
	user: User,
	group: Group,

	/**
	 * Check that the permission level allows requested permission
	 * @param permissionType
	 * @returns {boolean}
	 */
	isAllowedTo: function(permissionType) {
		return this.type >= permissionType;
	}
});
DefineMap.setReference('Permission', Permission);
Permission.List = DefineList.extend({'#': { Type: Permission }});

/*
 * Default validation rules.
 * Keep these rules in sync with the passbolt API.
 * @see https://github.com/passbolt/passbolt_api/src/Model/Table/PermissionsTable.php
 */
Permission.validationRules = {
	aro_foreign_key: ['required', 'uid'],
	aro_foreign_label: ['required'],
	type: [
		'required',
		{
			rule: 'foreignRule',
			options: {
				model: PermissionType,
				attribute: 'serial'
			}
		}
	]
};

Permission.connection = connect([connectParse, connectDataUrl, connectConstructor, connectStore, connectMap, connectConstructorHydrate], {
	Map: Permission,
	List: Permission.List,
	url: {
		resource: '/',
		getListData: function(params) {
			params['api-version'] = 'v2';
			return Ajax.request({
				url: 'permissions/{aco}/{aco_foreign_key}.json',
				type: 'GET',
				params: params
			});
		},
		createData: function(params) {
			return Ajax.request({
				url: 'permissions.json?api-version=v2',
				type: 'POST',
				params: params
			});
		}
	}
});

export default Permission;

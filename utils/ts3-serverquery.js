/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2016 Seth Anderson

This software is provided 'as-is', without any express or implied warranty. 
In no event will the authors be held liable for any damages arising from the 
use of this software.

Permission is granted to anyone to use this software for any purpose, 
including commercial applications, and to alter it and redistribute it 
freely, subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not 
claim that you wrote the original software. If you use this software in a 
product, an acknowledgment in the product documentation would be appreciated 
but is not required.

2. Altered source versions must be plainly marked as such, and must not be 
misrepresented as being the original software.

3. This notice may not be removed or altered from any source distribution.
-----------------------------------------------------------------------------
*/

var ServerQuery = require("node-teamspeak"),
	Promise = require("bluebird"),
	config = require("./common").config,

	_errorMessage = function(err){
		var error = err.msg;
		if(err.extra_msg){
			error += " (" + err.extra_msg + ")";
		}
		return error;
	},

	_handleCallback = function(resolve, reject){
		return function(err, response, rawResponse){
			if(!err){
				resolve(response);
			}else{
				reject(_errorMessage(err));
			}
		}
	},

	_login = function(){
		return new Promise(function(resolve, reject){
			var sq = new ServerQuery(config.ts3.address);
			sq.on("connect", function(){
				sq.send("login", {
					client_login_name: "serveradmin",
					client_login_password: config.ts3.password
				}, function(err){
					if(!err){
						resolve(sq);
					}else{
						sq.send("quit");
						reject(err);
					}
				});
			});
			sq.on("error", function(err){
				sq.send("quit");
				if(err.errno === "ECONNREFUSED"){
					reject({
						reason: "connection-refused",
						id: 1,
						message: "ServerQuery connection refused by host: \"" + config.ts3.address + "\""
					});
				}else{
					reject({
						reason: "unknown",
						id: 1,
						message: "Unknown error from Teamspeak ServerQuery"
					});
				}
			});
		});
	},

	_logout = function(sq){
		return new Promise(function(resolve, reject){
			sq.send("logout", null, function(err, response, rawResponse){
				sq.send("quit");
				resolve();
			});
		});
	},

	_selectVirtualServer = function(sq, virtualServer){
		return new Promise(function(resolve, reject){
			sq.send("use", {sid: virtualServer}, _handleCallback(resolve, reject));
		});
	},

	_send = function(sq, command, params, options){
		return new Promise(function(resolve, reject){
			sq.send(command, params, options, _handleCallback(resolve, reject));
		});
	},

	_commandQueue = [],
	_processingQueue = false,
	_currentVirtualServer = 0,

	_enqueueCommand = function(command, params, options, virtualServer){
		return new Promise(function(resolve, reject){
			_commandQueue.push({
				command: command,
				params: params,
				options: options,
				virtualServer: virtualServer,
				resolve: resolve,
				reject: reject
			});
			if(!_processingQueue){
				_processQueue();
			}
		});
	},

	_processCommands = function(sq){
		return new Promise(function(resolve, reject){
			if(_commandQueue.Length === 0){
				resolve();
				return;
			}

			if(_currentVirtualServer !== _commandQueue[0].virtualServer){
				_selectVirtualServer(sq, _commandQueue[0].virtualServer)
				.then(function(){
					_currentVirtualServer = _commandQueue[0].virtualServer;
					_processCommands(sq).then(resolve);
				});
				return;
			}

			_send(
				sq,
				_commandQueue[0].command,
				_commandQueue[0].params,
				_commandQueue[0].options
			).then(function(response){
				_commandQueue[0].resolve(response);
				_commandQueue.splice(0, 1);
				if(_commandQueue.length > 0){
					_processCommands(sq).then(resolve);
				}else{
					resolve();
				}
			}).catch(function(error){
				_commandQueue[0].reject(error);
				_commandQueue.splice(0, 1);
				if(_commandQueue.length > 0){
					_processCommands(sq).then(resolve);
				}else{
					resolve();
				}
			});
		});
	},

	_processQueue = function(){
		_processingQueue = true;
		var sequenceSq;
		_login()
		.then(function(sq){
			sequenceSq = sq;
			return _processCommands(sequenceSq);
		}).then(function(){
			return _logout(sequenceSq);
		}).then(function(){
			_currentVirtualServer = 0;
			_processingQueue = false;
		});
	};

module.exports = {
	version: function(){
		return _enqueueCommand("version", {}, [], null);
	},

	hostInfo: function(){
		return _enqueueCommand("hostinfo", {}, [], null);
	},

	instanceInfo: function(){
		return _enqueueCommand("instanceinfo", {}, [], null);
	},

	editInstance: function(params){
		return _enqueueCommand("instanceedit", params, [], null);
	},

	bindingList: function(){
		return _enqueueCommand("bindinglist", {}, [], null);
	},

	listServers: function(){
		return _enqueueCommand("serverlist", {}, [], null);
	},

	serverIdByPort: function(port){
		return _enqueueCommand("serveridgetbyport", {virtualserver_port: port}, [], null);
	},

	deleteServer: function(serverId){
		return _enqueueCommand("serverdelete", {sid: serverId}, [], null);
	},

	createServer: function(properties){
		if(!properties.virtualserver_name){
			return Promise.reject({
				reason: "name-required",
				message: "Must provide a name for the new server."
			});
		}
		return _enqueueCommand("servercreate", properties, [], null);
	},

	startServer: function(serverId){
		return _enqueueCommand("serverstart", {sid: serverId}, [], null);
	},

	stopServer: function(serverId){
		return _enqueueCommand("serverstop", {sid: serverId}, [], null);
	},

	stopInstance: function(){
		return _enqueueCommand("serverprocessstop", {}, [], null);
	},

	serverInfo: function(serverId){
		return _enqueueCommand("serverinfo", {}, [], serverId);
	},

	editServer: function(serverId, properties){
		return _enqueueCommand("serveredit", properties, [], serverId);
	},

	serverConnectionInfo: function(serverId){
		return _enqueueCommand("serverrequestconnectioninfo", {}, [], serverId);
	},

	addTemporaryServerPassword: function(serverId, password, description, durationS, defaultChannel, channelPassword){
		return _enqueueCommand("servertemppasswordadd", {
			pw: password,
			desc: description,
			duration: durationS,
			tcid: defaultChannel,
			tcpw: channelPassword
		}, [], serverId);
	},

	deleteTemporaryServerPassword: function(serverId, password){
		return _enqueueCommand("servertemppassworddel", {pw: password}, [], serverId);
	},

	listTemporaryServerPasswords: function(serverId){
		return _enqueueCommand("servertemppasswordlist", {}, [], serverId);
	},

	listServerGroups: function(serverId){
		return _enqueueCommand("servergrouplist", {}, [], serverId);
	},

	addServerGroup: function(serverId, groupName, groupType){
		var params = {
			name: groupName
		};
		if(groupType) params.type = groupType;
		return _enqueueCommand("servergroupadd", params, [], serverId);
	},

	deleteServerGroup: function(serverId, groupId, force){
		var params = {
			sgid: groupId,
			force: force
		};
		if(params.force !== 0
		&& params.force !== 1){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "Invalid force value, must be 0 or 1."
			});
		}
		return _enqueueCommand("servergroupdel", params, [], serverId);
	},

	copyServerGroup: function(serverId, sourceGroupId, targetGroupId, groupName, groupType){
		return _enqueueCommand("servergroupcopy", {
			ssgid: sourceGroupId,
			tsgid: targetGroupId,
			name: groupName,
			type: groupType
		}, [], serverId);
	},

	renameServerGroup: function(serverId, groupId, newName){
		return _enqueueCommand("servergrouprename", {sgid: groupId, name: newName}, [], serverId);
	},

	listServerGroupPermissions: function(serverId, groupId){
		return _enqueueCommand("servergrouppermlist", {sgid: groupId}, [], serverId);
	},

	addServerGroupPermissions: function(serverId, groupId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = [];
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].sgid = groupId;
			commands.push(_enqueueCommand(
				"servergroupaddperm",
				permissions[i],
				[]
			));
		}
		return Promise.all(commands);
	},

	deleteServerGroupPermissions: function(serverId, groupId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _enqueueCommand("servergroupdelperm", {
				sgid: groupId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _enqueueCommand("servergroupdelperm", {
				sgid: groupId,
				permid: permissions
			}, [], serverId);
		}
	},

	listClientsInServerGroup: function(serverId, groupId, names){
		if(names){
			return _enqueueCommand("servergroupclientlist", {sgid: groupId}, ["names"], serverId);
		}else{
			return _enqueueCommand("servergroupclientlist", {sgid: groupId}, [], serverId);
		}
	},

	addClientToServerGroup: function(serverId, groupId, clientDbId){
		return _enqueueCommand("servergroupaddclient", {
			sgid: groupId,
			cldbid: clientDbId
		}, [], serverId);
	},

	removeClientFromServerGroup: function(serverId, groupId, clientDbId){
		return _enqueueCommand("servergroupdelclient", {
			sgid: groupId,
			cldbid: clientDbId
		}, [], serverId);
	},

	serverGroupsContainingClient: function(serverId, clientDbId){
		return _enqueueCommand("servergroupsbyclientid", {cldbid: clientDbId}, [], serverId);
	},

	autoAddPermissionsToServerGroupType: function(groupType, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = [];
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].sgtype = groupType;
			commands.push(_enqueueCommand(
				"servergroupautoaddperm",
				permissions[i],
				[]
			));
		}
		return Promise.all(commands);
	},

	autoDeletePermissionsFromServerGroupType: function(groupType, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _enqueueCommand("servergroupautodelperm", {
				sgtype: groupType,
				permsid: permissions
			}, [], null);
		}else{
			return _enqueueCommand("servergroupautodelperm", {
				sgtype: groupType,
				permid: permissions
			}, [], null);
		}
	},

	sendGeneralMessage: function(message){
		return _enqueueCommand("gm", {msg: message}, [], null);
	},

	sendTargetedMessage: function(serverId, targetMode, target, message){
		return _enqueueCommand("sendtextmessage", {targetmode: targetMode, target: target, msg: message}, [], serverId);
	},

	listChannels: function(serverId, filters){
		if(!Array.isArray(filters)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "filters must be an array."
			});
		}
		filters = filters || [];
		for(var i = 0; i < filters.length; i += 1){
			if(filters[i] !== "topic"
			&& filters[i] !== "flags"
			&& filters[i] !== "voice"
			&& filters[i] !== "limits"){
				callback("Error: Invalid filter: \"" + filters[i] + "\"");
				return;
			}
		}

		return _enqueueCommand("channellist", {}, filters, serverId);
	},

	channelInfo: function(serverId, channelId){
		return _enqueueCommand("channelinfo", {cid: channelId}, [], serverId);
	},

	findChannel: function(serverId, pattern){
		return _enqueueCommand("channelfind", {pattern: pattern}, [], serverId);
	},

	moveChannel: function(serverId, channelId, newParentChannelId, sortOrder){
		var params = {
			cid: channelId,
			cpid: newParentChannelId,
			order: sortOrder
		};
		if(isNaN(params.order)){
			delete params.order;
		}

		return _enqueueCommand("channelfind", params, [], serverId);
	},

	createChannel: function(serverId, properties){
		if(!properties.channel_name){
			return Promise.reject({
				reason: "name-required",
				message: "Must provide a name for the new channel."
			});
		}
		return _enqueueCommand("channelcreate", properties, [], serverId);
	},

	editChannel: function(serverId, properties){
		if(!properties.cid){
			return Promise.reject({
				reason: "id-required",
				message: "Must provide an ID for the channel you wish to edit."
			});
		}
		return _enqueueCommand("channeledit", properties, [], serverId);
	},

	deleteChannel: function(serverId, channelId, force){
		var params = {
			cid: channelId,
			force: force
		};
		if(params.force !== 0
		&& params.force !== 1){
			callback("Error: Invalid force value, must be 0 or 1.");
			return;
		}

		return _enqueueCommand("channeldelete", params, [], serverId);
	},

	listChannelPermissions: function(serverId, channelId){
		return _enqueueCommand("channelpermlist", {cid: channelId}, [], serverId);
	},

	addChannelPermissions: function(serverId, channelId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = [];
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].cid = channelId;
			commands.push(_enqueueCommand(
				"channeladdperm",
				permissions[i],
				[]
			));
		}
		return Promise.all(commands);
	},

	deleteChannelPermissions: function(serverId, channelId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _enqueueCommand("channeldelperm", {
				cid: channelId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _enqueueCommand("channeldelperm", {
				cid: channelId,
				permid: permissions
			}, [], serverId);
		}
	},

	listChannelGroups: function(serverId){
		return _enqueueCommand("channelgrouplist", {}, [], serverId);
	},

	addChannelGroup: function(serverId, groupName, groupType){
		var params = {
			name: groupName
		};
		if(groupType) params.type = groupType;
		return _enqueueCommand("channelgroupadd", params, [], serverId);
	},

	deleteChannelGroup: function(serverId, groupId, force){
		var params = {
			cgid: groupId,
			force: force
		};
		if(params.force !== 0
		&& params.force !== 1){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "Invalid force value, must be 0 or 1."
			});
		}
		return _enqueueCommand("channelgroupdel", params, [], serverId);
	},

	copyChannelGroup: function(serverId, sourceGroupId, targetGroupId, groupName, groupType){
		return _enqueueCommand("channelgroupcopy", {
			scgid: sourceGroupId,
			tcgid: targetGroupId,
			name: groupName,
			type: groupType
		}, [], serverId);
	},

	renameChannelGroup: function(serverId, groupId, newName){
		return _enqueueCommand("channelgrouprename", {
			cgid: groupId,
			name: newName
		}, [], serverId);
	},

	listChannelGroupPermissions: function(serverId, groupId){
		return _enqueueCommand("channelgrouppermlist", {cgid: groupId}, [], serverId);
	},

	addChannelGroupPermissions: function(serverId, groupId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = [];
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].cgid = groupId;
			commands.push(_enqueueCommand(
				"channelgroupaddperm",
				permissions[i],
				[]
			));
		}
		return Promise.all(commands);
	},

	deleteChannelGroupPermissions: function(serverId, groupId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _enqueueCommand("channelgroupdelperm", {
				cgid: groupId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _enqueueCommand("channelgroupdelperm", {
				cgid: groupId,
				permid: permissions
			}, [], serverId);
		}
	},

	listClientsInChannelGroup: function(serverId, channelId, clientDbId, groupId){
		var params = {};
		if(channelId) params.cid = channelId;
		if(clientDbId) params.cldbid = clientDbId;
		if(groupId) params.cgid = groupId;

		return _enqueueCommand("channelgroupclientlist", params, [], serverId);
	},

	setClientChannelGroup: function(serverId, groupId, channelId, clientDbId){
		return _enqueueCommand("setclientchannelgroup", {
			cgid: groupId,
			cid: channelId,
			cldbid: clientDbId
		}, [], serverId);
	},

	listClients: function(serverId, filters){
		if(!Array.isArray(filters)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "filters must be an array."
			});
		}
		filters = filters || [];
		for(var i = 0; i < filters.length; i += 1){
			if(filters[i] !== "uid"
			&& filters[i] !== "away"
			&& filters[i] !== "voice"
			&& filters[i] !== "times"
			&& filters[i] !== "groups"
			&& filters[i] !== "info"
			&& filters[i] !== "icon"
			&& filters[i] !== "country"
			&& filters[i] !== "ip"){
				return Promise.reject({
					reason: "invalid-filter",
					message: "Invalid filter: \"" + filters[i] + "\""
				});
			}
		}
		return _enqueueCommand("clientlist", {}, filters, serverId);
	},

	clientInfo: function(serverId, clientId){
		return _enqueueCommand("clientinfo", {clid: clientId}, [], serverId);
	},

	findClient: function(serverId, pattern){
		return _enqueueCommand("clientfind", {pattern: pattern}, [], serverId);
	},

	editClient: function(serverId, properties){
		if(!properties.clid){
			return Promise.reject({
				reason: "id-required",
				message: "Must provide an ID for the client you wish to edit."
			});
		}
		return _enqueueCommand("clientedit", properties, [], serverId);
	},

	listClientDbEntries: function(serverId, start, duration, count){
		var params = {};
		if(start) params.start = start;
		if(duration) params.duration = duration;
		if(count) count = ["count"];

		return _enqueueCommand("clientdblist", params, count, serverId);
	},

	findClientDbEntries: function(serverId, pattern, uid){
		if(uid){
			return _enqueueCommand("clientdbfind", {pattern: pattern}, ["uid"], serverId);
		}else{
			return _enqueueCommand("clientdbfind", {pattern: pattern}, [], serverId);
		}
	},

	clientDbEntryInfo: function(serverId, clientDbId){
		return _enqueueCommand("clientdbinfo", {cldbid: clientDbId}, [], serverId);
	},

	editClientDbEntry: function(serverId, properties){
		if(!properties.cldbid){
			return Promise.reject({
				reason: "id-required",
				message: "Must provide an ID for the database client you wish to edit."
			});
		}
		return _enqueueCommand("clientdbedit", properties, [], serverId);
	},

	deleteClientDbEntry: function(serverId, clientDbId){
		return _enqueueCommand("clientdbdelete", {cldbid: clientDbId}, [], serverId);
	},

	clientByUid: function(serverId, clientUid){
		return _enqueueCommand("clientgetids", {cluid: clientUid}, [], serverId);
	},

	clientDbIdFromUid: function(serverId, clientUid){
		return _enqueueCommand("clientgetdbidfromuid", {cluid: clientUid}, [], serverId);
	},

	clientNameFromUid: function(serverId, clientUid){
		return _enqueueCommand("clientgetnamefromuid", {cluid: clientUid}, [], serverId);
	},

	clientNameFromDbId: function(serverId, clientDbId){
		return _enqueueCommand("clientgetnamefromdbid", {cldbid: clientDbId}, [], serverId);
	},

	setClientServerQueryLogin: function(newLoginName){
		return _enqueueCommand("clientsetserverquerylogin", {client_login_name: newLoginName}, [], null);
	},

	updateClient: function(properties){
		return _enqueueCommand("clientupdate", properties, [], null);
	},

	moveClient: function(serverId, clientId, channelId, channelPassword){
		var params = {
			clid: clientId,
			cid: channelId
		}
		if(channelPassword) params.cpw = channelPassword;

		return _enqueueCommand("clientmove", params, [], serverId);
	},

	kickClient: function(serverId, clientIds, reasonId, reasonMessage){
		var params = {
			clid: clientIds,
			reasonid: reasonId
		}
		if(reasonMessage) params.reasonmsg = reasonMessage;

		return _enqueueCommand("clientkick", params, [], serverId);
	},

	pokeClient: function(serverId, clientId, message){
		return _enqueueCommand("clientpoke", {clid: clientId, msg: message}, [], serverId);
	},

	listClientPermissions: function(serverId, clientDbId, permsid){
		var option = [];
		if(permsid) option = ["permsid"];
		return _enqueueCommand("clientpermlist", {cldbid: clientDbId}, option, serverId);
	},

	addClientPermissions: function(serverId, clientDbId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = [];
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].cldbid = clientDbId;
			commands.push(_enqueueCommand(
				"clientaddperm",
				permissions[i],
				[]
			));
		}
		return Promise.all(commands);
	},

	deleteClientPermissions: function(serverId, clientDbId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _enqueueCommand("channeldelperm", {
				cldbid: clientDbId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _enqueueCommand("channeldelperm", {
				cldbid: clientDbId,
				permid: permissions
			}, [], serverId);
		}
	},

	listChannelClientPermissions: function(serverId, channelId, clientDbId, permsid){
		var option = [];
		if(permsid) option = ["permsid"];
		return _enqueueCommand("channelclientpermlist", {
			cid: channelId,
			cldbid: clientDbId
		}, option, serverId);
	},

	addChannelClientPermissions: function(serverId, channelId, clientDbId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = [];
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].cid = channelId;
			permissions[i].cldbid = clientDbId;
			commands.push(_enqueueCommand(
				"channelclientaddperm",
				permissions[i],
				[]
			));
		}
		return Promise.all(commands);
	},

	deleteChannelClientPermissions: function(serverId, channelId, clientDbId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _enqueueCommand("channelclientdelperm", {
				cid: channelId,
				cldbid: clientDbId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _enqueueCommand("channelclientdelperm", {
				cid: channelId,
				cldbid: clientDbId,
				permid: permissions
			}, [], serverId);
		}
	},

	listPermissions: function(){
		return _enqueueCommand("permissionlist", {}, [], null);
	},

	permissionByName: function(permissionName){
		return _enqueueCommand("permidgetbyname", {permsid: permissionName}, [], null);
	},

	clientPermissionsByChannel: function(serverId, channelId, clientDbId, permissionId, permissionName){
		var params = {
			cid: channelId,
			cldbid: clientDbId
		};
		if(permissionId) params.permid = permissionId;
		else if(permissionName) params.permsid = permissionName;

		return _enqueueCommand("permoverview", params, [], serverId);
	},

	currentPermissions: function(permissionId, permissionName){
		var params = {};
		if(permissionId) params.permid = permissionId;
		else if(permissionName) params.permsid = permissionName;

		return _enqueueCommand("permget", params, [], null);
	},

	findPermissions: function(serverId, permissionId, permissionName){
		var params = {};
		if(permissionId) params.permid = permissionId;
		else if(permissionName) params.permsid = permissionName;

		return _enqueueCommand("permfind", params, [], serverId);
	},

	resetPermissions: function(serverId){
		return _enqueueCommand("permreset", {}, [], serverId);
	},

	listPrivilegeKeys: function(serverId){
		return _enqueueCommand("privilegekeylist", {}, [], serverId);
	},

	addPrivilegeKey: function(serverId, tokenType, tokenId1, tokenId2, tokenDesc, tokenCustomSet){
		if(tokenType !== 0
		&& tokenType !== 1){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "tokenType must be 0 or 1."
			});
		}

		var params = {
			tokentype: tokenType,
			tokenid1: tokenId1
		}
		if(tokenType === 1) params.tokenid2 = tokenId2;
		if(tokenDesc) params.tokendescription = tokenDesc;
		if(tokenCustomSet) params.tokencustomset = tokenCustomSet;

		return _enqueueCommand("privilegekeyadd", params, [], serverId);
	},

	deletePrivilegeKey: function(serverId, token){
		return _enqueueCommand("privilegekeydelete", {token: token}, [], serverId);
	},

	usePrivilegeKey: function(serverId, token){
		return _enqueueCommand("privilegekeyuse", {token: token}, [], serverId);
	},

	listMessages: function(){
		return _enqueueCommand("messagelist", {}, [], null);
	},

	sendMessage: function(clientUid, subject, message){
		return _enqueueCommand("messageadd", {
			cluid: clientUid,
			subject: subject,
			message: message
		}, [], null);
	},

	deleteMessage: function(messageId){
		return _enqueueCommand("messagedel", {msgid: messageId}, [], null);
	},

	retrieveMessage: function(messageId){
		return _enqueueCommand("messageget", {msgid: messageId}, [], null);
	},

	updateMessageReadFlag: function(messageId, flagValue){
		if(flagValue !== 0
		&& flagValue !== 1){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "flagValue must be 0 or 1."
			});
		}
		return _enqueueCommand("messageupdateflag", {
			msgid: messageId,
			flag: flagValue
		}, [], null);
	},

	listComplaints: function(serverId, targetClientDbId){
		var params = {};
		if(targetClientDbId) params.tcldbid = targetClientDbId;

		return _enqueueCommand("complainlist", params, [], serverId);
	},

	addComplaintAgainstClient: function(serverId, targetClientDbId, message){
		return _enqueueCommand("complainadd", {
			tcldbid: targetClientDbId,
			message: message
		}, [], serverId);
	},

	deleteAllComplaintsAgainstClient: function(serverId, targetClientDbId){
		return _enqueueCommand("complaindelall", {tcldbid: targetClientDbId}, [], serverId);
	},

	deleteComplaint: function(serverId, targetClientDbId, sourceClientDbId){
		return _enqueueCommand("complaindel", {
			tcldbid: targetClientDbId,
			fcldbid: sourceClientDbId
		}, [], serverId);
	},

	listActiveBans: function(serverId){
		return _enqueueCommand("banlist", {}, [], serverId);
	},

	banClient: function(serverId, clientId, durationS, reason){
		var params = {
			clid: clientId
		};
		if(durationS) params.time = durationS;
		if(reason) params.banreason = reason;

		return _enqueueCommand("banclient", params, [], serverId);
	},

	addBan: function(serverId, ip, name, clientUid, durationS, reason){
		var params = {};
		if(ip) params.ip = ip;
		if(name) params.name = name;
		if(clientUid) params.uid = clientUid;
		if(durationS) params.time = durationS;
		if(reason) params.banreason = reason;

		return _enqueueCommand("banadd", params, [], serverId);
	},

	deleteBan: function(serverId, banId){
		return _enqueueCommand("bandel", {banid: banId}, [], serverId);
	},

	deleteAllActiveBans: function(serverId){
		return _enqueueCommand("bandelall", {}, [], serverId);
	},

	listActiveFileTransfers: function(serverId){
		return _enqueueCommand("ftlist", {}, [], serverId);
	},

	stopFileTransfer: function(serverId, transferId, deleteFile){
		if(deleteFile !== 0
		&& deleteFile !== 1){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "deleteFile must be 0 or 1."
			});
		}
		return _enqueueCommand("ftstop", {serverftfid: transferId, "delete": deleteFile}, [], serverId);
	},

	listFiles: function(serverId, channelId, channelPassword, path){
		var params = {
			cid: channelId,
			cpw: "",
			path: "/"
		};
		if(channelPassword) params.cpw = channelPassword;
		if(path) params.path = path;

		return _enqueueCommand("ftgetfilelist", params, [], serverId);
	},

	fileInfo: function(serverId, channelId, channelPassword, filename){
		var params = {
			cid: channelId,
			cpw: "",
			name: filename
		};
		if(channelPassword) params.cpw = channelPassword;

		return _enqueueCommand("ftgetfileinfo", params, [], serverId);
	},

	deleteFile: function(serverId, channelId, channelPassword, filename){
		var params = {
			cid: channelId,
			cpw: "",
			name: filename
		};
		if(channelPassword) params.cpw = channelPassword;

		return _enqueueCommand("ftdeletefile", params, [], serverId);
	},

	createDirectory: function(serverId, channelId, channelPassword, directory){
		var params = {
			cid: channelId,
			cpw: "",
			dirname: directory
		};
		if(channelPassword) params.cpw = channelPassword;

		return _enqueueCommand("ftcreatedir", params, [], serverId);
	},

	moveFile: function(serverId, sourceChannelId, sourceChannelPassword, sourceFileName, targetChannelId, targetChannelPassword, targetFileName){
		var params = {
			cid: sourceChannelId,
			cpw: "",
			oldName: sourceFileName,
			newName: targetFileName
		};
		if(sourceChannelPassword) params.cpw = sourceChannelPassword;
		if(targetChannelId) params.tcid = targetChannelId;
		if(targetChannelPassword) params.tcpw = targetChannelPassword;

		return _enqueueCommand("ftrenamefile", params, [], serverId);
	},

	whoAmI: function(){
		return _enqueueCommand("whoami", {}, [], null);
	}
}

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

	_send = function(sq, command, params, options, virtualServer){
		return new Promise(function(resolve, reject){
			if(virtualServer){
				sq.send("use", {sid: virtualServer}, function(err, response, rawResponse){
					if(!err){
						sq.send(command, params, options, _handleCallback(resolve, reject));
					}else{
						reject(_errorMessage(err));
					}
				});
			}else{
				sq.send(command, params, options, _handleCallback(resolve, reject));
			}
		});
	},

	_sequentialSend = function(sq, commands, results){
		return new Promise(function(resolve, reject){
			_send(
				sq,
				commands[0].command,
				commands[0].params,
				commands[0].options
			).then(function(response){
				results.push(response);
				commands.splice(0, 1);
				if(commands.length > 0){
					_sequentialSend(sq, commands, results)
					.then(resolve);
				}else{
					resolve();
				}
			});
		});
	},

	_resultsOnly = function(command, params, options, virtualServer){
		return new Promise(function(resolve, reject){
			var sequenceSq, result;
			_login()
			.then(function(sq){
				sequenceSq = sq;
				return _send(sq, command, params, options, virtualServer)
			}).then(function(response){
				result = response;
				return _logout(sequenceSq)
			}).then(function(){
				resolve(result);
			});
		});
	},

	_sequentialResultsOnly = function(commands, results, virtualServer){
		return new Promise(function(resolve, reject){
			_login()
			.then(function(sq){
				sq.send("use", {sid: virtualServer}, function(err, response, rawResponse){
					_sequentialSend(sq, commands, results)
					.then(function(){
						_logout();
					});
				});
			});
		});
	};

module.exports = {
	version: function(){
		return _resultsOnly("version", {}, [], null);
	},

	hostInfo: function(){
		return _resultsOnly("hostinfo", {}, [], null);
	},

	instanceInfo: function(){
		return _resultsOnly("instanceinfo", {}, [], null);
	},

	editInstance: function(params){
		return _resultsOnly("instanceedit", params, [], null);
	},

	bindingList: function(){
		return _resultsOnly("bindinglist", {}, [], null);
	},

	listServers: function(){
		return _resultsOnly("serverlist", {}, [], null);
	},

	serverIdByPort: function(port){
		return _resultsOnly("serveridgetbyport", {virtualserver_port: port}, [], null);
	},

	deleteServer: function(serverId){
		return _resultsOnly("serverdelete", {sid: serverId}, [], null);
	},

	createServer: function(properties){
		if(!properties.virtualserver_name){
			return Promise.reject({
				reason: "name-required",
				message: "Must provide a name for the new server."
			});
		}
		return _resultsOnly("servercreate", properties, [], null);
	},

	startServer: function(serverId){
		return _resultsOnly("serverstart", {sid: serverId}, [], null);
	},

	stopServer: function(serverId){
		return _resultsOnly("serverstop", {sid: serverId}, [], null);
	},

	stopInstance: function(){
		return _resultsOnly("serverprocessstop", {}, [], null);
	},

	serverInfo: function(serverId){
		return _resultsOnly("serverinfo", {}, [], serverId);
	},

	editServer: function(serverId, properties){
		return _resultsOnly("serveredit", properties, [], serverId);
	},

	serverConnectionInfo: function(serverId){
		return _resultsOnly("serverrequestconnectioninfo", {}, [], serverId);
	},

	addTemporaryServerPassword: function(serverId, password, description, durationS, defaultChannel, channelPassword){
		return _resultsOnly("servertemppasswordadd", {
			pw: password,
			desc: description,
			duration: durationS,
			tcid: defaultChannel,
			tcpw: channelPassword
		}, [], serverId);
	},

	deleteTemporaryServerPassword: function(serverId, password){
		return _resultsOnly("servertemppassworddel", {pw: password}, [], serverId);
	},

	listTemporaryServerPasswords: function(serverId){
		return _resultsOnly("servertemppasswordlist", {}, [], serverId);
	},

	listServerGroups: function(serverId){
		return _resultsOnly("servergrouplist", {}, [], serverId);
	},

	addServerGroup: function(serverId, groupName, groupType){
		var params = {
			name: groupName
		};
		if(groupType) params.type = groupType;
		return _resultsOnly("servergroupadd", params, [], serverId);
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
		return _resultsOnly("servergroupdel", params, [], serverId);
	},

	copyServerGroup: function(serverId, sourceGroupId, targetGroupId, groupName, groupType){
		return _resultsOnly("servergroupcopy", {
			ssgid: sourceGroupId,
			tsgid: targetGroupId,
			name: groupName,
			type: groupType
		}, [], serverId);
	},

	renameServerGroup: function(serverId, groupId, newName){
		return _resultsOnly("servergrouprename", {sgid: groupId, name: newName}, [], serverId);
	},

	listServerGroupPermissions: function(serverId, groupId){
		return _resultsOnly("servergrouppermlist", {sgid: groupId}, [], serverId);
	},

	addServerGroupPermissions: function(serverId, groupId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = []
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].sgid = groupId;
			commands.push({
				command: "servergroupaddperm",
				params: permissions[i],
				options: []
			});
		}
		return _sequentialResultsOnly(commands, [], serverId);
	},

	deleteServerGroupPermissions: function(serverId, groupId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _resultsOnly("servergroupdelperm", {
				sgid: groupId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _resultsOnly("servergroupdelperm", {
				sgid: groupId,
				permid: permissions
			}, [], serverId);
		}
	},

	listClientsInServerGroup: function(serverId, groupId, names){
		if(names){
			return _resultsOnly("servergroupclientlist", {sgid: groupId}, ["names"], serverId);
		}else{
			return _resultsOnly("servergroupclientlist", {sgid: groupId}, [], serverId);
		}
	},

	addClientToServerGroup: function(serverId, groupId, clientDbId){
		return _resultsOnly("servergroupaddclient", {
			sgid: groupId,
			cldbid: clientDbId
		}, [], serverId);
	},

	removeClientFromServerGroup: function(serverId, groupId, clientDbId){
		return _resultsOnly("servergroupdelclient", {
			sgid: groupId,
			cldbid: clientDbId
		}, [], serverId);
	},

	serverGroupsContainingClient: function(serverId, clientDbId){
		return _resultsOnly("servergroupsbyclientid", {cldbid: clientDbId}, [], serverId);
	},

	autoAddPermissionsToServerGroupType: function(groupType, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = []
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].sgtype = groupType;
			commands.push({
				command: "servergroupautoaddperm",
				params: permissions[i],
				options: []
			});
		}
		return _sequentialResultsOnly(commands, [], null);
	},

	autoDeletePermissionsFromServerGroupType: function(groupType, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _resultsOnly("servergroupautodelperm", {
				sgtype: groupType,
				permsid: permissions
			}, [], null);
		}else{
			return _resultsOnly("servergroupautodelperm", {
				sgtype: groupType,
				permid: permissions
			}, [], null);
		}
	},

	sendGeneralMessage: function(message){
		return _resultsOnly("gm", {msg: message}, [], null);
	},

	sendTargetedMessage: function(serverId, targetMode, target, message){
		return _resultsOnly("sendtextmessage", {targetmode: targetMode, target: target, msg: message}, [], serverId);
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

		return _resultsOnly("channellist", {}, filters, serverId);
	},

	channelInfo: function(serverId, channelId){
		return _resultsOnly("channelinfo", {cid: channelId}, [], serverId);
	},

	findChannel: function(serverId, pattern){
		return _resultsOnly("channelfind", {pattern: pattern}, [], serverId);
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

		return _resultsOnly("channelfind", params, [], serverId);
	},

	createChannel: function(serverId, properties){
		if(!properties.channel_name){
			return Promise.reject({
				reason: "name-required",
				message: "Must provide a name for the new channel."
			});
		}
		return _resultsOnly("channelcreate", properties, [], serverId);
	},

	editChannel: function(serverId, properties){
		if(!properties.cid){
			return Promise.reject({
				reason: "id-required",
				message: "Must provide an ID for the channel you wish to edit."
			});
		}
		return _resultsOnly("channeledit", properties, [], serverId);
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

		return _resultsOnly("channeldelete", params, [], serverId);
	},

	listChannelPermissions: function(serverId, channelId){
		return _resultsOnly("channelpermlist", {cid: channelId}, [], serverId);
	},

	addChannelPermissions: function(serverId, channelId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = []
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].cid = channelId;
			commands.push({
				command: "channeladdperm",
				params: permissions[i],
				options: []
			});
		}
		_sequentialResultsOnly(commands, [], serverId);
	},

	deleteChannelPermissions: function(serverId, channelId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _resultsOnly("channeldelperm", {
				cid: channelId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _resultsOnly("channeldelperm", {
				cid: channelId,
				permid: permissions
			}, [], serverId);
		}
	},

	listChannelGroups: function(serverId){
		return _resultsOnly("channelgrouplist", {}, [], serverId);
	},

	addChannelGroup: function(serverId, groupName, groupType){
		var params = {
			name: groupName
		};
		if(groupType) params.type = groupType;
		return _resultsOnly("channelgroupadd", params, [], serverId);
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
		return _resultsOnly("channelgroupdel", params, [], serverId);
	},

	copyChannelGroup: function(serverId, sourceGroupId, targetGroupId, groupName, groupType){
		return _resultsOnly("channelgroupcopy", {
			scgid: sourceGroupId,
			tcgid: targetGroupId,
			name: groupName,
			type: groupType
		}, [], serverId);
	},

	renameChannelGroup: function(serverId, groupId, newName){
		return _resultsOnly("channelgrouprename", {
			cgid: groupId,
			name: newName
		}, [], serverId);
	},

	listChannelGroupPermissions: function(serverId, groupId){
		return _resultsOnly("channelgrouppermlist", {cgid: groupId}, [], serverId);
	},

	addChannelGroupPermissions: function(serverId, groupId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = []
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].cgid = groupId;
			commands.push({
				command: "channelgroupaddperm",
				params: permissions[i],
				options: []
			});
		}
		_sequentialResultsOnly(commands, [], serverId);
	},

	deleteChannelGroupPermissions: function(serverId, groupId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _resultsOnly("channelgroupdelperm", {
				cgid: groupId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _resultsOnly("channelgroupdelperm", {
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

		return _resultsOnly("channelgroupclientlist", params, [], serverId);
	},

	setClientChannelGroup: function(serverId, groupId, channelId, clientDbId){
		return _resultsOnly("setclientchannelgroup", {
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
		return _resultsOnly("clientlist", {}, filters, serverId);
	},

	clientInfo: function(serverId, clientId){
		return _resultsOnly("clientinfo", {clid: clientId}, [], serverId);
	},

	findClient: function(serverId, pattern){
		return _resultsOnly("clientfind", {pattern: pattern}, [], serverId);
	},

	editClient: function(serverId, properties){
		if(!properties.clid){
			return Promise.reject({
				reason: "id-required",
				message: "Must provide an ID for the client you wish to edit."
			});
		}
		return _resultsOnly("clientedit", properties, [], serverId);
	},

	listClientDbEntries: function(serverId, start, duration, count){
		var params = {};
		if(start) params.start = start;
		if(duration) params.duration = duration;
		if(count) count = ["count"];

		return _resultsOnly("clientdblist", params, count, serverId);
	},

	findClientDbEntries: function(serverId, pattern, uid){
		if(uid){
			return _resultsOnly("clientdbfind", {pattern: pattern}, ["uid"], serverId);
		}else{
			return _resultsOnly("clientdbfind", {pattern: pattern}, [], serverId);
		}
	},

	clientDbEntryInfo: function(serverId, clientDbId){
		return _resultsOnly("clientdbinfo", {cldbid: clientDbId}, [], serverId);
	},

	editClientDbEntry: function(serverId, properties){
		if(!properties.cldbid){
			return Promise.reject({
				reason: "id-required",
				message: "Must provide an ID for the database client you wish to edit."
			});
		}
		return _resultsOnly("clientdbedit", properties, [], serverId);
	},

	deleteClientDbEntry: function(serverId, clientDbId){
		return _resultsOnly("clientdbdelete", {cldbid: clientDbId}, [], serverId);
	},

	clientByUid: function(serverId, clientUid){
		return _resultsOnly("clientgetids", {cluid: clientUid}, [], serverId);
	},

	clientDbIdFromUid: function(serverId, clientUid){
		return _resultsOnly("clientgetdbidfromuid", {cluid: clientUid}, [], serverId);
	},

	clientNameFromUid: function(serverId, clientUid){
		return _resultsOnly("clientgetnamefromuid", {cluid: clientUid}, [], serverId);
	},

	clientNameFromDbId: function(serverId, clientDbId){
		return _resultsOnly("clientgetnamefromdbid", {cldbid: clientDbId}, [], serverId);
	},

	setClientServerQueryLogin: function(newLoginName){
		return _resultsOnly("clientsetserverquerylogin", {client_login_name: newLoginName}, [], null);
	},

	updateClient: function(properties){
		return _resultsOnly("clientupdate", properties, [], null);
	},

	moveClient: function(serverId, clientId, channelId, channelPassword){
		var params = {
			clid: clientId,
			cid: channelId
		}
		if(channelPassword) params.cpw = channelPassword;

		return _resultsOnly("clientmove", params, [], serverId);
	},

	kickClient: function(serverId, clientIds, reasonId, reasonMessage){
		var params = {
			clid: clientIds,
			reasonid: reasonId
		}
		if(reasonMessage) params.reasonmsg = reasonMessage;

		return _resultsOnly("clientkick", params, [], serverId);
	},

	pokeClient: function(serverId, clientId, message){
		return _resultsOnly("clientpoke", {clid: clientId, msg: message}, [], serverId);
	},

	listClientPermissions: function(serverId, clientDbId, permsid){
		var option = [];
		if(permsid) option = ["permsid"];
		return _resultsOnly("clientpermlist", {cldbid: clientDbId}, option, serverId);
	},

	addClientPermissions: function(serverId, clientDbId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		var commands = []
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].cldbid = clientDbId;
			commands.push({
				command: "clientaddperm",
				params: permissions[i],
				options: []
			});
		}
		_sequentialResultsOnly(commands, [], serverId);
	},

	deleteClientPermissions: function(serverId, clientDbId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _resultsOnly("channeldelperm", {
				cldbid: clientDbId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _resultsOnly("channeldelperm", {
				cldbid: clientDbId,
				permid: permissions
			}, [], serverId);
		}
	},

	listChannelClientPermissions: function(serverId, channelId, clientDbId, permsid){
		var option = [];
		if(permsid) option = ["permsid"];
		return _resultsOnly("channelclientpermlist", {
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
		var commands = []
		for(var i = 0; i < permissions.length; i += 1){
			permissions[i].cid = channelId;
			permissions[i].cldbid = clientDbId;
			commands.push({
				command: "channelclientaddperm",
				params: permissions[i],
				options: []
			});
		}
		_sequentialResultsOnly(commands, [], serverId);
	},

	deleteChannelClientPermissions: function(serverId, channelId, clientDbId, permissions){
		if(!Array.isArray(permissions)){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "permissions must be an array."
			});
		}
		if(isNaN(permissions[0])){
			return _resultsOnly("channelclientdelperm", {
				cid: channelId,
				cldbid: clientDbId,
				permsid: permissions
			}, [], serverId);
		}else{
			return _resultsOnly("channelclientdelperm", {
				cid: channelId,
				cldbid: clientDbId,
				permid: permissions
			}, [], serverId);
		}
	},

	listPermissions: function(){
		return _resultsOnly("permissionlist", {}, [], null);
	},

	permissionByName: function(permissionName){
		return _resultsOnly("permidgetbyname", {permsid: permissionName}, [], null);
	},

	clientPermissionsByChannel: function(serverId, channelId, clientDbId, permissionId, permissionName){
		var params = {
			cid: channelId,
			cldbid: clientDbId
		};
		if(permissionId) params.permid = permissionId;
		else if(permissionName) params.permsid = permissionName;

		return _resultsOnly("permoverview", params, [], serverId);
	},

	currentPermissions: function(permissionId, permissionName){
		var params = {};
		if(permissionId) params.permid = permissionId;
		else if(permissionName) params.permsid = permissionName;

		return _resultsOnly("permget", params, [], null);
	},

	findPermissions: function(serverId, permissionId, permissionName){
		var params = {};
		if(permissionId) params.permid = permissionId;
		else if(permissionName) params.permsid = permissionName;

		return _resultsOnly("permfind", params, [], serverId);
	},

	resetPermissions: function(serverId){
		return _resultsOnly("permreset", {}, [], serverId);
	},

	listPrivilegeKeys: function(serverId){
		return _resultsOnly("privilegekeylist", {}, [], serverId);
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

		return _resultsOnly("privilegekeyadd", params, [], serverId);
	},

	deletePrivilegeKey: function(serverId, token){
		return _resultsOnly("privilegekeydelete", {token: token}, [], serverId);
	},

	usePrivilegeKey: function(serverId, token){
		return _resultsOnly("privilegekeyuse", {token: token}, [], serverId);
	},

	listMessages: function(){
		return _resultsOnly("messagelist", {}, [], null);
	},

	sendMessage: function(clientUid, subject, message){
		return _resultsOnly("messageadd", {
			cluid: clientUid,
			subject: subject,
			message: message
		}, [], null);
	},

	deleteMessage: function(messageId){
		return _resultsOnly("messagedel", {msgid: messageId}, [], null);
	},

	retrieveMessage: function(messageId){
		return _resultsOnly("messageget", {msgid: messageId}, [], null);
	},

	updateMessageReadFlag: function(messageId, flagValue){
		if(flagValue !== 0
		&& flagValue !== 1){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "flagValue must be 0 or 1."
			});
		}
		return _resultsOnly("messageupdateflag", {
			msgid: messageId,
			flag: flagValue
		}, [], null);
	},

	listComplaints: function(serverId, targetClientDbId){
		var params = {};
		if(targetClientDbId) params.tcldbid = targetClientDbId;

		return _resultsOnly("complainlist", params, [], serverId);
	},

	addComplaintAgainstClient: function(serverId, targetClientDbId, message){
		return _resultsOnly("complainadd", {
			tcldbid: targetClientDbId,
			message: message
		}, [], serverId);
	},

	deleteAllComplaintsAgainstClient: function(serverId, targetClientDbId){
		return _resultsOnly("complaindelall", {tcldbid: targetClientDbId}, [], serverId);
	},

	deleteComplaint: function(serverId, targetClientDbId, sourceClientDbId){
		return _resultsOnly("complaindel", {
			tcldbid: targetClientDbId,
			fcldbid: sourceClientDbId
		}, [], serverId);
	},

	listActiveBans: function(serverId){
		return _resultsOnly("banlist", {}, [], serverId);
	},

	banClient: function(serverId, clientId, durationS, reason){
		var params = {
			clid: clientId
		};
		if(durationS) params.time = durationS;
		if(reason) params.banreason = reason;

		return _resultsOnly("banclient", params, [], serverId);
	},

	addBan: function(serverId, ip, name, clientUid, durationS, reason){
		var params = {};
		if(ip) params.ip = ip;
		if(name) params.name = name;
		if(clientUid) params.uid = clientUid;
		if(durationS) params.time = durationS;
		if(reason) params.banreason = reason;

		return _resultsOnly("banadd", params, [], serverId);
	},

	deleteBan: function(serverId, banId){
		return _resultsOnly("bandel", {banid: banId}, [], serverId);
	},

	deleteAllActiveBans: function(serverId){
		return _resultsOnly("bandelall", {}, [], serverId);
	},

	listActiveFileTransfers: function(serverId){
		return _resultsOnly("ftlist", {}, [], serverId);
	},

	stopFileTransfer: function(serverId, transferId, deleteFile){
		if(deleteFile !== 0
		&& deleteFile !== 1){
			return Promise.reject({
				reason: "invalid-parameter",
				message: "deleteFile must be 0 or 1."
			});
		}
		return _resultsOnly("ftstop", {serverftfid: transferId, "delete": deleteFile}, [], serverId);
	},

	listFiles: function(serverId, channelId, channelPassword, path){
		var params = {
			cid: channelId,
			cpw: "",
			path: "/"
		};
		if(channelPassword) params.cpw = channelPassword;
		if(path) params.path = path;

		return _resultsOnly("ftgetfilelist", params, [], serverId);
	},

	fileInfo: function(serverId, channelId, channelPassword, filename){
		var params = {
			cid: channelId,
			cpw: "",
			name: filename
		};
		if(channelPassword) params.cpw = channelPassword;

		return _resultsOnly("ftgetfileinfo", params, [], serverId);
	},

	deleteFile: function(serverId, channelId, channelPassword, filename){
		var params = {
			cid: channelId,
			cpw: "",
			name: filename
		};
		if(channelPassword) params.cpw = channelPassword;

		return _resultsOnly("ftdeletefile", params, [], serverId);
	},

	createDirectory: function(serverId, channelId, channelPassword, directory){
		var params = {
			cid: channelId,
			cpw: "",
			dirname: directory
		};
		if(channelPassword) params.cpw = channelPassword;

		return _resultsOnly("ftcreatedir", params, [], serverId);
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

		return _resultsOnly("ftrenamefile", params, [], serverId);
	},

	whoAmI: function(){
		return _resultsOnly("whoami", {}, [], null);
	}
}

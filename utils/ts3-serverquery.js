/*
-----------------------------------------------------------------------------
Copyright (c) 2014 Seth Anderson

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
	loadConfig = require("./common").loadConfig,
	config = loadConfig(__dirname + "/../config/config.json"),
	sq,

	_login = function(callback){
		sq = new ServerQuery(config.ts3.address);
		sq.on("connect", function(){
			sq.send("login", {
				client_login_name: "serveradmin",
				client_login_password: config.ts3.password
			}, callback);
		});
		sq.on("error", function(err){
			if(err.errno === "ECONNREFUSED"){
				callback({
					id: 1,
					msg: "Error: ServerQuery connection refused by host: \"" + config.ts3.address + "\""
				});
			}else{
				callback({
					id: 1,
					msg: "Error: Unknown error from Teamspeak ServerQuery"
				});
			}
		});
	},

	_logout = function(){
		sq.send("logout", null, function(err, response, rawResponse){
			sq.send("quit");
		});
	},

	_send = function(command, params, options, virtualServer, callback){
		if(virtualServer){
			sq.send("use", {sid: virtualServer}, function(err, response, rawResponse){
				if(err.id === 0){
					sq.send(command, params, options, callback);
				}else{
					callback(err, response, rawResponse);
				}
			});
		}else{
			sq.send(command, params, options, callback);
		}
	},

	_sequentialSend = function(commands, results, callback){
		var current = commands[results.length];
		sq.send(current.command, current.params, current.options, function(err, response, rawResponse){
			if(err.id === 0){
				results.push(response);
				if(results.length !== commands.length){
					_sequentialSend(commands, results, callback);
				}else{
					callback(err, response, rawResponse);
				}
			}else{
				callback(err);
			}
		});
	},

	_errorMessage = function(err){
		var error = err.msg;
		if(err.extra_msg){
			error += " (" + err.extra_msg + ")";
		}
		return error;
	},

	_resultsOnly = function(command, params, options, virtualServer, callback){
		_login(function(err, response, rawResponse){
			if(err.id === 0){
				_send(command, params, options, virtualServer, function(err, response, rawResponse){
					if(err.id === 0){
						callback(null, response);
					}else{
						callback(_errorMessage(err));
					}
					_logout();
				});
			}else{
				callback(_errorMessage(err));
				sq.send("quit");
			}
		});
	},

	_sequentialResultsOnly = function(commands, results, virtualServer, callback){
		_login(function(err, response, rawResponse){
			if(err.id === 0){
				if(virtualServer){
					sq.send("use", {sid: virtualServer}, function(err, response, rawResponse){
						_sequentialSend(commands, results, function(err, response, rawResponse){
							if(err.id === 0){
								callback(null, response);
							}else{
								callback(_errorMessage(err));
							}
							_logout();
						});
					});
				}else{
					_sequentialSend(commands, results, function(err, response, rawResponse){
						if(err.id === 0){
							callback(null, response);
						}else{
							callback(_errorMessage(err));
						}
						_logout();
					});
				}
			}else{
				callback(_errorMessage(err));
				sq.send("quit");
			}
		});
	};

module.exports = {
	version: function(callback){
		_resultsOnly("version", null, null, null, callback);
	},

	hostInfo: function(callback){
		_resultsOnly("hostinfo", null, null, null, callback);
	},

	instanceInfo: function(callback){
		_resultsOnly("instanceinfo", null, null, null, callback);
	},

	editInstance: function(params, callback){
		_resultsOnly("instanceedit", params, null, null, callback);
	},

	bindingList: function(callback){
		_resultsOnly("bindinglist", null, null, null, callback);
	},

	listServers: function(callback){
		_resultsOnly("serverlist", null, null, null, callback);
	},

	serverIdByPort: function(port, callback){
		_resultsOnly("serveridgetbyport", {virtualserver_port: port}, null, null, callback);
	},

	deleteServer: function(serverId, callback){
		_resultsOnly("serverdelete", {sid: serverId}, null, null, callback);
	},

	createServer: function(properties, callback){
		if(!properties.virtualserver_name){
			callback("Error: Must provide a name for the new server.");
			return;
		}
		_resultsOnly("servercreate", properties, null, null, callback);
	},

	startServer: function(serverId, callback){
		_resultsOnly("serverstart", {sid: serverId}, null, null, callback);
	},

	stopServer: function(serverId, callback){
		_resultsOnly("serverstop", {sid: serverId}, null, null, callback);
	},

	stopInstance: function(callback){
		_resultsOnly("serverprocessstop", null, null, null, callback);
	},

	serverInfo: function(serverId, callback){
		_resultsOnly("serverinfo", null, null, serverId, callback);
	},

	editServer: function(serverId, properties, callback){
		_resultsOnly("serveredit", properties, null, serverId, callback);
	},

	serverConnectionInfo: function(serverId, callback){
		_resultsOnly("serverrequestconnectioninfo", null, null, serverId, callback);
	},

	addTemporaryServerPassword: function(serverId, password, description, durationS, defaultChannel, channelPassword, callback){
		_resultsOnly("servertemppasswordadd", {
			pw: password,
			desc: description,
			duration: durationS,
			tcid: defaultChannel,
			tcpw: channelPassword
		}, null, serverId, callback);
	},

	deleteTemporaryServerPassword: function(serverId, password, callback){
		_resultsOnly("servertemppassworddel", {pw: password}, null, serverId, callback);
	},

	listTemporaryServerPasswords: function(serverId, callback){
		_resultsOnly("servertemppasswordlist", null, null, serverId, callback);
	},

	listServerGroups: function(serverId, callback){
		_resultsOnly("servergrouplist", null, null, serverId, callback);
	},

	addServerGroup: function(serverId, groupName, groupType, callback){
		var params = {
			name: groupName
		};
		if(groupType) params.type = groupType;
		_resultsOnly("servergroupadd", params, null, serverId, callback);
	},

	deleteServerGroup: function(serverId, groupId, force, callback){
		var params = {
			sgid: groupId,
			force: force
		};
		if(params.force !== 0
		|| params.force !== 1){
			callback("Error: Invalid force value, must be 0 or 1.");
			return;
		}
		_resultsOnly("servergroupdel", params, null, serverId, callback);
	},

	copyServerGroup: function(serverId, sourceGroupId, targetGroupId, groupName, groupType, callback){
		_resultsOnly("servergroupcopy", {
			ssgid: sourceGroupId,
			tsgid: targetGroupId,
			name: groupName,
			type: groupType
		}, null, serverId, callback);
	},

	renameServerGroup: function(serverId, groupId, newName, callback){
		_resultsOnly("servergrouprename", {sgid: groupId, name: newName}, null, serverId, callback);
	},

	listServerGroupPermissions: function(serverId, groupId, callback){
		_resultsOnly("servergrouppermlist", {sgid: groupId}, null, serverId, callback);
	},

	addServerGroupPermissions: function(serverId, groupId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
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
		_sequentialResultsOnly(commands, [], serverId, callback);
	},

	deleteServerGroupPermissions: function(serverId, groupId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
		}
		if(isNaN(permissions[0])){
			_resultsOnly("servergroupdelperm", {
				sgid: groupId,
				permsid: permissions
			}, null, serverId, callback);
		}else{
			_resultsOnly("servergroupdelperm", {
				sgid: groupId,
				permid: permissions
			}, null, serverId, callback);
		}
	},

	listClientsInServerGroup: function(serverId, groupId, names, callback){
		if(names){
			_resultsOnly("servergroupclientlist", {sgid: groupId}, ["names"], serverId, callback);
		}else{
			_resultsOnly("servergroupclientlist", {sgid: groupId}, null, serverId, callback);
		}
	},

	addClientToServerGroup: function(serverId, groupId, clientDbId, callback){
		_resultsOnly("servergroupaddclient", {
			sgid: groupId,
			cldbid: clientDbId
		}, null, serverId, callback);
	},

	removeClientFromServerGroup: function(serverId, groupId, clientDbId, callback){
		_resultsOnly("servergroupdelclient", {
			sgid: groupId,
			cldbid: clientDbId
		}, null, serverId, callback);
	},

	serverGroupsContainingClient: function(serverId, clientDbId, callback){
		_resultsOnly("servergroupsbyclientid", {cldbid: clientDbId}, null, serverId, callback);
	},

	autoAddPermissionsToServerGroupType: function(groupType, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
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
		_sequentialResultsOnly(commands, [], null, callback);
	},

	autoDeletePermissionsFromServerGroupType: function(groupType, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
		}
		if(isNaN(permissions[0])){
			_resultsOnly("servergroupautodelperm", {
				sgtype: groupType,
				permsid: permissions
			}, null, null, callback);
		}else{
			_resultsOnly("servergroupautodelperm", {
				sgtype: groupType,
				permid: permissions
			}, null, null, callback);
		}
	},

	sendGeneralMessage: function(message, callback){
		_resultsOnly("gm", {msg: message}, null, null, callback);
	},

	sendTargetedMessage: function(serverId, targetMode, target, message, callback){
		_resultsOnly("sendtextmessage", {targetmode: targetMode, target: target, msg: message}, null, serverId, callback);
	},

	listChannels: function(serverId, filters, callback){
		if(!Array.isArray(filters)){
			callback("Error: filters must be an array.");
			return;
		}
		for(var i = 0; i < filters.length; i += 1){
			if(filters[i] !== "topic"
			&& filters[i] !== "flags"
			&& filters[i] !== "voice"
			&& filters[i] !== "limits"){
				callback("Error: Invalid filter: \"" + filters[i] + "\"");
				return;
			}
		}

		_resultsOnly("channellist", null, filters, serverId, callback);
	},

	channelInfo: function(serverId, channelId, callback){
		_resultsOnly("channelinfo", {cid: channelId}, null, serverId, callback);
	},

	findChannel: function(serverId, pattern, callback){
		_resultsOnly("channelfind", {pattern: pattern}, null, serverId, callback);
	},

	moveChannel: function(serverId, channelId, newParentChannelId, sortOrder, callback){
		var params = {
			cid: channelId,
			cpid: newParentChannelId,
			order: sortOrder
		};
		if(isNaN(params.order)){
			delete params.order;
		}

		_resultsOnly("channelfind", params, null, serverId, callback);
	},

	createChannel: function(serverId, properties, callback){
		if(!properties.channel_name){
			callback("Error: Must provide a name for the new channel.");
			return;
		}
		_resultsOnly("channelcreate", properties, null, serverId, callback);
	},

	editChannel: function(serverId, properties, callback){
		if(!properties.cid){
			callback("Error: Must provide an ID for the channel you wish to edit.");
			return;
		}
		_resultsOnly("channeledit", properties, null, serverId, callback);
	},

	deleteChannel: function(serverId, channelId, force, callback){
		var params = {
			cid: channelId,
			force: force
		};
		if(params.force !== 0
		|| params.force !== 1){
			callback("Error: Invalid force value, must be 0 or 1.");
			return;
		}

		_resultsOnly("channeldelete", params, null, serverId, callback);
	},

	listChannelPermissions: function(serverId, channelId, callback){
		_resultsOnly("channelpermlist", {cid: channelId}, null, serverId, callback);
	},

	addChannelPermissions: function(serverId, channelId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
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
		_sequentialResultsOnly(commands, [], serverId, callback);
	},

	deleteChannelPermissions: function(serverId, channelId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
		}
		if(isNaN(permissions[0])){
			_resultsOnly("channeldelperm", {
				cid: channelId,
				permsid: permissions
			}, null, serverId, callback);
		}else{
			_resultsOnly("channeldelperm", {
				cid: channelId,
				permid: permissions
			}, null, serverId, callback);
		}
	},

	listChannelGroups: function(serverId, callback){
		_resultsOnly("channelgrouplist", null, null, serverId, callback);
	},

	addChannelGroup: function(serverId, groupName, groupType, callback){
		var params = {
			name: groupName
		};
		if(groupType) params.type = groupType;
		_resultsOnly("channelgroupadd", params, null, serverId, callback);
	},

	deleteChannelGroup: function(serverId, groupId, force, callback){
		var params = {
			cgid: groupId,
			force: force
		};
		if(params.force !== 0
		|| params.force !== 1){
			callback("Error: Invalid force value, must be 0 or 1.");
			return;
		}
		_resultsOnly("channelgroupdel", params, null, serverId, callback);
	},

	copyChannelGroup: function(serverId, sourceGroupId, targetGroupId, groupName, groupType, callback){
		_resultsOnly("channelgroupcopy", {
			scgid: sourceGroupId,
			tcgid: targetGroupId,
			name: groupName,
			type: groupType
		}, null, serverId, callback);
	},

	renameChannelGroup: function(serverId, groupId, newName, callback){
		_resultsOnly("channelgrouprename", {
			cgid: groupId,
			name: newName
		}, null, serverId, callback);
	},

	listChannelGroupPermissions: function(serverId, groupId, callback){
		_resultsOnly("channelgrouppermlist", {cgid: groupId}, null, serverId, callback);
	},

	addChannelGroupPermissions: function(serverId, groupId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
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
		_sequentialResultsOnly(commands, [], serverId, callback);
	},

	deleteChannelGroupPermissions: function(serverId, groupId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
		}
		if(isNaN(permissions[0])){
			_resultsOnly("channelgroupdelperm", {
				cgid: groupId,
				permsid: permissions
			}, null, serverId, callback);
		}else{
			_resultsOnly("channelgroupdelperm", {
				cgid: groupId,
				permid: permissions
			}, null, serverId, callback);
		}
	},

	listClientsInChannelGroup: function(serverId, channelId, clientDbId, groupId, callback){
		var params = {};
		if(channelId) params.cid = channelId;
		if(clientDbId) params.cldbid = clientDbId;
		if(groupId) params.cgid = groupId;

		_resultsOnly("channelgroupclientlist", params, null, serverId, callback);
	},

	setClientChannelGroup: function(serverId, groupId, channelId, clientDbId, callback){
		_resultsOnly("setclientchannelgroup", {
			cgid: groupId,
			cid: channelId,
			cldbid: clientDbId
		}, null, serverId, callback);
	},

	listClients: function(serverId, filters, callback){
		if(!Array.isArray(filters)){
			callback("Error: filters must be an array.");
			return;
		}
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
				callback("Error: Invalid filter: \"" + filters[i] + "\"");
				return;
			}
		}
		_resultsOnly("clientlist", null, filters, serverId, callback);
	},

	clientInfo: function(serverId, clientId, callback){
		_resultsOnly("clientinfo", {clid: clientId}, null, serverId, callback);
	},

	findClient: function(serverId, pattern, callback){
		_resultsOnly("clientfind", {pattern: pattern}, null, serverId, callback);
	},

	editClient: function(serverId, properties, callback){
		if(!properties.clid){
			callback("Error: Must provide an ID for the client you wish to edit.");
			return;
		}
		_resultsOnly("clientedit", properties, null, serverId, callback);
	},

	listClientDbEntries: function(serverId, start, duration, count, callback){
		var params = {};
		if(start) params.start = start;
		if(duration) params.duration = duration;
		if(count) count = ["count"];

		_resultsOnly("clientdblist", params, count, serverId, callback);
	},

	findClientDbEntries: function(serverId, pattern, uid, callback){
		if(uid){
			_resultsOnly("clientdbfind", {pattern: pattern}, ["uid"], serverId, callback);
		}else{
			_resultsOnly("clientdbfind", {pattern: pattern}, null, serverId, callback);
		}
	},

	clientDbEntryInfo: function(serverId, clientDbId, callback){
		_resultsOnly("clientdbinfo", {cldbid: clientDbId}, null, serverId, callback);
	},

	editClientDbEntry: function(serverId, properties, callback){
		if(!properties.cldbid){
			callback("Error: Must provide an ID for the database client you wish to edit.");
			return;
		}
		_resultsOnly("clientdbedit", properties, null, serverId, callback);
	},

	deleteClientDbEntry: function(serverId, clientDbId, callback){
		_resultsOnly("clientdbdelete", {cldbid: clientDbId}, null, serverId, callback);
	},

	clientByUid: function(serverId, clientUid, callback){
		_resultsOnly("clientgetids", {cluid: clientUid}, null, serverId, callback);
	},

	clientDbIdFromUid: function(serverId, clientUid, callback){
		_resultsOnly("clientgetdbidfromuid", {cluid: clientUid}, null, serverId, callback);
	},

	clientNameFromUid: function(serverId, clientUid, callback){
		_resultsOnly("clientgetnamefromuid", {cluid: clientUid}, null, serverId, callback);
	},

	clientNameFromDbId: function(serverId, clientDbId, callback){
		_resultsOnly("clientgetnamefromdbid", {cldbid: clientDbId}, null, serverId, callback);
	},

	setClientServerQueryLogin: function(newLoginName, callback){
		_resultsOnly("clientsetserverquerylogin", {client_login_name: newLoginName}, null, null, callback);
	},

	updateClient: function(properties, callback){
		_resultsOnly("clientupdate", properties, null, null, callback);
	},

	moveClient: function(serverId, clientId, channelId, channelPassword, callback){
		var params = {
			clid: clientId,
			cid: channelId
		}
		if(channelPassword) params.cpw = channelPassword;

		_resultsOnly("clientmove", params, null, serverId, callback);
	},

	kickClient: function(serverId, clientIds, reasonId, reasonMessage, callback){
		var params = {
			clid: clientIds,
			reasonid: reasonId
		}
		if(reasonMessage) params.reasonmsg = reasonMessage;

		_resultsOnly("clientkick", params, null, serverId, callback);
	},

	pokeClient: function(serverId, clientId, message, callback){
		_resultsOnly("clientpoke", {clid: clientId, msg: message}, null, serverId, callback);
	},

	listClientPermissions: function(serverId, clientDbId, permsid, callback){
		var option = null;
		if(permsid) option = ["permsid"];
		_resultsOnly("clientpermlist", {cldbid: clientDbId}, option, serverId, callback);
	},

	addClientPermissions: function(serverId, clientDbId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
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
		_sequentialResultsOnly(commands, [], serverId, callback);
	},

	deleteClientPermissions: function(serverId, clientDbId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
		}
		if(isNaN(permissions[0])){
			_resultsOnly("channeldelperm", {
				cldbid: clientDbId,
				permsid: permissions
			}, null, serverId, callback);
		}else{
			_resultsOnly("channeldelperm", {
				cldbid: clientDbId,
				permid: permissions
			}, null, serverId, callback);
		}
	},

	listChannelClientPermissions: function(serverId, channelId, clientDbId, permsid, callback){
		var option = null;
		if(permsid) option = ["permsid"];
		_resultsOnly("channelclientpermlist", {
			cid: channelId,
			cldbid: clientDbId
		}, option, serverId, callback);
	},

	addChannelClientPermissions: function(serverId, channelId, clientDbId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
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
		_sequentialResultsOnly(commands, [], serverId, callback);
	},

	deleteChannelClientPermissions: function(serverId, channelId, clientDbId, permissions, callback){
		if(!Array.isArray(permissions)){
			callback("Error: permissions must be an array.");
			return;
		}
		if(isNaN(permissions[0])){
			_resultsOnly("channelclientdelperm", {
				cid: channelId,
				cldbid: clientDbId,
				permsid: permissions
			}, null, serverId, callback);
		}else{
			_resultsOnly("channelclientdelperm", {
				cid: channelId,
				cldbid: clientDbId,
				permid: permissions
			}, null, serverId, callback);
		}
	},

	listPermissions: function(callback){
		_resultsOnly("permissionlist", null, null, null, callback);
	},

	permissionByName: function(permissionName, callback){
		_resultsOnly("permidgetbyname", {permsid: permissionName}, null, null, callback);
	},

	clientPermissionsByChannel: function(serverId, channelId, clientDbId, permissionId, permissionName, callback){
		var params = {
			cid: channelId,
			cldbid: clientDbId
		};
		if(permissionId) params.permid = permissionId;
		else if(permissionName) params.permsid = permissionName;

		_resultsOnly("permoverview", params, null, serverId, callback);
	},

	currentPermissions: function(permissionId, permissionName, callback){
		var params = {};
		if(permissionId) params.permid = permissionId;
		else if(permissionName) params.permsid = permissionName;

		_resultsOnly("permget", params, null, null, callback);
	},

	findPermissions: function(serverId, permissionId, permissionName, callback){
		var params = {};
		if(permissionId) params.permid = permissionId;
		else if(permissionName) params.permsid = permissionName;

		_resultsOnly("permfind", params, null, serverId, callback);
	},

	resetPermissions: function(serverId, callback){
		_resultsOnly("permreset", null, null, serverId, callback);
	},

	listPrivilegeKeys: function(serverId, callback){
		_resultsOnly("privilegekeylist", null, null, serverId, callback);
	},

	addPrivilegeKey: function(serverId, tokenType, tokenId1, tokenId2, tokenDesc, tokenCustomSet, callback){
		if(tokenType !== 0
		&& tokenType !== 1){
			callback("Error: tokenType must be 0 or 1.");
			return;
		}

		var params = {
			tokentype: tokenType,
			tokenid1: tokenId1
		}
		if(tokenType === 1) params.tokenid2 = tokenId2;
		if(tokenDesc) params.tokendescription = tokenDesc;
		if(tokenCustomSet) params.tokencustomset = tokenCustomSet;

		_resultsOnly("privilegekeyadd", params, null, serverId, callback);
	},

	deletePrivilegeKey: function(serverId, token, callback){
		_resultsOnly("privilegekeydelete", {token: token}, null, serverId, callback);
	},

	usePrivilegeKey: function(serverId, token, callback){
		_resultsOnly("privilegekeyuse", {token: token}, null, serverId, callback);
	},

	listMessages: function(callback){
		_resultsOnly("messagelist", null, null, null, callback);
	},

	sendMessage: function(clientUid, subject, message, callback){
		_resultsOnly("messageadd", {
			cluid: clientUid,
			subject: subject,
			message: message
		}, null, null, callback);
	},

	deleteMessage: function(messageId, callback){
		_resultsOnly("messagedel", {msgid: messageId}, null, null, callback);
	},

	retrieveMessage: function(messageId, callback){
		_resultsOnly("messageget", {msgid: messageId}, null, null, callback);
	},

	updateMessageReadFlag: function(messageId, flagValue, callback){
		if(flagValue !== 0
		&& flagValue !== 1){
			callback("Error: flagValue must be 0 or 1.");
			return;
		}
		_resultsOnly("messageupdateflag", {
			msgid: messageId,
			flag: flagValue
		}, null, null, callback);
	},

	listComplaints: function(serverId, targetClientDbId, callback){
		var params = {};
		if(targetClientDbId) params.tcldbid = targetClientDbId;

		_resultsOnly("complainlist", params, null, serverId, callback);
	},

	addComplaintAgainstClient: function(serverId, targetClientDbId, message, callback){
		_resultsOnly("complainadd", {
			tcldbid: targetClientDbId,
			message: message
		}, null, serverId, callback);
	},

	deleteAllComplaintsAgainstClient: function(serverId, targetClientDbId, callback){
		_resultsOnly("complaindelall", {tcldbid: targetClientDbId}, null, serverId, callback);
	},

	deleteComplaint: function(serverId, targetClientDbId, sourceClientDbId, callback){
		_resultsOnly("complaindel", {
			tcldbid: targetClientDbId,
			fcldbid: sourceClientDbId
		}, null, serverId, callback);
	},

	listActiveBans: function(serverId, callback){
		_resultsOnly("banlist", null, null, serverId, callback);
	},

	banClient: function(serverId, clientId, durationS, reason, callback){
		var params = {
			clid: clientId
		};
		if(durationS) params.time = durationS;
		if(reason) params.banreason = reason;

		_resultsOnly("banclient", params, null, serverId, callback);
	},

	addBan: function(serverId, ip, name, clientUid, durationS, reason, callback){
		var params = {};
		if(ip) params.ip = ip;
		if(name) params.name = name;
		if(clientUid) params.uid = clientUid;
		if(durationS) params.time = durationS;
		if(reason) params.banreason = reason;

		_resultsOnly("banadd", params, null, serverId, callback);
	},

	deleteBan: function(serverId, banId, callback){
		_resultsOnly("bandel", {banid: banId}, null, serverId, callback);
	},

	deleteAllActiveBans: function(serverId, callback){
		_resultsOnly("bandelall", null, null, serverId, callback);
	},

	listActiveFileTransfers: function(serverId, callback){
		_resultsOnly("ftlist", null, null, serverId, callback);
	},

	stopFileTransfer: function(serverId, transferId, deleteFile, callback){
		if(deleteFile !== 0
		&& deleteFile !== 1){
			callback("Error: deleteFile must be 0 or 1.");
			return;
		}
		_resultsOnly("ftstop", {serverftfid: transferId, "delete": deleteFile}, null, serverId, callback);
	},

	listFiles: function(serverId, channelId, channelPassword, path, callback){
		var params = {
			cid: channelId,
			cpw: "",
			path: "/"
		};
		if(channelPassword) params.cpw = channelPassword;
		if(path) params.path = path;

		_resultsOnly("ftgetfilelist", params, null, serverId, callback);
	},

	fileInfo: function(serverId, channelId, channelPassword, filename, callback){
		var params = {
			cid: channelId,
			cpw: "",
			name: filename
		};
		if(channelPassword) params.cpw = channelPassword;

		_resultsOnly("ftgetfileinfo", params, null, serverId, callback);
	},

	deleteFile: function(serverId, channelId, channelPassword, filename, callback){
		var params = {
			cid: channelId,
			cpw: "",
			name: filename
		};
		if(channelPassword) params.cpw = channelPassword;

		_resultsOnly("ftdeletefile", params, null, serverId, callback);
	},

	createDirectory: function(serverId, channelId, channelPassword, directory, callback){
		var params = {
			cid: channelId,
			cpw: "",
			dirname: directory
		};
		if(channelPassword) params.cpw = channelPassword;

		_resultsOnly("ftcreatedir", params, null, serverId, callback);
	},

	moveFile: function(serverId, sourceChannelId, sourceChannelPassword, sourceFileName, targetChannelId, targetChannelPassword, targetFileName, callback){
		var params = {
			cid: sourceChannelId,
			cpw: "",
			oldName: sourceFileName,
			newName: targetFileName
		};
		if(sourceChannelPassword) params.cpw = sourceChannelPassword;
		if(targetChannelId) params.tcid = targetChannelId;
		if(targetChannelPassword) params.tcpw = targetChannelPassword;

		_resultsOnly("ftrenamefile", params, null, serverId, callback);
	},

	whoAmI: function(callback){
		_resultsOnly("whoami", null, null, null, callback);
	}
}

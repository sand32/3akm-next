/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2015 Seth Anderson

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

var ts3 = require("../../utils/ts3-serverquery.js"),
	authorize = require("../../authorization.js"),
	blendedAuthenticate = require("../../utils/common.js").blendedAuthenticate;

module.exports = function(app, prefix){
	app.get(prefix + "/version", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.version(function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/host", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.hostInfo(function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/instance", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.instanceInfo(function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.put(prefix + "/instance", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.editInstance(req.body, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/instance/stop", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.stopInstance(function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/binding", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.bindingList(function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/serverByPort/:port", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.port)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.serverIdByPort(req.params.port, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.listServers(function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.createServer(req.body, function(err, data){
			if(!err){
				res.status(201)
				   .location(prefix + "/server/" + data.sid)
				   .send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.serverInfo(req.params.serverId, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.put(prefix + "/server/:serverId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.editServer(req.params.serverId, req.body, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.deleteServer(req.params.serverId, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/connection", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.serverConnectionInfo(req.params.serverId, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/start", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.startServer(req.params.serverId, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/stop", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.stopServer(req.params.serverId, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/temporarypassword", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.listTemporaryServerPasswords(req.params.serverId, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/temporarypassword", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.addTemporaryServerPassword(
			req.params.serverId,
			req.body.password,
			req.body.description,
			req.body.duration,
			req.body.defaultChannel,
			req.body.channelPassword
		, function(err, data){
			if(!err){
				res.status(201).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/temporarypassword", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.deleteTemporaryServerPassword(
			req.params.serverId,
			req.body.password
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/group", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.listServerGroups(req.params.serverId, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/group", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.addServerGroup(
			req.params.serverId,
			req.body.groupName,
			req.body.groupType
		, function(err, data){
			if(!err){
				res.status(201)
				   .location(prefix + "/server/" + req.params.serverId + "/group/" + data.sgid)
				   .end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/group/:groupId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.deleteServerGroup(
			req.params.serverId,
			req.params.groupId,
			req.body.force || 1
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/group/:groupId/copy", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.copyServerGroup(
			req.params.serverId,
			req.params.groupId,
			req.body.targetGroupId,
			req.body.name,
			req.body.type
		, function(err, data){
			if(!err){
				res.status(201)
				   .location(prefix + "/server/" + req.params.serverId + "/group/" + data.sgid)
				   .end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/group/:groupId/rename", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.renameServerGroup(
			req.params.serverId,
			req.params.groupId,
			req.body.newName
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/group/:groupId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.listServerGroupPermissions(
			req.params.serverId,
			req.params.groupId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/group/:groupId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.addServerGroupPermissions(
			req.params.serverId,
			req.params.groupId,
			req.body
		, function(err, data){
			if(!err){
				res.status(201).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/group/:groupId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.deleteServerGroupPermissions(
			req.params.serverId,
			req.params.groupId,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/group/:groupId/clients", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var names = null;
		if(req.query.names){
			names = ["names"];
		}

		ts3.listClientsInServerGroup(
			req.params.serverId,
			req.params.groupId,
			names
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/group/:groupId/clients", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.addClientToServerGroup(
			req.params.serverId,
			req.params.groupId,
			req.body.clientDbId
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/group/:groupId/clients", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.removeClientFromServerGroup(
			req.params.serverId,
			req.params.groupId,
			req.body.clientDbId
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/channel", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var filters = [];
		if(req.query.topic) filters.push("topic");
		if(req.query.flags) filters.push("flags");
		if(req.query.voice) filters.push("voice");
		if(req.query.limits) filters.push("limits");
		if(req.query.icon) filters.push("icon");
		if(req.query.secondsempty) filters.push("secondsempty");

		ts3.listChannels(
			req.params.serverId,
			filters
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/channel", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.createChannel(
			req.params.serverId,
			req.body
		, function(err, data){
			if(!err){
				res.status(201)
				   .location(prefix + "/server/" + req.params.serverId + "/channel/" + data.cid)
				   .end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/channel/search", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.findChannel(
			req.params.serverId,
			req.query.pattern
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/channel/:channelId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.channelInfo(
			req.params.serverId,
			req.params.channelId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.put(prefix + "/server/:serverId/channel/:channelId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		req.body.cid = req.params.channelId;

		ts3.editChannel(
			req.params.serverId,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/channel/:channelId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteChannel(
			req.params.serverId,
			req.params.channelId,
			req.body.force || 1
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/channel/:channelId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.listChannelPermissions(
			req.params.serverId,
			req.params.channelId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/channel/:channelId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.addChannelPermissions(
			req.params.serverId,
			req.params.channelId,
			req.body
		, function(err, data){
			if(!err){
				res.status(201).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/channel/:channelId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteChannelPermissions(
			req.params.serverId,
			req.params.channelId,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/channel/:channelId/move", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var order = null;
		if(req.body.sortOrder) order = req.body.sortOrder;

		ts3.moveChannel(
			req.params.serverId,
			req.params.channelId,
			req.body.newParentChannelId,
			order
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/channel/:channelId/files", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var channelPassword = null,
			path = null;
		if(req.query.channelPassword) channelPassword = req.query.channelPassword;
		if(req.query.path) path = req.query.path;

		ts3.listFiles(
			req.params.serverId,
			req.params.channelId,
			channelPassword,
			path
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/channel/:channelId/files/*", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var channelPassword = null;
		if(req.query.channelPassword) channelPassword = req.query.channelPassword;

		ts3.fileInfo(
			req.params.serverId,
			req.params.channelId,
			channelPassword,
			"/" + req.params[0]
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/channel/:channelId/files/*", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var channelPassword = null;
		if(req.query.channelPassword) channelPassword = req.query.channelPassword;

		ts3.deleteFile(
			req.params.serverId,
			req.params.channelId,
			channelPassword,
			"/" + req.params[0]
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/channelgroup", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.listChannelGroups(
			req.params.serverId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/channelgroup", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.addChannelGroup(
			req.params.serverId,
			req.body.groupName
		, function(err, data){
			if(!err){
				res.status(201)
				   .location(prefix + "/server/" + req.params.serverId + "/channelgroup/" + data.cgid)
				   .end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/channelgroup/:groupId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteChannelGroup(
			req.params.serverId,
			req.params.groupId,
			req.body.force || 1
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/channelgroup/:groupId/copy", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.copyChannelGroup(
			req.params.serverId,
			req.params.groupId,
			req.body.targetGroupId || 0,
			req.body.groupName,
			req.body.groupType
		, function(err, data){
			if(!err){
				res.status(201)
				   .location(prefix + "/server/" + req.params.serverId + "/channelgroup/" + data.cgid)
				   .end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/channelgroup/:groupId/rename", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.renameChannelGroup(
			req.params.serverId,
			req.params.groupId,
			req.body.newName
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/channelgroup/:groupId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.listChannelGroupPermissions(
			req.params.serverId,
			req.params.groupId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/channelgroup/:groupId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.addChannelGroupPermissions(
			req.params.serverId,
			req.params.groupId,
			req.body
		, function(err, data){
			if(!err){
				res.status(201).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/channelgroup/:groupId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.groupId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteChannelGroupPermissions(
			req.params.serverId,
			req.params.groupId,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/channelgroup/clients", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var channelId = null,
			clientDbId = null,
			channelGroupId = null;
		if(req.query.channelId) channelId = req.query.channelId;
		if(req.query.clientDbId) clientDbId = req.query.clientDbId;
		if(req.query.channelGroupId) channelGroupId = req.query.channelGroupId;

		ts3.listClientsInChannelGroup(
			req.params.serverId,
			channelId,
			clientDbId,
			channelGroupId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/knownclient", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var start = null,
			duration = null,
			count = null;
		if(req.query.start) start = req.query.start;
		if(req.query.duration) duration = req.query.duration;
		if(req.query.count) count = ["count"];

		ts3.listClientDbEntries(
			req.params.serverId,
			start,
			duration,
			count
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/knownclient/search", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var uid = null;
		if(req.query.uid) uid = ["uid"];

		ts3.findClientDbEntries(
			req.params.serverId,
			req.query.pattern,
			uid
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/knownclient/byuid", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.clientNameFromUid(
			req.params.serverId,
			req.query.uid
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/knownclient/:clientDbId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.clientDbEntryInfo(
			req.params.serverId,
			req.params.clientDbId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.put(prefix + "/server/:serverId/knownclient/:clientDbId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		req.body.cldbid = req.params.clientDbId;

		ts3.editClientDbEntry(
			req.params.serverId,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/knownclient/:clientDbId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteClientDbEntry(
			req.params.serverId,
			req.params.clientDbId
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/knownclient/:clientDbId/name", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.clientNameFromDbId(
			req.params.serverId,
			req.params.clientDbId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/knownclient/:clientDbId/groups", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.serverGroupsContainingClient(
			req.params.serverId,
			req.params.clientDbId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/knownclient/:clientDbId/channelgroup", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.setClientChannelGroup(
			req.params.serverId,
			req.body.channelGroupId,
			req.body.channelId,
			req.params.clientDbId
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/knownclient/:clientDbId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var permsid = null;
		if(req.query.permsid) permsid = ["permsid"];

		ts3.listClientPermissions(
			req.params.serverId,
			req.params.clientDbId,
			permsid
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/knownclient/:clientDbId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.addClientPermissions(
			req.params.serverId,
			req.params.clientDbId,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/knownclient/:clientDbId/permissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteClientPermissions(
			req.params.serverId,
			req.params.clientDbId,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/knownclient/:clientDbId/channelpermissions/:channelId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var permsid = null;
		if(req.query.permsid) permsid = ["permsid"];

		ts3.listChannelClientPermissions(
			req.params.serverId,
			req.params.channelId,
			req.params.clientDbId,
			permsid
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/knownclient/:clientDbId/channelpermissions/:channelId/bypermission", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var permid = null,
			permsid = null;
		if(req.query.permid) permid = req.query.permid;
		if(req.query.permsid) permsid = req.query.permsid;

		ts3.clientPermissionsByChannel(
			req.params.serverId,
			req.params.channelId,
			req.params.clientDbId,
			permid,
			permsid
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/knownclient/:clientDbId/channelpermissions/:channelId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.addChannelClientPermissions(
			req.params.serverId,
			req.params.channelId,
			req.params.clientDbId,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/knownclient/:clientDbId/channelpermissions/:channelId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientDbId)
		|| isNaN(req.params.channelId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteChannelClientPermissions(
			req.params.serverId,
			req.params.channelId,
			req.params.clientDbId,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/client", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var filters = [];
		if(req.query.uid) filters.push("uid");
		if(req.query.away) filters.push("away");
		if(req.query.voice) filters.push("voice");
		if(req.query.times) filters.push("times");
		if(req.query.groups) filters.push("groups");
		if(req.query.info) filters.push("info");
		if(req.query.icon) filters.push("icon");
		if(req.query.country) filters.push("country");
		if(req.query.ip) filters.push("ip");

		ts3.listClients(
			req.params.serverId,
			filters
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/client/search", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.findClient(
			req.params.serverId,
			req.query.pattern
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/client/byuid", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.clientByUid(
			req.params.serverId,
			req.query.uid
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/client/:clientId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.clientInfo(
			req.params.serverId,
			req.params.clientId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.put(prefix + "/server/:serverId/client/:clientId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		req.body.clid = req.params.clientId;

		ts3.clientInfo(
			req.params.serverId,
			req.body
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/client/:clientId/move", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var channelPassword = null;
		if(req.body.channelPassword) channelPassword = req.body.channelPassword;

		ts3.moveClient(
			req.params.serverId,
			req.params.clientId,
			req.body.channelId,
			channelPassword
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/client/:clientId/kick", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var reasonMessage = null;
		if(req.body.reasonMessage) reasonMessage = req.body.reasonMessage;

		ts3.kickClient(
			req.params.serverId,
			req.params.clientId,
			req.body.reasonId,
			reasonMessage
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/client/:clientId/poke", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.pokeClient(
			req.params.serverId,
			req.params.clientId,
			req.body.message
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/client/:clientId/ban", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.clientId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var time = null,
			banreason = null;
		if(req.body.duration) time = req.body.duration;
		if(req.body.reason) banreason = req.body.reason;

		ts3.banClient(
			req.params.serverId,
			req.params.clientId,
			time,
			banreason
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/privilegekey", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.listPrivilegeKeys(req.params.serverId, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/privilegekey", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var channelId = null,
			description = null,
			customset = null;
		if(req.body.tokenType === 1) channelId = req.body.channelId;
		if(req.body.description) description = req.body.description;
		if(req.body.customset) customset = req.body.customset;

		ts3.addPrivilegeKey(
			req.params.serverId,
			req.body.tokenType,
			req.body.groupId,
			channelId,
			description,
			customset
		, function(err, data){
			if(!err){
				res.status(201)
				   .location("/server/" + req.params.serverId + "/privilegekey/" + data.token)
				   .end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/privilegekey/:token", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.usePrivilegeKey(
			req.params.serverId,
			req.params.token
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/privilegekey/:token", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deletePrivilegeKey(
			req.params.serverId,
			req.params.token
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/complaint", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var clientDbId = null;
		if(req.query.clientDbId) clientDbId = req.query.clientDbId;

		ts3.listComplaints(
			req.params.serverId,
			clientDbId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/complaint/:targetClientDbId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.targetClientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.addComplaintAgainstClient(
			req.params.serverId,
			req.params.targetClientDbId,
			req.body.message
		, function(err, data){
			if(!err){
				res.status(201).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/complaint/:targetClientDbId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.targetClientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteAllComplaintsAgainstClient(
			req.params.serverId,
			req.params.targetClientDbId
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/complaint/:targetClientDbId/:sourceClientDbId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.targetClientDbId)
		|| isNaN(req.params.sourceClientDbId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteComplaint(
			req.params.serverId,
			req.params.targetClientDbId,
			req.params.sourceClientDbId
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/ban", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.listActiveBans(
			req.params.serverId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/ban", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteAllActiveBans(
			req.params.serverId
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/ban", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var ip = null,
			name = null,
			uid = null,
			time = null,
			banreason = null;
		if(req.body.ip) ip = req.body.ip;
		if(req.body.name) name = req.body.name;
		if(req.body.clientUid) uid = req.body.clientUid;
		if(req.body.durationS) time = req.body.durationS;
		if(req.body.reason) banreason = req.body.reason;

		ts3.addBan(
			req.params.serverId,
			ip,
			name,
			uid,
			time,
			banreason
		, function(err, data){
			if(!err){
				res.status(201)
				   .location(prefix + "/server/" + req.params.serverId + "/ban/" + data.banid)
				   .end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/ban/:banId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.banId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteBan(
			req.params.serverId,
			req.params.banId
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/server/:serverId/filetransfer", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.listActiveFileTransfers(
			req.params.serverId
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/server/:serverId/filetransfer/:fileTransferId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)
		|| isNaN(req.params.fileTransferId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.stopFileTransfer(
			req.params.serverId,
			req.params.fileTransferId,
			req.query.deleteFile || 1
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/sendtext", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.sendTargetedMessage(
			req.params.serverId,
			req.body.targetMode,
			req.body.target,
			req.body.message
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/server/:serverId/resetpermissions", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.serverId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.resetPermissions(req.params.serverId, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/message", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.listMessages(function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/message", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.sendMessage(
			req.body.recipientClientUid,
			req.body.subject,
			req.body.message
		, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/message/:messageId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.messageId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.retrieveMessage(req.params.messageId, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.put(prefix + "/message/:messageId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.messageId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.updateMessageReadFlag(
			req.params.messageId,
			req.body.readFlag
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/message/:messageId", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.messageId)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		ts3.deleteMessage(req.params.messageId, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/permission", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.listPermissions(function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/permission/current", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var permid = null,
			permsid = null;
		if(req.query.permissionId) permid = req.query.permissionId;
		if(req.query.permissionName) permsid = req.query.permissionName;

		ts3.currentPermissions(permid, permsid, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/permission/search", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var permid = null,
			permsid = null;
		if(req.query.permissionId) permid = req.query.permissionId;
		if(req.query.permissionName) permsid = req.query.permissionName;

		ts3.findPermissions(req.query.serverId, permid, permsid, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.get(prefix + "/permission/byname", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.permissionByName(req.query.permissionName, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/grouptype/:groupType/permission", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.groupType)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.autoAddPermissionsToServerGroupType(
			req.params.groupType,
			req.body
		, function(err, data){
			if(!err){
				res.status(201).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.delete(prefix + "/grouptype/:groupType/permission", blendedAuthenticate, function(req, res){
		if(isNaN(req.params.groupType)){
			return res.status(404).end();
		}
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.autoAddPermissionsToServerGroupType(
			req.params.groupType,
			req.body
		, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/gm", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.sendGeneralMessage(req.body.message, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/updatecredentials", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.setClientServerQueryLogin(req.body.newLogin, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});

	app.post(prefix + "/updatesettings", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		ts3.updateClient(req.body, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log(err);
			}
		});
	});
}

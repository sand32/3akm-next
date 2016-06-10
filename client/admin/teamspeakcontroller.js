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

require("../common/teamspeakservice.js");
require("../admin-common/teamspeakbrowserdirective.js");

(function(){
	var TeamspeakController = function($q, $scope, ngToast, TeamspeakService){
		var ts = this;
		ts.loaded = false;
		ts.serverInfo = {};
		ts.channels = [];

		var updateBrowser = function(){
			var queries = [
				TeamspeakService.serverInfo(1),
				TeamspeakService.channelList(1),
				TeamspeakService.clientList(1)
			];
			$q.all(queries)
			.then(function(results){
				ts.serverInfo = results[0].data;
				ts.channels = results[1].data;
				calculateChannelDepths(ts.channels);
				addClientsToChannels(results[2].data);
				ts.loaded = true;
			});
		},

		calculateChannelDepths = function(channels){
			var parentageStack = [0], parentFoundAt = -1;
			for(var i = 0; i < channels.length; i += 1){
				parentFoundAt = parentageStack.indexOf(channels[i].pid);
				if(parentFoundAt === parentageStack.length - 1){
					channels[i].depth = parentFoundAt;
				}else if(parentFoundAt !== -1){
					while(parentageStack[parentageStack.length - 1] !== channels[i].pid){
						parentageStack.pop();
					}
					channels[i].depth = parentageStack.length - 1;
				}else{
					channels[i].depth = parentageStack.length;
					parentageStack.push(channels[i].pid);
				}
			}
		},

		addClientsToChannels = function(clients){
			for(var i = 0; i < clients.length; i += 1){
				for(var j = 0; j < ts.channels.length; j += 1){
					if(!ts.channels[j].clients){
						ts.channels[j].clients = [];
					}
					if(ts.channels[j].cid === clients[i].cid
					&& clients[i].client_type === 0){
						ts.channels[j].clients.push(clients[i]);
					}
				}
			}
		};

		updateBrowser();
	};

	angular
		.module("3akm.admin.teamspeak", 
			[
				"3akm.teamspeak",
				"3akm.common.teamspeak"
			])
		.controller("TeamspeakController", TeamspeakController);

	TeamspeakController.$inject = ["$q", "$scope", "ngToast", "TeamspeakService"];
})();

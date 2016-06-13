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
require("./clientdbdetailcontroller.js");

(function(){
	var TeamspeakController = function($q, $scope, $state, ngToast, TeamspeakService){
		var ts = this;
		ts.loaded = false;
		ts.selected = null;
		ts.selectedType = "";
		ts.version = {};
		ts.hostInfo = {};
		ts.instanceInfo = {};
		ts.serverInfo = {};
		ts.channels = [];
		ts.knownClients = [];

		$scope.$on("$stateChangeSuccess", function(){
			ts.selected = null;
			ts.selectedType = "";
			if($state.params.cldbid){
				ts.selected = $state.params.cldbid;
				ts.selectedType = "cldb";
			}
		});

		$scope.updateBrowser = function(){
			var queries = [
				TeamspeakService.version(),
				TeamspeakService.hostInfo(),
				TeamspeakService.instanceInfo(),
				TeamspeakService.serverInfo(1),
				TeamspeakService.channelList(1),
				TeamspeakService.clientList(1),
				TeamspeakService.knownClientList(1)
			];
			$q.all(queries)
			.then(function(results){
				ts.version = results[0].data;

				ts.hostInfo = results[1].data;
				ts.hostInfo.instance_uptime = secondsToHumanReadableDuration(ts.hostInfo.instance_uptime);

				ts.instanceInfo = results[2].data;
				ts.serverInfo = results[3].data;
				ts.channels = results[4].data;
				calculateChannelDepths(ts.channels);
				addClientsToChannels(results[5].data);

				ts.knownClients = results[6].data;
				for(var i = 0; i < ts.knownClients.length; i += 1){
					ts.knownClients[i].client_lastconnected = new Date(ts.knownClients[i].client_lastconnected * 1000);
				}

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
		},

		secondsToHumanReadableDuration = function(secondsDuration){
			var seconds = secondsDuration % 60,
			minutes = (secondsDuration / 60) % 60,
			hours = (secondsDuration / 3600) % 24,
			days = secondsDuration / 86400,
			string = "";
			if(days > 1){
				string += parseInt(days) + "d ";
			}
			if(hours > 1 || string !== ""){
				string += parseInt(hours) + "h ";
			}
			if(minutes > 1 || string !== ""){
				string += parseInt(minutes) + "m ";
			}
			if(seconds > 1 || string !== ""){
				string += parseInt(seconds) + "s";
			}else{
				string = "0s";
			}
			return string;
		};

		$scope.updateBrowser();
	};

	angular
		.module("3akm.admin.teamspeak", 
			[
				"3akm.teamspeak",
				"3akm.common.teamspeak",
				"3akm.admin.clientDbDetail"
			])
		.controller("TeamspeakController", TeamspeakController);

	TeamspeakController.$inject = ["$q", "$scope", "$state", "ngToast", "TeamspeakService"];
})();

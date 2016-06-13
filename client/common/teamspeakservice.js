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

(function(){
	var TeamspeakService = function($http){
		return {
			version: function(){
				return $http.get("/api/service/ts3/version");
			},

			hostInfo: function(){
				return $http.get("/api/service/ts3/host");
			},

			instanceInfo: function(){
				return $http.get("/api/service/ts3/instance");
			},

			serverInfo: function(serverId){
				return $http.get("/api/service/ts3/server/" + serverId);
			},

			channelList: function(serverId){
				return $http.get("/api/service/ts3/server/" + serverId + "/channel");
			},

			clientList: function(serverId){
				return $http.get("/api/service/ts3/server/" + serverId + "/client");
			},

			knownClientList: function(serverId){
				return $http.get("/api/service/ts3/server/" + serverId + "/knownclient");
			},

			knownClient: function(serverId, cldbid){
				return $http.get("/api/service/ts3/server/" + serverId + "/knownclient/" + cldbid);
			},

			editKnownClient: function(serverId, cldbid, putData){
				return $http.put("/api/service/ts3/server/" + serverId + "/knownclient/" + cldbid, putData);
			},

			deleteKnownClient: function(serverId, cldbid){
				return $http.delete("/api/service/ts3/server/" + serverId + "/knownclient/" + cldbid);
			}
		};
	};

	angular
		.module("3akm.teamspeak", [])
		.factory("TeamspeakService", TeamspeakService);

	TeamspeakService.$inject = ["$http"];
})();

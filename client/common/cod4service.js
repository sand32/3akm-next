/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2017 Seth Anderson

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
	var Cod4Service = function($http, $q){
		return {
			retrieveMaps: function(){
				return $http.get("/api/service/cod4/maps");
			},

			retrieveCurrentMap: function(){
				return $http.get("/api/service/cod4/map");
			},

			retrieveStatus: function(){
				return $http.get("/api/service/cod4/status");
			},

			retrieveMapRotation: function(){
				return $http.get("/api/service/cod4/maprotation");
			},

			retrieveGameTypes: function(){
				return $http.get("/api/service/cod4/gametypes");
			},

			retrieveCurrentGameType: function(){
				return $http.get("/api/service/cod4/gametype");
			},

			setGameType: function(gametype){
				return $http.put("/api/service/cod4/gametype", {gametype: gametype});
			},

			rotateMap: function(){
				return $http.post("/api/service/cod4/map/rotate");
			},

			say: function(message){
				return $http.post("/api/service/cod4/say", {message: message});
			}
		};
	};

	angular
		.module("3akm.cod4", [])
		.factory("Cod4Service", Cod4Service);

	Cod4Service.$inject = ["$http", "$q"];
})();

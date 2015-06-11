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

(function(){
	var Cod4Service = function($http, $q){
		return {
			retrieveMaps: function(){
				var deferred = $q.defer();
				$http.get("/api/service/cod4/maps")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			retrieveCurrentMap: function(){
				var deferred = $q.defer();
				$http.get("/api/service/cod4/map")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			retrieveStatus: function(){
				var deferred = $q.defer();
				$http.get("/api/service/cod4/status")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			retrieveMapRotation: function(){
				var deferred = $q.defer();
				$http.get("/api/service/cod4/maprotation")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			retrieveGameTypes: function(){
				var deferred = $q.defer();
				$http.get("/api/service/cod4/gametypes")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			retrieveCurrentGameType: function(){
				var deferred = $q.defer();
				$http.get("/api/service/cod4/gametype")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			setGameType: function(gametype){
				var deferred = $q.defer();
				$http.put("/api/service/cod4/gametype", {gametype: gametype})
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			rotateMap: function(){
				var deferred = $q.defer();
				$http.post("/api/service/cod4/map/rotate")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			say: function(message){
				var deferred = $q.defer();
				$http.post("/api/service/cod4/say", {message: message})
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			}
		};
	};

	angular
		.module("3akm.cod4", [])
		.factory("Cod4Service", Cod4Service);

	Cod4Service.$inject = ["$http", "$q"];
})();

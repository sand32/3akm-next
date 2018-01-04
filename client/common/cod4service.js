/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2018 Seth Anderson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
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

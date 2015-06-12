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

require("../common/cod4service.js");

(function(){
	var Cod4Controller = function($scope, $interval, ngToast, Cod4Service){
		var cod4 = this;
		cod4.map = "Loading...";
		cod4.gametype = "Loading...";
		cod4.latchedGametype = "Loading...";
		cod4.players = [];
		cod4.gametypes = [];
		cod4.busy = false;

		Cod4Service.retrieveGameTypes()
		.then(
			function(data){
				cod4.gametypes = data;
			}
		);

		cod4.rotateMap = function(){
			cod4.busy = true;
			Cod4Service.rotateMap()
			.then(
				function(){
					cod4.busy = false;
					cod4.reloadStatus();
				},
				function(status){
					cod4.busy = false;
					ngToast.danger("Failed to rotate map.");
				}
			);
		};

		cod4.setGameType = function(gametype){
			cod4.busy = true;
			Cod4Service.setGameType(gametype)
			.then(
				function(){
					cod4.busy = false;
					cod4.reloadStatus();
				},
				function(status){
					cod4.busy = false;
					ngToast.danger("Failed to set gametype.");
				}
			);
		};

		cod4.say = function(message){
			cod4.busy = true;
			Cod4Service.say(message || "")
			.then(
				function(){
					cod4.busy = false;
				},
				function(status){
					cod4.busy = false;
					ngToast.danger("Failed to send message.");
				}
			);
		};

		cod4.reloadStatus = function(){
			Cod4Service.retrieveStatus()
			.then(
				function(data){
					cod4.map = data.map;
					cod4.players = data.players;
				},
				function(){
					cod4.map = "Unknown";
					cod4.players = [];
				}
			);
			Cod4Service.retrieveCurrentGameType()
			.then(
				function(data){
					cod4.gametype = data.gametype;
					cod4.latchedGametype = data.latched || data.gametype;
				},
				function(){
					cod4.gametype = "Unknown";
					cod4.latchedGametype = "Unknown";
				}
			);
		};

		cod4.reloadStatus();
		var intervalPromise = $interval(cod4.reloadStatus, 10000);
		$scope.$on("$destroy", function(){
			$interval.cancel(intervalPromise);
		});
	};

	angular
		.module("3akm.admin.cod4", 
			[
				"3akm.cod4"
			])
		.controller("Cod4Controller", Cod4Controller);

	Cod4Controller.$inject = ["$scope", "$interval", "ngToast", "Cod4Service"];
})();

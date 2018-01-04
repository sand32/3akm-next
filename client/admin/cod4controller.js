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
		.then(function(response){
			cod4.gametypes = response.data;
		});

		cod4.rotateMap = function(){
			cod4.busy = true;
			Cod4Service.rotateMap()
			.then(function(){
				cod4.reloadStatus();
				cod4.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to rotate map.");
				cod4.busy = false;
			});
		};

		cod4.setGameType = function(gametype){
			cod4.busy = true;
			Cod4Service.setGameType(gametype)
			.then(function(){
				cod4.reloadStatus();
				cod4.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to set gametype.");
				cod4.busy = false;
			});
		};

		cod4.say = function(message){
			cod4.busy = true;
			Cod4Service.say(message || "")
			.then(function(){
				cod4.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to send message.");
				cod4.busy = false;
			});
		};

		cod4.reloadStatus = function(){
			Cod4Service.retrieveStatus()
			.then(function(response){
				cod4.map = response.data.map;
				cod4.players = response.data.players;
			}).catch(function(){
				cod4.map = "Unknown";
				cod4.players = [];
			});
			Cod4Service.retrieveCurrentGameType()
			.then(function(response){
				cod4.gametype = response.data.gametype;
				cod4.latchedGametype = response.data.latched || response.data.gametype;
			}).catch(function(){
				cod4.gametype = "Unknown";
				cod4.latchedGametype = "Unknown";
			});
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

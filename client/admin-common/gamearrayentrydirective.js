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

require("../common/gameservice.js");
require("./gameselectcontroller.js");

(function(){
	var GameArrayEntry = function($modal, GameService){
		return {
			restrict: "E",
			replace: true,
			templateUrl: "/partial/admin/gamearrayentry",
			scope: {
				items: "=arrayModel",
				defaultDropdownText: "@",
				additionTooltip: "@",
				additionTooltipPlacement: "@",
				removalTooltip: "@",
				removalTooltipPlacement: "@"
			},
			link: function(scope, element, attrs){
				scope.defaultButtonText = "Choose a game";
				scope.additionTooltipPlacement = scope.additionTooltipPlacement || "right";
				scope.removalTooltipPlacement = scope.removalTooltipPlacement || "right";
				scope.games = [];

				GameService.retrieveAll()
				.then(function(response){
					scope.games = response.data;
				});

				scope.addItem = function(){
					scope.items.push({});
					scope.items[scope.items.length - 1].game = "";
					scope.items[scope.items.length - 1].tournamentName = "";
				};

				scope.removeItem = function(index){
					scope.items.splice(index, 1);
				};

				scope.getGameNameFromId = function(id){
					for(var i = 0; i < scope.games.length; i += 1){
						if(scope.games[i]._id === id){
							return scope.games[i].name;
						}
					}
					return scope.defaultButtonText;
				};

				scope.selectGame = function(index){
					var modalInstance = $modal.open({
						templateUrl: "/partial/admin/gameselectmodal",
						controller: "GameSelectController as select",
					});

					modalInstance.result.then(function(gameId){
						scope.items[index].game = gameId;
					});
				};
			}
		}
	};

	angular
		.module("3akm.admin.common.gamearrayentry",
			[
				"3akm.game",
				"3akm.admin.common.gameSelectModal"
			])
		.directive("gameArrayEntry", GameArrayEntry)

	GameArrayEntry.$inject = ["$modal", "GameService"];
})();

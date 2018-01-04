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

require("../common/gameservice.js");
require("./gameselectcontroller.js");

(function(){
	var GameArrayEntry = function($uibModal, GameService){
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
					var modalInstance = $uibModal.open({
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

	GameArrayEntry.$inject = ["$uibModal", "GameService"];
})();

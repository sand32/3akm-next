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

require("../common/gameservice.js");
require("./gamedetailcontroller.js");

(function(){
	var GameListController = function($scope, $state, ngToast, GameService){
		var games = this;
		games.list = [];

		$scope.$on("$stateChangeSuccess", function(){
			games.selectedGame = $state.params.gameId;
		});

		$scope.reloadList = function(){
			GameService.retrieveAll()
			.then(function(response){
				games.list = response.data;
			}).catch(function(){
				ngToast.danger("Failed to retrieve games.");
			});
		};
		$scope.reloadList();
	};

	angular
		.module("3akm.admin.gameList", 
			[
				"3akm.game",
				"3akm.admin.gameDetail"
			])
		.controller("GameListController", GameListController);

	GameListController.$inject = ["$scope", "$state", "ngToast", "GameService"];
})();

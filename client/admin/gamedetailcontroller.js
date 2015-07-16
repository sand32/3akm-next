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

require("../common/gameservice.js");
require("../common/storeservice.js");
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");

(function(){
	var GameDetailController = function($scope, $state, $modal, ngToast, GameService, StoreService){
		var game = this;
		game.busy = false;
		game.current = {
			supplementalFiles: [],
			stores: []
		};
		game.storesEnum = [];

		StoreService.retrieveAll()
		.then(
			function(data){
				for(var i = 0; i < data.length; i += 1){
					game.storesEnum.push({
						key: data[i].name,
						value: data[i]._id
					});
				}
			}
		);

		if($state.params.gameId && $state.params.gameId !== "new"){
			GameService.retrieve($state.params.gameId)
			.then(function(data){
				game.current = data;
			}).catch(function(){
				$state.go("^");
				ngToast.danger("Failed to retrieve game.");
			});
		}

		game.save = function(){
			game.busy = true;
			if($state.params.gameId === "new"){
				GameService.create(game.current)
				.then(function(data){
					$scope.reloadList();
					$state.go(".", {gameId: data._id});
					ngToast.create("Game created.");
					game.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to create game.");
					game.busy = false;
				});
			}else{
				GameService.edit($state.params.gameId, game.current)
				.then(function(){
					$scope.reloadList();
					ngToast.create("Game updated.");
					game.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to update game.");
					game.busy = false;
				});
			}
		};

		game.delete = function(){
			var modalInstance = $modal.open({
				templateUrl: "/partial/confirmmodal",
				controller: "ConfirmController as confirm",
				resolve: {
					message: function(){return "Are you sure you want to delete this game?";}
				}
			});

			modalInstance.result.then(function(){
				GameService.delete($state.params.gameId)
				.then(function(){
					$scope.reloadList();
					$state.go("^");
					ngToast.create("Game deleted.");
				}).catch(function(){
					ngToast.danger("Failed to delete game.")
				});
			});
		};
	};

	angular
		.module("3akm.admin.gameDetail", 
			[
				"textAngular",
				"3akm.game",
				"3akm.store",
				"3akm.confirmModal",
				"3akm.common.arrayentry"
			])
		.controller("GameDetailController", GameDetailController);

	GameDetailController.$inject = ["$scope", "$state", "$modal", "ngToast", "GameService", "StoreService"];
})();

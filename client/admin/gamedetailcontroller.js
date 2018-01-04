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
require("../common/storeservice.js");
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");

(function(){
	var GameDetailController = function($scope, $state, $uibModal, ngToast, GameService, StoreService){
		var game = this;
		game.busy = false;
		game.current = {
			supplementalFiles: [],
			stores: []
		};
		game.storesEnum = [];
		game.help = {
			stores: "AppIDs must be in the following formats per store, where the value you enter will replace [appid]:<br/><br/>"
		}

		StoreService.retrieveAll()
		.then(function(response){
			for(var i = 0; i < response.data.length; i += 1){
				game.storesEnum.push({
					key: response.data[i].name,
					value: response.data[i]._id
				});
				game.help.stores += "<strong>" + response.data[i].name + "</strong>: " + response.data[i].appUrl + "<br/>";
			}
		});

		if($state.params.gameId && $state.params.gameId !== "new"){
			GameService.retrieve($state.params.gameId)
			.then(function(response){
				game.current = response.data;
			}).catch(function(){
				$state.go("^");
				ngToast.danger("Failed to retrieve game.");
			});
		}

		game.save = function(){
			game.busy = true;
			if($state.params.gameId === "new"){
				GameService.create(game.current)
				.then(function(response){
					$scope.reloadList();
					$state.go(".", {gameId: response.data._id});
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
			var modalInstance = $uibModal.open({
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

	GameDetailController.$inject = ["$scope", "$state", "$uibModal", "ngToast", "GameService", "StoreService"];
})();

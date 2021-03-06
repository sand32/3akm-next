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

/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2017 Seth Anderson

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

require("../common/lanservice.js");
require("./landetailcontroller.js");

(function(){
	var LanListController = function($scope, $state, ngToast, LanService){
		var lans = this;
		lans.list = [];

		$scope.$on("$stateChangeSuccess", function(){
			lans.selectedLan = $state.params.lanId;
		});

		$scope.reloadList = function(){
			LanService.retrieveAll()
			.then(function(response){
				lans.list = response.data;
			}).catch(function(){
				ngToast.danger("Failed to retrieve lans.");
			});
		};
		$scope.reloadList();
	};

	angular
		.module("3akm.admin.lanList", 
			[
				"3akm.lan",
				"3akm.admin.lanDetail"
			])
		.controller("LanListController", LanListController);

	LanListController.$inject = ["$scope", "$state", "ngToast", "LanService"];
})();

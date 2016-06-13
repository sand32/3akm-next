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

require("../common/teamspeakservice.js");
require("../common/confirmcontroller.js");

(function(){
	var ClientDbDetailController = function($scope, $state, $modal, ngToast, TeamspeakService){
		var cldb = this;
		cldb.busy = false;
		cldb.current = {};

		TeamspeakService.knownClient(1, $state.params.cldbid)
		.then(function(response){
			cldb.current = response.data;
			cldb.current.client_created = new Date(cldb.current.client_created * 1000);
			cldb.current.client_lastconnected = new Date(cldb.current.client_lastconnected * 1000);
		}).catch(function(){
			$state.go("^");
			ngToast.danger("Failed to retrieve known client... ironically.");
		});

		cldb.save = function(){
			cldb.busy = true;
			TeamspeakService.editKnownClient(1, $state.params.cldbid, {
				client_nickname: cldb.current.client_nickname,
				client_description: cldb.current.client_description
			}).then(function(response){
				$scope.updateBrowser();
				ngToast.create("Known client updated.");
				cldb.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to update known client.");
				cldb.busy = false;
			});
		};

		cldb.delete = function(){
			var modalInstance = $modal.open({
				templateUrl: "/partial/confirmmodal",
				controller: "ConfirmController as confirm",
				resolve: {
					message: function(){return "Are you sure you want to delete the server's knowledge of this client?";}
				}
			});

			modalInstance.result.then(function(){
				cldb.busy = true;
				TeamspeakService.deleteKnownClient(1, $state.params.cldbid)
				.then(function(){
					$scope.updateBrowser();
					$state.go("^");
					ngToast.create("Known client deleted.");
					cldb.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to delete known client.");
					cldb.busy = false;
				});
			});
		};
	};

	angular
		.module("3akm.admin.clientDbDetail", 
			[
				"3akm.teamspeak",
				"3akm.confirmModal"
			])
		.controller("ClientDbDetailController", ClientDbDetailController);

	ClientDbDetailController.$inject = ["$scope", "$state", "$modal", "ngToast", "TeamspeakService"];
})();

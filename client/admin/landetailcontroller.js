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

require("../common/lanservice.js");
require("../common/storeservice.js");
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");
require("../admin-common/gamearrayentrydirective.js");

(function(){
	var LanDetailController = function($scope, $state, $uibModal, ngToast, LanService, GameService){
		var lan = this;
		lan.busy = false;
		lan.current = {
			active: false,
			acceptingRsvps: false,
			games: [],
			foodRequired: []
		};
		lan.gamesEnum = [];
		lan.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];
		lan.help = {
			active: "Determines whether a LAN is visible to the public. Affects: Games page, RSVP form, Appearances page.",
			acceptingRsvps: "Determines whether a LAN is accepting RSVPs. Most utilities will also use the Begin Date of the LAN to determine behavior. Affects: RSVP form, Appearances page."
		};

		GameService.retrieveAll()
		.then(function(response){
			for(var i = 0; i < response.data.length; i += 1){
				lan.gamesEnum.push({
					key: response.data[i].name,
					value: response.data[i]._id
				});
			}
		}).catch(function(){
			$state.go("^");
			ngToast.danger("Failed to retrieve games.");
		});

		if($state.params.lanId && $state.params.lanId !== "new"){
			LanService.retrieve($state.params.lanId)
			.then(function(response){
				lan.current = response.data;
				lan.current.beginDate = new Date(response.data.beginDate);
				lan.current.endDate = new Date(response.data.endDate);
			}).catch(function(){
				$state.go("^");
				ngToast.danger("Failed to retrieve LAN.");
			});
		}

		lan.save = function(){
			lan.busy = true;
			for(var i = 0; i < lan.current.games.length; i += 1){
				lan.current.games[i].sortIndex = i;
				if(lan.current.games[i].tournamentName === ""){
					lan.current.games[i].tournament = false;
				}else{
					lan.current.games[i].tournament = true;
				}
			}
			if($state.params.lanId === "new"){
				LanService.create(lan.current)
				.then(function(response){
					$scope.reloadList();
					$state.go(".", {lanId: response.data._id});
					ngToast.create("LAN created.");
					lan.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to create LAN.");
					lan.busy = false;
				});
			}else{
				LanService.edit($state.params.lanId, lan.current)
				.then(function(){
					$scope.reloadList();
					ngToast.create("LAN updated.");
					lan.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to update LAN.");
					lan.busy = false;
				});
			}
		};

		lan.delete = function(){
			var modalInstance = $uibModal.open({
				templateUrl: "/partial/confirmmodal",
				controller: "ConfirmController as confirm",
				resolve: {
					message: function(){return "Are you sure you want to delete this LAN?";}
				}
			});

			modalInstance.result.then(function(){
				lan.busy = true;
				LanService.delete($state.params.lanId)
				.then(function(){
					$scope.reloadList();
					$state.go("^");
					ngToast.create("LAN deleted.");
					lan.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to delete LAN.");
					lan.busy = false;
				});
			});
		};
	};

	angular
		.module("3akm.admin.lanDetail", 
			[
				"3akm.lan",
				"3akm.confirmModal",
				"3akm.common.arrayentry",
				"3akm.common.enumselect",
				"3akm.admin.common.gamearrayentry"
			])
		.controller("LanDetailController", LanDetailController);

	LanDetailController.$inject = ["$scope", "$state", "$uibModal", "ngToast", "LanService", "GameService"];
})();

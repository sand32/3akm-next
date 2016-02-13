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

require("../common/rsvpservice.js");
require("../common/lanservice.js");
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");
require("../admin-common/userselectcontroller.js");
require("../admin-common/lanselectcontroller.js");
require("../common/enumselectdirective.js");

(function(){
	var RsvpDetailController = function($scope, $state, $modal, ngToast, RsvpService, LanService, UserService){
		var rsvp = this;
		rsvp.loaded = false;
		rsvp.busy = false;
		rsvp.tournaments = []
		rsvp.current = {
			status: "Yes",
			playing: true,
			cleaning: false,
			attended: false,
			guests: 0
		};
		rsvp.userSelectText = "Select";
		rsvp.lanSelectText = "Select";
		rsvp.statusPossibles = [
			{label: "Yes", value: "'Yes'"},
			{label: "Maybe", value: "'Maybe'"},
			{label: "No", value: "'No'"}
		];
		rsvp.boolPossibles = [
			{label: "Yes", value: true},
			{label: "No", value: false}
		];

		if($state.params.rsvpId && $state.params.rsvpId !== "new"){
			RsvpService.retrieve($state.params.rsvpId)
			.then(function(response){
				var promise = LanService.retrieve(response.data.lan._id);
				rsvp.current = response.data;
				rsvp.current.lan.beginDate = new Date(rsvp.current.lan.beginDate);
				return promise;
			}).then(function(response){
				var lan = response.data;
				for(var i = 0; i < lan.games.length; i += 1){
					if(lan.games[i].tournament){
						rsvp.tournaments.push({
							name: lan.games[i].tournamentName,
							game: lan.games[i].game,
							signedUp: rsvp.isSignedUpForTournament(lan.games[i].game)
						});
					}
				}
				rsvp.loaded = true;
			}).catch(function(){
				$state.go("^");
				ngToast.danger("Failed to retrieve RSVP.");
			});
		}else{
			rsvp.loaded = true;
		}

		rsvp.isSignedUpForTournament = function(gameId){
			for(var i = 0; i < rsvp.current.tournaments.length; i += 1){
				if(rsvp.current.tournaments[i].game === gameId){
					return true;
				}
			}
			return false;
		};

		rsvp.selectUser = function(){
			var modalInstance = $modal.open({
				templateUrl: "/partial/userselectmodal",
				controller: "UserSelectController as select",
			});

			modalInstance.result.then(function(userId){
				rsvp.current.user = {_id: userId};
				rsvp.busy = true;
				UserService.retrieve(userId)
				.then(function(response){
					rsvp.userSelectText = response.data.firstName + " " + response.data.lastName
					rsvp.busy = false;
				}).catch(function(){
					rsvp.busy = false;
				});
			});
		};

		rsvp.selectLan = function(){
			var modalInstance = $modal.open({
				templateUrl: "/partial/lanselectmodal",
				controller: "LanSelectController as select",
			});

			modalInstance.result.then(function(lanId){
				rsvp.current.lan = {_id: lanId};
				rsvp.busy = true;
				LanService.retrieve(lanId)
				.then(function(response){
					var lan = response.data;
					rsvp.lanSelectText = lan.beginDate
					for(var i = 0; i < lan.games.length; i += 1){
						if(lan.games[i].tournament){
							rsvp.tournaments.push({
								name: lan.games[i].tournamentName,
								game: lan.games[i].game,
								signedUp: false
							});
						}
					}
					rsvp.busy = false;
				}).catch(function(){
					rsvp.busy = false;
				});
			});
		};

		rsvp.save = function(){
			rsvp.busy = true;
			var data = angular.copy(rsvp.current);
			data.user = rsvp.current.user._id;
			data.lan = rsvp.current.lan._id;
			data.tournaments = [];
			for(var i = 0; i < rsvp.tournaments.length; i += 1){
				if(rsvp.tournaments[i].signedUp){
					data.tournaments.push({
						game: rsvp.tournaments[i].game
					});
				}
			}
			if($state.params.rsvpId === "new"){
				RsvpService.create(data)
				.then(function(response){
					$scope.reloadList();
					$state.go(".", {rsvpId: response.data._id});
					ngToast.create("RSVP created.");
					rsvp.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to create RSVP.");
					rsvp.busy = false;
				});
			}else{
				RsvpService.edit($state.params.rsvpId, data)
				.then(function(){
					$scope.reloadList();
					ngToast.create("RSVP updated.");
					rsvp.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to update RSVP.");
					rsvp.busy = false;
				});
			}
		};

		rsvp.delete = function(){
			var modalInstance = $modal.open({
				templateUrl: "/partial/confirmmodal",
				controller: "ConfirmController as confirm",
				resolve: {
					message: function(){return "Are you sure you want to delete this RSVP?";}
				}
			});

			modalInstance.result.then(function(){
				rsvp.busy = true;
				RsvpService.delete($state.params.rsvpId)
				.then(function(){
					$scope.reloadList();
					$state.go("^");
					ngToast.create("RSVP deleted.");
					rsvp.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to delete RSVP.");
					rsvp.busy = false;
				});
			});
		};
	};

	angular
		.module("3akm.admin.rsvpDetail", 
			[
				"3akm.rsvp",
				"3akm.confirmModal",
				"3akm.userSelectModal",
				"3akm.lanSelectModal",
				"3akm.common.arrayentry",
				"3akm.common.enumselect"
			])
		.controller("RsvpDetailController", RsvpDetailController);

	RsvpDetailController.$inject = ["$scope", "$state", "$modal", "ngToast", "RsvpService", "LanService", "UserService"];
})();

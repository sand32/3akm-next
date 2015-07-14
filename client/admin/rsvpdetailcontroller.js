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

require("../common/rsvpservice.js");
require("../common/lanservice.js");
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");
require("../common/enumselectdirective.js");

(function(){
	var RsvpDetailController = function($scope, $state, $modal, ngToast, RsvpService, LanService){
		var rsvp = this;
		rsvp.busy = false;
		rsvp.tournaments = []
		rsvp.current = {
			status: "Yes",
			playing: true
		};
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
			.then(function(data){
				var promise = LanService.retrieve(data.lan._id);
				rsvp.current = data;
				rsvp.current.lan.beginDate = new Date(rsvp.current.lan.beginDate);
				return promise;
			}).then(function(data){
				for(var i = 0; i < data.games.length; i += 1){
					if(data.games[i].tournament){
						rsvp.tournaments.push({
							name: data.games[i].tournamentName,
							game: data.games[i].game,
							signedUp: rsvp.isSignedUpForTournament(data.games[i].game)
						});
					}
				}
			}).catch(function(){
				$state.go("^");
				ngToast.danger("Failed to retrieve RSVP.");
			});
		}

		rsvp.isSignedUpForTournament = function(gameId){
			for(var i = 0; i < rsvp.current.tournaments.length; i += 1){
				if(rsvp.current.tournaments[i].game === gameId){
					return true;
				}
			}
			return false;
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
				.then(function(data){
					$scope.reloadList();
					$state.go(".", {rsvpId: data._id});
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
				"3akm.common.arrayentry",
				"3akm.common.enumselect"
			])
		.controller("RsvpDetailController", RsvpDetailController);

	RsvpDetailController.$inject = ["$scope", "$state", "$modal", "ngToast", "RsvpService", "LanService"];
})();

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

require("../common/rsvpservice.js");
require("../common/lanservice.js");
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");
require("../admin-common/userselectcontroller.js");
require("../admin-common/lanselectcontroller.js");
require("../common/enumselectdirective.js");

(function(){
	var RsvpDetailController = function($scope, $state, $uibModal, ngToast, RsvpService, LanService, UserService){
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
			var modalInstance = $uibModal.open({
				templateUrl: "/partial/admin/userselectmodal",
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
			var modalInstance = $uibModal.open({
				templateUrl: "/partial/admin/lanselectmodal",
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
			var modalInstance = $uibModal.open({
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

	RsvpDetailController.$inject = ["$scope", "$state", "$uibModal", "ngToast", "RsvpService", "LanService", "UserService"];
})();

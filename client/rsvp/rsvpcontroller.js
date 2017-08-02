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
require("../common/rsvpservice.js");
require("../common/userservice.js");
require("../common/enumselectdirective.js");

(function(){
	var RsvpController = function($scope, $state, $q, ngToast, UserService, LanService, RsvpService){
		var ctrl = this;
		ctrl.year = 0;
		ctrl.entryFee = 0;
		ctrl.tournaments = [];
		ctrl.isLoggedIn = false;
		ctrl.isVerified = false;
		ctrl.busy = false;
		ctrl.loaded = false;
		ctrl.statusPossibles = [
			{label: "Yes", value: "'Yes'"}, 
			{label: "Maybe", value: "'Maybe'"}, 
			{label: "No", value: "'No'"}
		];
		ctrl.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];
		ctrl.current = {
			status: "Yes",
			playing: true,
			guests: 0,
			cleaning: false,
			bringingFood: false
		};

		UserService.retrieve("session")
		.then(function(response){
			ctrl.isVerified = response.data.verified;
			ctrl.isLoggedIn = true;
		}).catch(function(status){
			ctrl.isLoggedIn = false;
		});

		LanService.retrieve("current")
		.then(function(response){
			var lan = response.data;
			var endDate = new Date(lan.endDate);
			ctrl.year = endDate.getFullYear();
			ctrl.stillAcceptingRsvps = Date.now() < endDate;
			ctrl.entryFee = lan.entryFee;
			var promise = RsvpService.retrieveByYear("session", ctrl.year);

			// Load any tournament games for this LAN into our controller
			for(var i = 0; i < lan.games.length; i += 1){
				if(lan.games[i].tournament){
					ctrl.tournaments.push({
						name: lan.games[i].tournamentName,
						game: lan.games[i].game,
						signedUp: false
					});
				}
			}
			return promise;
		}, function(){
			ctrl.loaded = true;
		}).then(function(response){
			ctrl.current = response.data;

			// Load existing signup info into our controller
			for(var i = 0; i < ctrl.current.tournaments.length; i += 1){
				for(var j = 0; j < ctrl.tournaments.length; j += 1){
					if(ctrl.current.tournaments[i].game === ctrl.tournaments[j].game){
						ctrl.tournaments[j].signedUp = true;
					}
				}
			}

			ctrl.loaded = true;
		}).catch(function(response){
			if(response.status === 403){
				$scope.$emit("AuthChanged", false);
			}
			ctrl.loaded = true;
		});

		ctrl.submit = function(){
			ctrl.busy = true;
			ctrl.current.tournaments = [];
			for(var i = 0; i < ctrl.tournaments.length; i += 1){
				if(ctrl.tournaments[i].signedUp){
					ctrl.current.tournaments.push({
						game: ctrl.tournaments[i].game
					});
				}
			}
			RsvpService.createOrEdit("session", ctrl.year, ctrl.current)
			.then(function(){
				ngToast.create("RSVP successfully submitted.");
				$state.go("appearances");
				ctrl.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to submit RSVP.");
				ctrl.busy = false;
			});
		};
	};

	angular
		.module("3akm.rsvpSubmission", [
				"3akm.user",
				"3akm.lan",
				"3akm.rsvp",
				"3akm.common.enumselect"
			])
		.controller("RsvpController", RsvpController);

	RsvpController.$inject = ["$scope", "$state", "$q", "ngToast", "UserService", "LanService", "RsvpService"];
})();

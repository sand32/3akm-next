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

require("../common/lanservice.js");
require("../common/rsvpservice.js");
require("../common/enumselectdirective.js");

(function(){
	var RsvpController = function($scope, $state, LanService, RsvpService){
		var ctrl = this;
		ctrl.year = 0;
		ctrl.tournaments = [];
		ctrl.isLoggedIn = false;
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

		LanService.retrieveNext()
		.then(function(lan){
			var beginDate = new Date(lan.beginDate);
			ctrl.year = beginDate.getFullYear();
			var promise = RsvpService.retrieve("session", ctrl.year);

			// Load any tournament games for this LAN into our controller
			for(var i = 0; i < lan.games.length; i += 1){
				if(lan.games[i].tournament){
					ctrl.tournaments.push({
						name: lan.games[i].tournamentName,
						game: lan.games[i].game._id,
						signedUp: false
					});
				}
			}
			return promise;
		}, function(){
			ctrl.loaded = true;
		})
		.then(function(rsvp){
			ctrl.current = rsvp;
			ctrl.isLoggedIn = true;

			// Load existing signup info into our controller
			for(var i = 0; i < rsvp.tournaments.length; i += 1){
				for(var j = 0; j < ctrl.tournaments.length; j += 1){
					if(rsvp.tournaments[i].tournament === ctrl.tournaments[j].game){
						ctrl.tournaments[j].signedUp = true;
					}
				}
			}

			ctrl.loaded = true;
		}, function(status){
			if(status === 403){
				ctrl.isLoggedIn = false;
				$scope.$emit("AuthChanged", false);
			}else{
				ctrl.isLoggedIn = true;
			}
			ctrl.loaded = true;
		});

		ctrl.submit = function(){
			ctrl.current.tournaments = [];
			for(var i = 0; i < ctrl.tournaments.length; i += 1){
				if(ctrl.tournaments[i].signedUp){
					ctrl.current.tournaments.push({
						tournament: ctrl.tournaments[i].game
					});
				}
			}
			RsvpService.createOrEdit("session", ctrl.year, ctrl.current)
			.then(function(){
				$state.go("appearances");
			});
		};
	};

	angular
		.module("3akm.rsvpSubmission", [
				"3akm.lan",
				"3akm.rsvp",
				"3akm.common.enumselect"
			])
		.controller("RsvpController", RsvpController);

	RsvpController.$inject = ["$scope", "$state", "LanService", "RsvpService"];
})();

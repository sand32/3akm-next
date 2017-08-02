/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2017 Seth Anderson

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

(function(){
	var TournamentController = function(ngToast, LanService){
		var ctrl = this;
		ctrl.tournament = null;
		ctrl.roster = [];
		ctrl.loaded = false;
		ctrl.busy = false;

		LanService.retrieveTournaments("current")
		.then(function(response){
			ctrl.tournament = response.data[0];
			ctrl.loaded = true;
			ctrl.reloadRoster();
		});

		ctrl.reloadRoster = function(){
			LanService.retrieveRoster("current", ctrl.tournament.game)
			.then(function(response){
				ctrl.roster = response.data;
			})
		};

		ctrl.generateRoster = function(){
			ctrl.busy = true;
			LanService.generateRoster("current", ctrl.tournament.game)
			.then(function(){
				ngToast.create("Roster generated.");
				ctrl.busy = false;
				ctrl.reloadRoster();
			}).catch(function(response){
				if(response.status === 423){
					ngToast.danger("Failed to generate roster, roster is locked.");
				}else{
					ngToast.danger("Failed to generate roster.");
				}
				ctrl.busy = false;
			});
		};
	};

	angular
		.module("3akm.admin.tournament", 
			[
				"3akm.lan"
			])
		.controller("TournamentController", TournamentController);

	TournamentController.$inject = ["ngToast", "LanService"];
})();

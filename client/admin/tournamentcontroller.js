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

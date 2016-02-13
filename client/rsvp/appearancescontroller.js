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
require("../common/rsvpservice.js");

(function(){
	var AppearancesController = function($stateParams, $sce, LanService, RsvpService){
		var app = this;
		LanService.retrieve("current")
		.then(function(response){
			var endDate = new Date(response.data.endDate);
			app.activeLanDefined = true;
			app.stillAcceptingRsvps = Date.now() < endDate;
			app.lanYear = endDate.getFullYear();
			return RsvpService.retrieveAllForYear(app.lanYear);
		}).then(function(response){
			app.rsvps = response.data;
			app.yesCount = 0;
			app.maybeCount = 0;

			app.rsvps = app.rsvps.filter(function(value){
				return value.status !== "No";
			});

			for(var i = 0; i < app.rsvps.length; i += 1){
				if(app.rsvps[i].status === "Yes"){
					app.yesCount += 1 + app.rsvps[i].guests;
				}else if(app.rsvps[i].status === "Maybe"){
					app.maybeCount += 1 + app.rsvps[i].guests;
				}
			}
		});
	};

	angular
		.module("3akm.appearances", [
				"3akm.lan",
				"3akm.rsvp"
			])
		.controller("AppearancesController", AppearancesController);

	AppearancesController.$inject = ["$stateParams", "$sce", "LanService", "RsvpService"];
})();

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

(function(){
	var AppearancesController = function($stateParams, $sce, LanService, RsvpService){
		var app = this;
		LanService.retrieveNext()
		.then(function(lan){
			var beginDate = new Date(lan.beginDate);
			app.activeLanDefined = true;
			app.stillAcceptingRsvps = Date.now() < beginDate;
			app.lanYear = beginDate.getFullYear();
			return RsvpService.retrieveAllForYear(app.lanYear);
		})
		.then(function(rsvps){
			app.rsvps = rsvps;
			app.yesCount = 0;
			app.maybeCount = 0;
			for(var i = 0; i < rsvps.length; i += 1){
				if(rsvps[i].status === "Yes"){
					app.yesCount += 1 + rsvps[i].guests;
				}else if(rsvps[i].status === "Maybe"){
					app.maybeCount += 1 + rsvps[i].guests;
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

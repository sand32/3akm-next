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

require("../../common/lanservice.js");
require("../../common/rsvpservice.js");
require("../../admin-common/visualizationdirectives.js");

(function(){
	var CurrentLanController = function(LanService, RsvpService){
		var currentLan = this;
		currentLan.invitationCount = "N/A";
		currentLan.rsvpCount = "N/A";
		currentLan.rsvpGraphData = [];
		currentLan.rsvpGraphOptions = {
			labels: [
				"Yes",
				"Maybe",
				"No"
			],
			color: "rgb(0, 150, 136)"
		};

		LanService.retrieveNext()
		.then(
			function(lan){
				currentLan.year = new Date(lan.beginDate).getFullYear();
				currentLan.daysLeft = Math.round((new Date(lan.beginDate) - new Date())/(1000*60*60*24));
				return RsvpService.retrieveAllForYear(currentLan.year);
			}
		)
		.then(
			function(rsvps){
				var yesCount = 0, maybeCount = 0, noCount = 0;
				for(var i = 0; i < rsvps.length; i += 1){
					if(rsvps[i].status === "Yes"){
						yesCount += 1 + rsvps[i].guests;
					}else if(rsvps[i].status === "Maybe"){
						maybeCount += 1 + rsvps[i].guests;
					}else if(rsvps[i].status === "No"){
						noCount += 1 + rsvps[i].guests;
					}
				}
				currentLan.rsvpGraphData = [yesCount, maybeCount, noCount];
				currentLan.rsvpCount = rsvps.length;
			}
		);
	};

	angular
		.module("3akm.admin.currentLan", 
			[
				"3akm.admin.visualization",
				"3akm.lan",
				"3akm.rsvp"
			])
		.controller("CurrentLanController", CurrentLanController);

	CurrentLanController.$inject = ["LanService", "RsvpService"];
})();

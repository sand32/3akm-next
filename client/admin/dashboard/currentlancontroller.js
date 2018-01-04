/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2018 Seth Anderson

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

require("../../common/lanservice.js");
require("../../common/rsvpservice.js");
require("../../admin-common/stylingdirectives.js");
require("../../admin-common/visualizationdirectives.js");

(function(){
	var CurrentLanController = function(LanService, RsvpService){
		var currentLan = this;
		currentLan.invitationCount = "N/A";
		currentLan.rsvpCount = "N/A";
		currentLan.cleaningCount = "N/A";
		currentLan.rsvpGraphData = [];
		currentLan.rsvpGraphOptions = {
			labels: [
				"Yes",
				"Maybe",
				"No"
			],
			color: "rgb(0, 150, 136)"
		};

		LanService.retrieve("current")
		.then(function(response){
			var lan = response.data;
			currentLan.year = new Date(lan.beginDate).getFullYear();
			if(new Date() < new Date(lan.beginDate)){
				currentLan.daysLeft = Math.round((new Date(lan.beginDate) - new Date())/(1000*60*60*24));
			}else if(new Date() > new Date(lan.endDate)){
				currentLan.daysLeft = Math.round((new Date(lan.endDate) - new Date())/(1000*60*60*24));
			}else{
				currentLan.daysLeft = 0;
			}
			return RsvpService.retrieveAllForYear(currentLan.year);
		}).then(function(response){
			var rsvps = response.data;
			var yesCount = 0, maybeCount = 0, noCount = 0, cleaningCount = 0;
			for(var i = 0; i < rsvps.length; i += 1){
				if(rsvps[i].status === "Yes"){
					yesCount += 1 + rsvps[i].guests;
				}else if(rsvps[i].status === "Maybe"){
					maybeCount += 1 + rsvps[i].guests;
				}else if(rsvps[i].status === "No"){
					noCount += 1 + rsvps[i].guests;
				}

				if(rsvps[i].cleaning){
					cleaningCount += 1;
				}
			}
			currentLan.rsvpGraphData = [yesCount, maybeCount, noCount];
			currentLan.rsvpCount = rsvps.length;
			currentLan.cleaningCount = cleaningCount;
		});
	};

	angular
		.module("3akm.admin.currentLan", 
			[
				"3akm.admin.visualization",
				"3akm.admin.styling",
				"3akm.lan",
				"3akm.rsvp"
			])
		.controller("CurrentLanController", CurrentLanController);

	CurrentLanController.$inject = ["LanService", "RsvpService"];
})();

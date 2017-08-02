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

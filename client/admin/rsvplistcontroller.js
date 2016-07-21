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

require("../common/rsvpservice.js");
require("./rsvpdetailcontroller.js");

(function(){
	var RsvpListController = function($scope, $state, ngToast, RsvpService){
		var rsvps = this;
		rsvps.list = [];

		$scope.$on("$stateChangeSuccess", function(){
			rsvps.selectedRsvp = $state.params.rsvpId;
		});

		$scope.reloadList = function(){
			RsvpService.retrieveAll()
			.then(function(response){
				rsvps.list = response.data;
				for(var i = 0; i < response.data.length; i += 1){
					rsvps.list[i].beginDate = new Date(response.data[i].lan.beginDate);
				}
				rsvps.list.sort(function(a, b){
					return b.beginDate - a.beginDate;
				});
			}).catch(function(){
				ngToast.danger("Failed to retrieve RSVPs.");
			});
		};
		$scope.reloadList();
	};

	angular
		.module("3akm.admin.rsvpList", 
			[
				"3akm.lan",
				"3akm.admin.rsvpDetail"
			])
		.controller("RsvpListController", RsvpListController);

	RsvpListController.$inject = ["$scope", "$state", "ngToast", "RsvpService"];
})();

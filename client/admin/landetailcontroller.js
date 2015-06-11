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
require("../common/storeservice.js");
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");
require("../common/enumselectdirective.js");

(function(){
	var LanDetailController = function($scope, $timeout, $state, $modal, ngToast, LanService){
		var lan = this;
		lan.current = {
			active: false,
			acceptingRsvps: false,
			games: [],
			foodRequired: []
		};
		lan.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];
		lan.help = {
			active: "Determines whether a LAN is visible to the public. Affects: Games page, RSVP form, Appearances page.",
			acceptingRsvps: "Determines whether a LAN is accepting RSVPs. Most utilities will also use the Begin Date of the LAN to determine behavior. Affects: RSVP form, Appearances page."
		};

		if($state.params.lanId && $state.params.lanId !== "new"){
			LanService.retrieve($state.params.lanId)
			.then(
				function(data){
					lan.current = data;
					lan.current.beginDate = new Date(data.beginDate);
					lan.current.endDate = new Date(data.endDate);
					$timeout(function(){$scope.$emit("ResizeContentArea");}, 100);
				},
				function(){
					$state.go("^");
					ngToast.danger("Failed to retrieve LAN.");
				}
			);
		}

		lan.save = function(){
			if($state.params.lanId === "new"){
				LanService.create(lan.current)
				.then(
					function(data){
						$scope.reloadList();
						$state.go(".", {lanId: data._id});
						ngToast.create("LAN created.");
					}, function(){
						ngToast.danger("Failed to create LAN.");
					}
				);
			}else{
				LanService.edit($state.params.lanId, lan.current)
				.then(
					function(){
						$scope.reloadList();
						ngToast.create("LAN updated.");
					}, function(){
						ngToast.danger("Failed to update LAN.");
					}
				);
			}
		};

		lan.delete = function(){
			var modalInstance = $modal.open({
				templateUrl: "/partial/confirmmodal",
				controller: "ConfirmController as confirm",
				resolve: {
					message: function(){return "Are you sure you want to delete this LAN?";}
				}
			});

			modalInstance.result.then(
				function(){
					LanService.delete($state.params.lanId)
					.then(
						function(){
							$scope.reloadList();
							$state.go("^");
							ngToast.create("LAN deleted.");
						}, function(){
							ngToast.danger("Failed to delete LAN.");
						}
					);
				}
			);
		};
	};

	angular
		.module("3akm.admin.lanDetail", 
			[
				"3akm.lan",
				"3akm.confirmModal",
				"3akm.common.arrayentry",
				"3akm.common.enumselect"
			])
		.controller("LanDetailController", LanDetailController);

	LanDetailController.$inject = ["$scope", "$timeout", "$state", "$modal", "ngToast", "LanService"];
})();
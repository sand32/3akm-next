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

require("../common/recipientservice.js");
require("../common/userservice.js");
require("../common/textselectcontroller.js");
require("./recipientdetailcontroller.js");

(function(){
	var RecipientListController = function($scope, $state, $modal, ngToast, RecipientService, UserService){
		var recipients = this;
		recipients.list = [];

		$scope.$on("$stateChangeSuccess", function(){
			recipients.selectedRecipient = $state.params.recipientId;
		});

		$scope.reloadList = function(){
			RecipientService.retrieveAll()
			.then(function(response){
				recipients.list = response.data;
			}).catch(function(){
				ngToast.danger("Failed to retrieve recipients.");
			});
		};
		$scope.reloadList();

		recipients.showVipEmailList = function(){
			UserService.retrieveAll()
			.then(function(response){
				var users = response.data;
				var modalInstance = $modal.open({
					templateUrl: "/partial/textselectmodal",
					controller: "TextSelectController as textSelect",
					resolve: {
						title: function(){return "VIP Email List";},
						text: function(){
							var list = "";

							// Add users to the list
							for(var i = 0; i < users.length; i += 1){
								if(users[i].vip && users[i].verified && users[i].lanInviteDesired && !users[i].blacklisted){
									if(list != ""){
										list += ", ";
									}
									list += users[i].firstName + " " + users[i].lastName + " <" + users[i].email + ">";
								}
							}

							// Add plain recipients to the list
							for(var i = 0; i < recipients.list.length; i += 1){
								if(recipients.list[i].vip){
									if(list != ""){
										list += ", ";
									}
									list += recipients.list[i].firstName + " " + recipients.list[i].lastName + " <" + recipients.list[i].email + ">";
								}
							}
							return list;
						}
					}
				});
			}).catch(function(){
				ngToast.danger("Failed to retrieve users.");
			});
		};

		recipients.showInviteEmailList = function(){
			UserService.retrieveAll()
			.then(function(response){
				var users = response.data;
				var modalInstance = $modal.open({
					templateUrl: "/partial/textselectmodal",
					controller: "TextSelectController as textSelect",
					resolve: {
						title: function(){return "Invite Email List";},
						text: function(){
							var list = "";

							// Add users to the list
							for(var i = 0; i < users.length; i += 1){
								if(users[i].verified && users[i].lanInviteDesired && !users[i].blacklisted){
									if(list != ""){
										list += ", ";
									}
									list += users[i].firstName + " " + users[i].lastName + " <" + users[i].email + ">";
								}
							}

							// Add plain recipients to the list
							for(var i = 0; i < recipients.list.length; i += 1){
								if(list != ""){
									list += ", ";
								}
								list += recipients.list[i].firstName + " " + recipients.list[i].lastName + " <" + recipients.list[i].email + ">";
							}
							return list;
						}
					}
				});
			}).catch(function(){
				ngToast.danger("Failed to retrieve users.");
			});
		};
	};

	angular
		.module("3akm.admin.recipientList", 
			[
				"3akm.recipient",
				"3akm.common.textSelectModal",
				"3akm.admin.recipientDetail"
			])
		.controller("RecipientListController", RecipientListController);

	RecipientListController.$inject = ["$scope", "$state", "$modal", "ngToast", "RecipientService", "UserService"];
})();

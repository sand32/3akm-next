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

require("../common/recipientservice.js");
require("../common/userservice.js");
require("../common/textselectcontroller.js");
require("./recipientdetailcontroller.js");

(function(){
	var RecipientListController = function($scope, $state, $uibModal, ngToast, RecipientService, UserService){
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
				var modalInstance = $uibModal.open({
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
				var modalInstance = $uibModal.open({
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

	RecipientListController.$inject = ["$scope", "$state", "$uibModal", "ngToast", "RecipientService", "UserService"];
})();

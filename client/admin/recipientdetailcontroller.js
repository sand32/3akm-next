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

require("../common/recipientservice.js");
require("../common/enumselectdirective.js");
require("../common/confirmcontroller.js");

(function(){
	var RecipientDetailController = function($scope, $state, $uibModal, ngToast, RecipientService){
		var recipient = this;
		recipient.loaded = false;
		recipient.busy = false;
		recipient.current = {
			vip: false
		};
		recipient.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];
		recipient.help = {
			vip: "Determines whether the recipient is considered a LAN VIP (and is therefore privy to VIP date consultation)."
		};

		if($state.params.recipientId && $state.params.recipientId !== "new"){
			RecipientService.retrieve($state.params.recipientId)
			.then(function(response){
				recipient.current = response.data;
				recipient.loaded = true;
			}).catch(function(){
				$state.go("^");
				ngToast.danger("Failed to retrieve recipient.");
			});
		}else{
			recipient.loaded = true;
		}

		recipient.save = function(){
			recipient.busy = true;
			if($state.params.recipientId === "new"){
				RecipientService.create(recipient.current)
				.then(function(response){
					$scope.reloadList();
					$state.go(".", {recipientId: response.data._id});
					ngToast.create("Recipient created.");
					recipient.busy = false;
				}).catch(function(response){
					if(response.status === 409){
						ngToast.danger("Cannot create recipients with the same email addresses as existing users.");
					}else{
						ngToast.danger("Failed to create recipient.");
					}
					recipient.busy = false;
				});
			}else{
				RecipientService.edit($state.params.recipientId, recipient.current)
				.then(function(){
					$scope.reloadList();
					ngToast.create("Recipient updated.");
					recipient.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to update recipient.");
					recipient.busy = false;
				});
			}
		};

		recipient.delete = function(){
			var modalInstance = $uibModal.open({
				templateUrl: "/partial/confirmmodal",
				controller: "ConfirmController as confirm",
				resolve: {
					message: function(){return "Are you sure you want to delete this recipient?";}
				}
			});

			modalInstance.result.then(function(){
				recipient.busy = true;
				RecipientService.delete($state.params.recipientId)
				.then(function(){
					$scope.reloadList();
					$state.go("^");
					ngToast.create("Recipient deleted.");
					recipient.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to delete recipient.");
					recipient.busy = false;
				});
			});
		};
	};

	angular
		.module("3akm.admin.recipientDetail", 
			[
				"3akm.recipient",
				"3akm.confirmModal",
				"3akm.common.enumselect"
			])
		.controller("RecipientDetailController", RecipientDetailController);

	RecipientDetailController.$inject = ["$scope", "$state", "$uibModal", "ngToast", "RecipientService"];
})();

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

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
require("./recipientdetailcontroller.js");

(function(){
	var RecipientListController = function($scope, $state, ngToast, RecipientService){
		var recipients = this;
		recipients.list = [];

		$scope.$on("$stateChangeSuccess", function(){
			recipients.selectedRecipient = $state.params.recipientId;
		});

		$scope.reloadList = function(){
			RecipientService.retrieveAll()
			.then(function(data){
				recipients.list = data;
			}).catch(function(){
				ngToast.danger("Failed to retrieve recipients.");
			});
		};
		$scope.reloadList();
	};

	angular
		.module("3akm.admin.recipientList", 
			[
				"3akm.recipient",
				"3akm.admin.recipientDetail"
			])
		.controller("RecipientListController", RecipientListController);

	RecipientListController.$inject = ["$scope", "$state", "ngToast", "RecipientService"];
})();

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

require("../common/userservice.js");
require("./userdetailcontroller.js");

(function(){
	var UserListController = function($scope, $state, ngToast, UserService){
		var users = this;
		users.list = [];

		$scope.$on("$stateChangeSuccess", function(){
			users.selectedUser = $state.params.userId;
		});

		$scope.reloadList = function(){
			UserService.retrieveAll()
			.then(
				function(data){
					users.list = data;
				}, function(){
					ngToast.danger("Failed to retrieve users.");
				}
			);
		};
		$scope.reloadList();
	};

	angular
		.module("3akm.admin.userList", 
			[
				"3akm.user",
				"3akm.admin.userDetail"
			])
		.controller("UserListController", UserListController);

	UserListController.$inject = ["$scope", "$state", "ngToast", "UserService"];
})();
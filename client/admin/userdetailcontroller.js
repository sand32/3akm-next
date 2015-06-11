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
require("../common/arrayentrydirectives.js");
require("../common/enumselectdirective.js");
require("../common/validationdirectives.js");

(function(){
	var UserDetailController = function($scope, $timeout, $state, ngToast, UserService){
		var user = this;
		user.current = {
			lanInviteDesired: true,
			blacklisted: false,
			vip: false,
			tertiaryHandles: [],
			roles: []
		};
		user.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];

		if($state.params.userId && $state.params.userId !== "new"){
			UserService.retrieve($state.params.userId)
			.then(
				function(data){
					user.current = data;
					$timeout(function(){$scope.$emit("ResizeContentArea");}, 100);
				},
				function(){
					$state.go("^");
					ngToast.danger("Failed to retrieve user.");
				}
			);
		}

		user.save = function(){
			if($state.params.userId === "new"){
				UserService.create(user.current)
				.then(
					function(data){
						$scope.reloadList();
						$state.go(".", {userId: data._id});
						ngToast.create("User created.");
					}, function(){
						ngToast.danger("Failed to create user.");
					}
				);
			}else{
				UserService.edit($state.params.userId, user.current)
				.then(
					function(){
						$scope.reloadList();
						ngToast.create("User updated.");
					}, function(){
						ngToast.danger("Failed to update user.");
					}
				);
			}
		};

		user.resendVerificationEmail = function(){
			UserService.resendVerificationEmail()
			.then(
				function(){
					ngToast.create("Verification email sent.");
				},
				function(){
					ngToast.danger("Failed to send verification email.");
				}
			);
		};
	};

	angular
		.module("3akm.admin.userDetail", 
			[
				"3akm.user",
				"3akm.common.validation",
				"3akm.common.arrayentry",
				"3akm.common.enumselect"
			])
		.controller("UserDetailController", UserDetailController);

	UserDetailController.$inject = ["$scope", "$timeout", "$state", "ngToast", "UserService"];
})();

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
	var UserDetailController = function($scope, $state, ngToast, UserService){
		var user = this;
		user.loaded = false;
		user.busy = false;
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
		user.help = {
			lanInviteDesired: "Determines whether the user will receive the LAN invitation. This value can be modified by the user.",
			blacklisted: "Determines whether the user will receive the LAN invitation. This value cannot be seen or modified by the user.",
			vip: "Determines whether the user is considered a LAN VIP (and is therefore privy to VIP date consultation)."
		};

		if($state.params.userId && $state.params.userId !== "new"){
			UserService.retrieve($state.params.userId)
			.then(function(data){
				user.current = data;
				user.loaded = true;
			}).catch(function(){
				$state.go("^");
				ngToast.danger("Failed to retrieve user.");
			});
		}else{
			user.loaded = true;
		}

		user.save = function(){
			user.busy = true;
			if($state.params.userId === "new"){
				UserService.create(user.current)
				.then(function(data){
					$scope.reloadList();
					$state.go(".", {userId: data._id});
					ngToast.create("User created.");
					user.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to create user.");
					user.busy = false;
				});
			}else{
				UserService.edit($state.params.userId, user.current)
				.then(function(){
					$scope.reloadList();
					ngToast.create("User updated.");
					user.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to update user.");
					user.busy = false;
				});
			}
		};

		user.resendVerificationEmail = function(){
			user.busy = true;
			UserService.resendVerificationEmail($state.params.userId)
			.then(function(){
				ngToast.create("Verification email sent.");
				user.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to send verification email.");
				user.busy = false;
			});
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

	UserDetailController.$inject = ["$scope", "$state", "ngToast", "UserService"];
})();

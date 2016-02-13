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

require("../common/userservice.js");

(function(){
	var ResetPasswordController = function($scope, $state, ngToast, UserService){
		var ctrl = this;
		ctrl.newPass = "";

		ctrl.resetPassword = function(newPassword){
			UserService.resetPassword($state.params.userId, $state.params.token, newPassword)
			.then(function(){
				ngToast.create("Successfully reset password.");
			}).catch(function(response){
				if(response.status === 404){
					ngToast.danger("Invalid user or token.");
				}else{
					ngToast.danger("Failed to reset password.");
				}
			});
		};
	}

	angular
		.module("3akm.user")
		.controller("ResetPasswordController", ResetPasswordController);

	ResetPasswordController.$inject = ["$scope", "$state", "ngToast", "UserService"];
})();

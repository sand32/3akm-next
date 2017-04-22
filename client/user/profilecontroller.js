/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2017 Seth Anderson

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

require("./changepasswordcontroller.js");
require("../common/userservice.js");
require("../common/enumselectdirective.js");

(function(){
	var ProfileController = function($scope, $state, $uibModal, ngToast, UserService){
		var profile = this;
		profile.busy = false;
		profile.loaded = false;
		profile.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];
		profile.current = null;

		UserService.retrieve("session")
		.then(function(response){
			profile.current = response.data;
			profile.current.tertiaryHandles = profile.current.tertiaryHandles || [];
			profile.current.roles = profile.current.roles || [];
			profile.loaded = true;
		}).catch(function(response){
			if(response.status === 403){
				$scope.$emit("AuthChanged", false);
				$state.go("default");
			}else{
				ngToast.danger("Failed to retrieve user.");
			}
		});

		profile.resendVerificationEmail = function(){
			profile.busy = true;
			UserService.resendVerificationEmail("session")
			.then(function(){
				ngToast.create("Verification email sent.");
				profile.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to send verification email.");
				profile.busy = false;
			});
		};

		profile.save = function(){
			profile.busy = true;
			UserService.edit("session", profile.current)
			.then(function(){
				ngToast.create("User successfully updated.");
				profile.busy = false;
			}).catch(function(response){
				if(response.status === 403){
					$scope.$emit("AuthChanged", false);
					$state.go("default");
					ngToast.danger("Failed to update user, your session has expired.");
				}else if(response.status === 409){
					ngToast.danger("Failed to update user, you attempted to change your email address to one already in use.");
				}else{
					ngToast.danger("Failed to update user.");
				}
				profile.busy = false;
			});
		};

		profile.openChangePasswordModal = function(){
			var modalInstance = $uibModal.open({
				templateUrl: "/partial/changepasswordmodal",
				controller: "ChangePasswordController as changePass"
			});

			modalInstance.result.then(function(passwords){
				UserService.changePassword("session", passwords.oldPassword, passwords.newPassword)
				.then(function(){
					ngToast.create("Password successfully changed.");
				}).catch(function(){
					ngToast.danger("Failed to change password.");
				});
			});
		};
	}

	angular
		.module("3akm.profile", 
			[
				"ui.bootstrap",
				"3akm.user",
				"3akm.changePassword",
				"3akm.common.enumselect"
			])
		.controller("ProfileController", ProfileController);

	ProfileController.$inject = ["$scope", "$state", "$uibModal", "ngToast", "UserService"];
})();

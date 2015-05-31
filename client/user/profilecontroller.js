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

require("./userservice.js");
require("./changepasswordcontroller.js");
require("../common/enumselectdirective.js");

(function(){
	var ProfileController = function($scope, $state, $modal, UserService){
		var profile = this;
		profile.loaded = false;
		profile.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];

		UserService.retrieve("session")
		.then(function(user){
			profile.email = user.email;
			profile.verified = user.verified;
			profile.firstName = user.firstName;
			profile.lastName = user.lastName;
			profile.primaryHandle = user.primaryHandle;
			profile.tertiaryHandles = user.tertiaryHandles || [];
			profile.created = user.created;
			profile.accessed = user.accessed;
			profile.modified = user.modified;
			profile.vip = user.vip;
			profile.lanInviteDesired = user.lanInviteDesired;
			profile.roles = user.roles || [];
			profile.services = user.services;

			// Show the page
			profile.loaded = true;
		}, function(status){
			if(status === 403){
				$scope.$emit("AuthChanged", false);
				$state.go("default");
			}
			// TODO: Set error message
		});

		profile.resendVerificationEmail = function(){
			UserService.resendVerificationEmail()
			.then(
				function(){
					// TODO: Set success message
				},
				function(){
					// TODO: Set error message
				}
			);
		};

		profile.save = function(){
			UserService.edit("session", {
				email: profile.email,
				firstName: profile.firstName,
				lastName: profile.lastName,
				primaryHandle: profile.primaryHandle,
				tertiaryHandles: profile.tertiaryHandles,
				lanInviteDesired: profile.lanInviteDesired,
				roles: profile.roles
			})
			.then(
				function(){
				},
				function(status){
					if(status === 403){
						$scope.$emit("AuthChanged", false);
						$state.go("default");
					}
					// TODO: Set error message
				}
			);
		};

		profile.openChangePasswordModal = function(){
			var modalInstance = $modal.open({
				templateUrl: "/partial/changepasswordmodal",
				controller: "ChangePasswordController as changePass"
			});

			modalInstance.result.then(
				function(newPassword){
					UserService.changePassword("session", newPassword)
					then(
						function(){
							// TODO: Set success message
						},
						function(){
							// TODO: Set error message
						}
					);
				}
			);
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

	ProfileController.$inject = ["$scope", "$state", "$modal", "UserService"];
})();

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
			if(response.status === 401){
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

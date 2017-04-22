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

require("./forgotpasswordcontroller.js");
require("../common/userservice.js");

(function(){
	var AuthController = function($scope, $rootScope, $state, $uibModal, ngToast, UserService){
		var ctrl = this;
		ctrl.busy = false;
		ctrl.isLoggedIn = false;
		ctrl.isAdmin = false;

		UserService.isLoggedIn()
		.then(function(response){
			$scope.$emit("AuthChanged", response.data.isLoggedIn);
		});

		ctrl.login = function(){
			ctrl.busy = true;
			UserService.login(ctrl.email, ctrl.password)
			.then(function(){
				ctrl.email = "";
				ctrl.password = "";
				$scope.$emit("AuthChanged", true);
				$state.go($state.current, {}, {reload: true});
				ctrl.busy = false;
			}).catch(function(){
				ngToast.danger("Invalid username or password.");
				ctrl.busy = false;
			});
		};

		ctrl.logout = function(){
			ctrl.busy = true;
			UserService.logout()
			.then(function(){
				$scope.$emit("AuthChanged", false);
				$state.go($state.current, {}, {reload: true});
				ctrl.busy = false;
			});
		};

		ctrl.openForgotPasswordModal = function(){
			var modalInstance = $uibModal.open({
				templateUrl: "/partial/forgotpasswordmodal",
				controller: "ForgotPasswordController as forgotPass"
			});

			modalInstance.result.then(function(email){
				UserService.sendPasswordResetEmail(email)
				.then(function(){
					ngToast.create("Reset password email sent.");
				}).catch(function(response){
					if(response.status === 404){
						ngToast.danger("No user with that email exists.");
					}else{
						ngToast.danger("Failed to send reset password email.");
					}
				});
			});
		};

		$rootScope.$on("AuthChanged", function(e, loggedIn){
			ctrl.isLoggedIn = loggedIn;
			ctrl.isAdmin = false;
			if(loggedIn){
				UserService.retrieve("session")
				.then(function(response){
					if(response.data.roles.indexOf("admin") !== -1){
						ctrl.isAdmin = true;
					}
				});
			}
		});
	};

	angular
		.module("3akm.auth", [
			"3akm.user",
			"3akm.forgotPassword"
		])
		.controller("AuthController", AuthController);

	AuthController.$inject = ["$scope", "$rootScope", "$state", "$uibModal", "ngToast", "UserService"];
})();

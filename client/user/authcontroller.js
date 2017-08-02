/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2017 Seth Anderson

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

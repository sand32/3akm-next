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

require("../common/userservice.js");

(function(){
	var RegistrationController = function($scope, $state, ngToast, UserService){
		var reg = this;
		reg.busy = false;
		reg.tertiaryHandles = [];
		reg.help = {
			password: "Your password must consist of at least 8 characters including a lowercase letter, an uppercase letter, and a number.<br/><br/>Your password also must not contain any significant portion of your first or last names."
		}

		reg.register = function(){
			reg.busy = true;
			UserService.register({
				email: reg.email,
				password: reg.pass,
				firstName: reg.firstName,
				lastName: reg.lastName,
				primaryHandle: reg.primaryHandle,
				tertiaryHandles: reg.tertiaryHandles,
				recaptchaResponse: grecaptcha.getResponse()
			}).then(function(){
				ngToast.create("User successfully registered and verification email sent.");
				$scope.$emit("AuthChanged", true);
				$state.go("default");
				reg.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to register user.");
				reg.busy = false;
			});
		};
	}

	angular
		.module("3akm.user")
		.controller("RegistrationController", RegistrationController);

	RegistrationController.$inject = ["$scope", "$state", "ngToast", "UserService"];
})();

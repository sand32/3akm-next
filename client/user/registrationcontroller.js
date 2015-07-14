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

(function(){
	var RegistrationController = function($scope, $state, ngToast, UserService){
		var reg = this;
		reg.busy = false;
		reg.tertiaryHandles = [];

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
			})
			.then(function(){
				ngToast.create("User successfully registered.");
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

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
	var VerifyController = function($scope, $state, ngToast, UserService, jwtHelper){
		var ctrl = this;
		ctrl.loaded = false;

		UserService.verify($state.params.userId, $state.params.token)
		.then(function(response){
			localStorage.setItem("id_token", response.data.token);
			ctrl.loaded = true;
		}).catch(function(response){
			if(response.status === 500){
				ngToast.danger("The server has encountered an error, please try again.");
			}
			ctrl.loaded = true;
		});

		ctrl.verified = function(){
			var token = localStorage.getItem("id_token");
			if(!token) return false;

			var tokenPayload = jwtHelper.decodeToken(token);
			if(!tokenPayload || !tokenPayload.verified) return false;

			return tokenPayload.verified;
		};
	}

	angular
		.module("3akm.user")
		.controller("VerifyController", VerifyController);

	VerifyController.$inject = ["$scope", "$state", "ngToast", "UserService", "jwtHelper"];
})();

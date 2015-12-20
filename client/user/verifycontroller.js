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
	var VerifyController = function($scope, $state, ngToast, UserService){
		var verify = this;
		verify.loaded = false;
		verify.verified = false;
		UserService.verify($state.params.userId, $state.params.token)
		.then(function(){
			verify.verified = true;
			verify.loaded = true;
		}).catch(function(response){
			if(response.status === 500){
				ngToast.danger("The server has encountered an error, please try again.");
			}
			verify.verified = false;
			verify.loaded = true;
		});
	}

	angular
		.module("3akm.user")
		.controller("VerifyController", VerifyController);

	VerifyController.$inject = ["$scope", "$state", "ngToast", "UserService"];
})();

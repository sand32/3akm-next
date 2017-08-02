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
require("../common/arrayentrydirectives.js");
require("../common/enumselectdirective.js");
require("../common/validationdirectives.js");

(function(){
	var UserDetailController = function($scope, $state, ngToast, UserService){
		var user = this;
		user.loaded = false;
		user.busy = false;
		user.current = {
			verified: false,
			lanInviteDesired: true,
			blacklisted: false,
			vip: false,
			tertiaryHandles: [],
			roles: []
		};
		user.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];
		user.help = {
			lanInviteDesired: "Determines whether the user will receive the LAN invitation. This value can be modified by the user.",
			blacklisted: "Determines whether the user will receive the LAN invitation. This value cannot be seen or modified by the user.",
			vip: "Determines whether the user is considered a LAN VIP (and is therefore privy to VIP date consultation)."
		};

		if($state.params.userId && $state.params.userId !== "new"){
			UserService.retrieve($state.params.userId)
			.then(function(response){
				user.current = response.data;
				user.loaded = true;
			}).catch(function(){
				$state.go("^");
				ngToast.danger("Failed to retrieve user.");
			});
		}else{
			user.loaded = true;
		}

		user.save = function(){
			user.busy = true;
			if($state.params.userId === "new"){
				UserService.create(user.current)
				.then(function(response){
					$scope.reloadList();
					$state.go(".", {userId: response.data._id});
					ngToast.create("User created.");
					user.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to create user.");
					user.busy = false;
				});
			}else{
				UserService.edit($state.params.userId, user.current)
				.then(function(){
					$scope.reloadList();
					ngToast.create("User updated.");
					user.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to update user.");
					user.busy = false;
				});
			}
		};

		user.resendVerificationEmail = function(){
			user.busy = true;
			UserService.resendVerificationEmail($state.params.userId)
			.then(function(){
				ngToast.create("Verification email sent.");
				user.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to send verification email.");
				user.busy = false;
			});
		};

		user.verifyEmail = function(){
			user.busy = true;
			user.current.verified = true;
			UserService.edit($state.params.userId, user.current)
			.then(function(){
				$scope.reloadList();
				ngToast.create("User updated.");
				user.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to update user.");
				user.busy = false;
			});
		};

		user.sync = function(){
			user.busy = true;
			UserService.sync(user.current._id)
			.then(function(){
				$scope.reloadList();
				ngToast.create("User synchronized between database and Active Directory.");
				user.busy = false;
			}).catch(function(){
				ngToast.danger("Failed to synchronize user.");
				user.busy = false;
			});
		};
	};

	angular
		.module("3akm.admin.userDetail", 
			[
				"3akm.user",
				"3akm.common.validation",
				"3akm.common.arrayentry",
				"3akm.common.enumselect"
			])
		.controller("UserDetailController", UserDetailController);

	UserDetailController.$inject = ["$scope", "$state", "ngToast", "UserService"];
})();

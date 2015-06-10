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
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");
require("../common/enumselectdirective.js");

(function(){
	var UserListController = function($scope, $timeout, $modal, $q, ngToast, UserService){
		var users = this, updateModel;
		users.list = [];
		users.current = null;
		users.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];

		updateModel = function(user){
			var deferred = $q.defer();
			if(user && user._id){
				for(var i = 0; i < users.list.length; i += 1){
					if(users.list[i]._id === user._id){
						users.list[i] = angular.copy(user);
						deferred.resolve();
					}
				}
				deferred.reject();
			}else{
				UserService.retrieveAll()
				.then(
					function(data){
						users.list = data;
						deferred.resolve();
					}, function(){
						deferred.reject();
					}
				);
			}
			return deferred.promise;
		};
		updateModel();

		users.select = function(index){
			users.current = angular.copy(users.list[index]);
			$timeout(function(){$scope.$emit("ResizeContentArea");}, 100);
		};

		users.selectById = function(id){
			for(var i = 0; i < users.list.length; i += 1){
				if(users.list[i]._id === id){
					users.current = angular.copy(users.list[i]);
					$timeout(function(){$scope.$emit("ResizeContentArea");}, 100);
					return;
				}
			}
		};

		users.startNew = function(){
			users.current = {
				lanInviteDesired: true,
				blacklisted: false,
				tertiaryHandles: [],
				roles: []
			};
		};

		users.save = function(){
			if(!users.current._id){
				UserService.create(users.current)
				.then(
					function(data){
						updateModel()
						.then(function(){
							users.selectById(data.id);
						});
						ngToast.create("User created.");
					}, function(){
						ngToast.danger("Failed to create user.");
					}
				);
			}else{
				UserService.edit(users.current._id, users.current)
				.then(
					function(){
						updateModel(users.current);
						ngToast.create("User updated.");
					}, function(){
						ngToast.danger("Failed to update user.");
					}
				);
			}
		};

		users.resendVerificationEmail = function(){
			UserService.resendVerificationEmail()
			.then(
				function(){
					ngToast.create("Verification email sent.");
				},
				function(){
					ngToast.danger("Failed to send verification email.");
				}
			);
		};
	};

	angular
		.module("3akm.admin.userList", 
			[
				"3akm.user",
				"3akm.confirmModal",
				"3akm.common.arrayentry",
				"3akm.common.enumselect"
			])
		.controller("UserListController", UserListController);

	UserListController.$inject = ["$scope", "$timeout", "$modal", "$q", "ngToast", "UserService"];
})();

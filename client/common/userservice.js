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

(function(){
	var UserService = function($http, $q){
		return {
			isLoggedIn: function(){
				return $http.get("/api/user/isloggedin");
			},

			register: function(postData){
				return $http.post("/api/user/register", postData);
			},

			login: function(email, pass){
				return $http.post("/api/user/login", {email: email, password: pass});
			},

			logout: function(){
				return $http.post("/api/user/logout");
			},

			resendVerificationEmail: function(id){
				return $http.post("/api/user/" + id + "/verify");
			},

			verify: function(id, token){
				return $http.post("/api/user/" + id + "/verify/" + token);
			},

			retrieveAll: function(){
				return $http.get("/api/user");
			},

			retrieve: function(id){
				return $http.get("/api/user/" + id);
			},

			create: function(postData){
				return $http.post("/api/user", postData);
			},

			edit: function(id, putData){
				return $http.put("/api/user/" + id, putData);
			},

			changePassword: function(id, oldPassword, newPassword){
				return $http.put("/api/user/" + id + "/password", {
					oldPassword: oldPassword,
					newPassword: newPassword
				});
			},

			sendPasswordResetEmail: function(email){
				return $http.post("/api/user/resetpassword", {email: email});
			},

			resetPassword: function(id, token, newPassword){
				return $http.post("/api/user/" + id + "/password/reset/" + token, {newPassword: newPassword});
			},

			sync: function(id){
				return $http.post("/api/user/" + id + "/directory/sync");
			}
		};
	};

	angular
		.module("3akm.user", [])
		.factory("UserService", UserService);

	UserService.$inject = ["$http", "$q"];
})();

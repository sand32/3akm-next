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

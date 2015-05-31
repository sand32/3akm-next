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

(function(){
	var UserService = function($http, $q){
		return {
			isLoggedIn: function(){
				var deferred = $q.defer();
				$http.get("/api/user/isloggedin")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			register: function(postData){
				var deferred = $q.defer();
				$http.post("/api/user/register", postData)
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			login: function(email, pass){
				var deferred = $q.defer();
				$http.post("/api/user/login", {email: email, password: pass})
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			logout: function(){
				var deferred = $q.defer();
				$http.post("/api/user/logout")
				.then(
					function(response){
						deferred.resolve();
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			resendVerificationEmail: function(id){
				var deferred = $q.defer();
				$http.post("/api/user/" + id + "verify")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			create: function(id, postData){
				var deferred = $q.defer();
				$http.post("/api/user", postData)
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			retrieve: function(id){
				var deferred = $q.defer();
				$http.get("/api/user/" + id)
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			edit: function(id, putData){
				var deferred = $q.defer();
				$http.put("/api/user/" + id, putData)
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			},

			changePassword: function(id, newPassword){
				var deferred = $q.defer();
				$http.put("/api/user/" + id + "/password", {password: newPassword})
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						deferred.reject(response.status);
					}
				);
				return deferred.promise;
			}
		};
	};

	angular
		.module("3akm.user", [])
		.factory("UserService", UserService);

	UserService.$inject = ["$http", "$q"];
})();
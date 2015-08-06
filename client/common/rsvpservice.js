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
	var RsvpService = function($http, $q){
		return {
			retrieveAll: function(){
				var deferred = $q.defer();
				$http.get("/api/rsvp")
				.then(function(response){
					deferred.resolve(response.data);
				}).catch(function(response){
					deferred.reject(response.status);
				});
				return deferred.promise;
			},

			retrieve: function(id){
				var deferred = $q.defer();
				$http.get("/api/rsvp/" + id)
				.then(function(response){
					deferred.resolve(response.data);
				}).catch(function(response){
					deferred.reject(response.status);
				});
				return deferred.promise;
			},

			create: function(postData){
				var deferred = $q.defer();
				$http.post("/api/rsvp", postData)
				.then(function(response){
					deferred.resolve(response.data);
				}).catch(function(response){
					deferred.reject(response.status);
				});
				return deferred.promise;
			},

			edit: function(id, putData){
				var deferred = $q.defer();
				$http.put("/api/rsvp/" + id, putData)
				.then(function(response){
					deferred.resolve(response.data);
				}).catch(function(response){
					deferred.reject(response.status);
				});
				return deferred.promise;
			},

			delete: function(id){
				var deferred = $q.defer();
				$http.delete("/api/rsvp/" + id)
				.then(function(response){
					deferred.resolve(response.data);
				}).catch(function(response){
					deferred.reject(response.status);
				});
				return deferred.promise;
			},

			retrieveAllForYear: function(year){
				var deferred = $q.defer();
				$http.get("/api/rsvp/year/" + year)
				.then(function(response){
					deferred.resolve(response.data);
				}).catch(function(response){
					deferred.reject(response.status);
				});
				return deferred.promise;
			},

			retrieveByYear: function(userId, year){
				var deferred = $q.defer();
				$http.get("/api/user/" + userId + "/rsvp/" + year)
				.then(function(response){
					deferred.resolve(response.data);
				}).catch(function(response){
					deferred.reject(response.status);
				});
				return deferred.promise;
			},

			createOrEdit: function(userId, year, putData){
				var deferred = $q.defer();
				$http.put("/api/user/" + userId + "/rsvp/" + year, putData)
				.then(function(response){
					deferred.resolve(response.data);
				}).catch(function(response){
					deferred.reject(response.status);
				});
				return deferred.promise;
			},

			markAsAttended: function(userId, year){
				var deferred = $q.defer();
				$http.put("/api/user/" + userId + "/rsvp/" + year + "/attended")
				.then(function(response){
					deferred.resolve(response.data);
				}).catch(function(response){
					deferred.reject(response.status);
				});
				return deferred.promise;
			}
		};
	};

	angular
		.module("3akm.rsvp", [])
		.factory("RsvpService", RsvpService);

	RsvpService.$inject = ["$http", "$q"];
})();

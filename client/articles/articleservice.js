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
	var ArticleService = function($http, $q){
		return {
			retrieve: function(id){
				var deferred = $q.defer();
				$http.get("/api/article/" + id)
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						if(response.status === 404){
							deferred.reject("No such article exists.");
						}else{
							deferred.reject("Failed to retrieve article.");
						}
					}
				);
				return deferred.promise;
			},

			retrieveNewest: function(){
				var deferred = $q.defer();
				$http.get("/api/article/newest")
				.then(
					function(response){
						deferred.resolve(response.data);
					},
					function(response){
						if(response.status === 404){
							deferred.reject("No such article exists.");
						}else{
							deferred.reject("Failed to retrieve article.");
						}
					}
				);
				return deferred.promise;
			},

			create: function(postData){
				var deferred = $q.defer();
				$http.post("/api/article", postData)
				.then(
					function(){
						deferred.resolve();
					},
					function(){
						deferred.reject("Failed to create article.");
					}
				);
				return deferred.promise;
			},

			edit: function(id, putData){
				var deferred = $q.defer();
				$http.put("/api/article/" + id, putData)
				.then(
					function(){
						deferred.resolve();
					},
					function(response){
						if(response.status === 404){
							deferred.reject("No such article exists.");
						}else{
							deferred.reject("Failed to edit article.");
						}
					}
				);
				return deferred.promise;
			},

			delete: function(id){
				var deferred = $q.defer();
				$http.put("/api/article/" + id)
				.then(
					function(){
						deferred.resolve();
					},
					function(response){
						if(response.status === 404){
							deferred.reject("No such article exists.");
						}else{
							deferred.reject("Failed to delete article.");
						}
					}
				);
				return deferred.promise;
			}
		};
	};

	angular
		.module("article", [])
		.factory("ArticleService", ArticleService);

	ArticleService.$inject = ["$http", "$q"];
})();

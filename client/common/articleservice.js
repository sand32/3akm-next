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
	var ArticleService = function($http, $q){
		return {
			retrieveAll: function(){
				return $http.get("/api/article");
			},

			retrieve: function(id){
				return $http.get("/api/article/" + (id || "newest"));
			},

			create: function(postData){
				return $http.post("/api/article", postData);
			},

			edit: function(id, putData){
				return $http.put("/api/article/" + id, putData);
			},

			delete: function(id){
				return $http.delete("/api/article/" + id);
			}
		};
	};

	angular
		.module("3akm.article", [])
		.factory("ArticleService", ArticleService);

	ArticleService.$inject = ["$http", "$q"];
})();

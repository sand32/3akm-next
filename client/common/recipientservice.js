/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2016 Seth Anderson

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
	var RecipientService = function($http, $q){
		return {
			retrieveAll: function(){
				return $http.get("/api/recipient");
			},

			retrieve: function(id){
				return $http.get("/api/recipient/" + id);
			},

			create: function(postData){
				return $http.post("/api/recipient", postData);
			},

			edit: function(id, putData){
				return $http.put("/api/recipient/" + id, putData);
			},

			delete: function(id){
				return $http.delete("/api/recipient/" + id);
			}
		};
	};

	angular
		.module("3akm.recipient", [])
		.factory("RecipientService", RecipientService);

	RecipientService.$inject = ["$http", "$q"];
})();

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

(function(){
	var RsvpService = function($http, $q){
		return {
			retrieveAll: function(){
				return $http.get("/api/rsvp");
			},

			retrieve: function(id){
				return $http.get("/api/rsvp/" + id);
			},

			create: function(postData){
				return $http.post("/api/rsvp", postData);
			},

			edit: function(id, putData){
				return $http.put("/api/rsvp/" + id, putData);
			},

			delete: function(id){
				return $http.delete("/api/rsvp/" + id);
			},

			retrieveAllForYear: function(year){
				return $http.get("/api/rsvp/year/" + year);
			},

			retrieveByYear: function(userId, year){
				return $http.get("/api/user/" + userId + "/rsvp/" + year);
			},

			createOrEdit: function(userId, year, putData){
				return $http.put("/api/user/" + userId + "/rsvp/" + year, putData);
			},

			markAsAttended: function(userId, year){
				return $http.put("/api/user/" + userId + "/rsvp/" + year + "/attended");
			}
		};
	};

	angular
		.module("3akm.rsvp", [])
		.factory("RsvpService", RsvpService);

	RsvpService.$inject = ["$http", "$q"];
})();

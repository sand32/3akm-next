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
	var TeamspeakBrowser = function($compile){
		return {
			restrict: "E",
			templateUrl: "/partial/admin/teamspeakbrowser",
			scope: {
				serverInfo: "=",
				channelList: "="
			},
			link: function(scope, element, attrs){
				scope.serverSelected = function(server){scope.$parent.serverSelected(server);};
				scope.channelSelected = function(channel){scope.$parent.channelSelected(channel);};
				scope.clientSelected = function(client){scope.$parent.clientSelected(client);};
			}
		}
	};

	angular
		.module("3akm.common.teamspeak", [])
		.directive("teamspeakBrowser", TeamspeakBrowser);

	TeamspeakBrowser.$inject = ["$compile"];
})();

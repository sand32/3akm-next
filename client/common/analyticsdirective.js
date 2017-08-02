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
	var Analytics = function($rootScope, $window, $location){
		return {
			restrict: "E",
			replace: true,
			scope: {
				analyticsTrackingId: "@"
			},
			link: function(scope, element, attrs){
				(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
				(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
				m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
				})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

				ga('create', scope.analyticsTrackingId, 'auto');
				ga('send', 'pageview');

				$rootScope.$on("$viewContentLoaded", function(e){
					ga("send", "pageview", {page: $location.url()});
				});
			}
		}
	};

	angular
		.module("3akm.common.analytics", [])
		.directive("analytics", Analytics);

	Analytics.$inject = ["$rootScope", "$window", "$location"];
})();

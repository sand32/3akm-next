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
	var ContentArea = function($rootScope, $window){
		return {
			restrict: "C",
			link: function(scope, element, attrs){
				var resizeContentArea = function(){
					var contentHeight = element[0].offsetHeight,
						windowHeight = $window.innerHeight;

					// Set content area to full height of window
					element.css({
						height: Math.max(windowHeight, contentHeight) + "px"
					});
				};
				$rootScope.$on("ResizeContentArea", resizeContentArea);
				angular.element($window).on("load resize", resizeContentArea);
				$rootScope.$emit("ResizeContentArea");
			}
		};
	};

	angular
		.module("3akm.admin.styling", [])
		.directive("contentArea", ContentArea);

	ContentArea.$inject = ["$rootScope", "$window"];
})();

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
				var getDocHeight = function() {
				    return Math.max(
				        document.body.scrollHeight, document.documentElement.scrollHeight,
				        document.body.offsetHeight, document.documentElement.offsetHeight,
				        document.body.clientHeight, document.documentElement.clientHeight
				    );
				},

				resizeContentArea = function(){
					var documentHeight = getDocHeight(),
						windowHeight = $window.innerHeight,
						newCss = {
							height: Math.max(windowHeight, documentHeight) + "px"
						},
						children;

					// Set content area to full height of window
					element.css(newCss);
					children = element.children();
					for(var i = 0; i < children.length; i += 1){
						if(angular.element(children[i]).hasClass("auto-resize")){
							angular.element(children[i]).css(newCss);
						}
					}
				};
				$rootScope.$on("ResizeContentArea", resizeContentArea);
				angular.element($window).on("load resize", resizeContentArea);
				$rootScope.$emit("ResizeContentArea");
			}
		};
	};

	var RowExpand = function(){
		return {
			restrict: "C",
			link: function(scope, element, attrs){
				var resizeRow = function(){
					var parentHeight = element.parent()[0].offsetHeight,
						otherRowHeights = 0,
						siblings = element.parent().children();
					for(var i = 0; i < siblings.length; i += 1){
						var siblingElement = angular.element(siblings[i]);
						if(siblingElement.hasClass("row")
						&& !siblingElement.hasClass("row-expand")){
							otherRowHeights += siblingElement[0].offsetHeight;
						}
					}
					element.css({
						height: (parentHeight - otherRowHeights) + "px"
					});
				};
				element.parent().on("resize", resizeRow);
				resizeRow();
			}
		};
	};

	angular
		.module("3akm.admin.styling", [])
		.directive("contentArea", ContentArea)
		.directive("rowExpand", RowExpand);

	ContentArea.$inject = ["$rootScope", "$window"];
	RowExpand.$inject = [];
})();

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
	var SectionEntry = function(){
		return {
			restrict: "E",
			replace: true,
			transclude: true,
			scope: {
				headerImage: "=",
				name: "="
			},
			templateUrl: "/partial/sectionentry",
			link: function(scope, element, attrs){
				angular.element(element.children()[0]).css("background-image", "url(" + scope.headerImage + ")");
				scope.collapsed = true;

				scope.toggleSection = function(){
					var sectionBody = angular.element(element.children()[1]);
					sectionBody.css({
						height: sectionBody.offsetHeight
					});
					element.toggleClass("section-entry-open");
					scope.collapsed = !scope.collapsed;

					if(!scope.collapsed){
						scope.$parent.$parent.$broadcast("AccordionSwitch", scope.$id);
					}
				}

				scope.$on("AccordionSwitch", function(e, scopeId){
					if(scope.$id !== scopeId){
						element.removeClass("section-entry-open");
						scope.collapsed = true;
					}
				});
			}
		}
	};

	angular
		.module("3akm.common.sectionentry", ["ui.bootstrap"])
		.directive("sectionEntry", SectionEntry);

	SectionEntry.$inject = [];
})();

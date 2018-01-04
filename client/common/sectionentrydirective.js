/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2018 Seth Anderson

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
				scope.isCollapsed = true;

				scope.toggleOthers = function(){
					// Remove the no-animate class. This class is a hack since
					// newer versions of ui-bootstrap have an issue where the
					// collapsed element will start open and animate closed
					// on load
					angular.element(element.children()[1]).removeClass("no-animate");
					scope.$parent.$parent.$broadcast("AccordionSwitch", scope.$id);
				};

				scope.$on("AccordionSwitch", function(e, scopeId){
					if(scope.$id !== scopeId){
						element.removeClass("section-entry-open");
						scope.isCollapsed = true;
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

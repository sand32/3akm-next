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
		.directive("rowExpand", RowExpand);

	RowExpand.$inject = [];
})();

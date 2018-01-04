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
	var SimpleArrayEntry = function(){
		return {
			restrict: "E",
			replace: true,
			templateUrl: "/partial/simplearrayentry",
			scope: {
				items: "=arrayModel",
				additionTooltip: "@",
				additionTooltipPlacement: "@",
				removalTooltip: "@",
				removalTooltipPlacement: "@"
			},
			link: function(scope, element, attrs){
				scope.additionTooltipPlacement = scope.additionTooltipPlacement || "right";
				scope.removalTooltipPlacement = scope.removalTooltipPlacement || "right";

				scope.addItem = function(){
					scope.items.push("");
				};

				scope.removeItem = function(index){
					scope.items.splice(index, 1);
				};
			}
		}
	},

	KeyValueArrayEntry = function(){
		return {
			restrict: "E",
			replace: true,
			templateUrl: "/partial/keyvaluearrayentry",
			scope: {
				items: "=arrayModel",
				keyLabel: "@",
				valueLabel: "@",
				keyName: "@",
				valueName: "@",
				additionTooltip: "@",
				additionTooltipPlacement: "@",
				removalTooltip: "@",
				removalTooltipPlacement: "@"
			},
			link: function(scope, element, attrs){
				scope.additionTooltipPlacement = scope.additionTooltipPlacement || "right";
				scope.removalTooltipPlacement = scope.removalTooltipPlacement || "right";

				scope.addItem = function(){
					scope.items.push({});
					scope.items[scope.items.length - 1][scope.keyName] = "";
					scope.items[scope.items.length - 1][scope.valueName] = "";
				};

				scope.removeItem = function(index){
					scope.items.splice(index, 1);
				};
			}
		}
	},

	EnumValueArrayEntry = function(){
		return {
			restrict: "E",
			replace: true,
			templateUrl: "/partial/enumvaluearrayentry",
			scope: {
				items: "=arrayModel",
				enumeration: "=",
				keyLabel: "@",
				valueLabel: "@",
				keyName: "@",
				valueName: "@",
				defaultDropdownText: "@",
				additionTooltip: "@",
				additionTooltipPlacement: "@",
				removalTooltip: "@",
				removalTooltipPlacement: "@"
			},
			link: function(scope, element, attrs){
				scope.defaultDropdownText = scope.defaultDropdownText || "Choose a " + scope.keyLabel.toLowerCase();
				scope.additionTooltipPlacement = scope.additionTooltipPlacement || "right";
				scope.removalTooltipPlacement = scope.removalTooltipPlacement || "right";

				scope.addItem = function(){
					scope.items.push({});
					scope.items[scope.items.length - 1][scope.keyName] = "";
					scope.items[scope.items.length - 1][scope.valueName] = "";
				};

				scope.removeItem = function(index){
					scope.items.splice(index, 1);
				};

				scope.getEnumKeyFromValue = function(enumValue){
					for(var i = 0; i < scope.enumeration.length; i += 1){
						if(scope.enumeration[i].value === enumValue){
							return scope.enumeration[i].key;
						}
					}
					return scope.defaultDropdownText;
				};

				scope.setEnumKey = function(itemIndex, enumIndex, enumValue){
					scope.items[itemIndex][scope.keyName.toLowerCase()] = enumValue;
					scope.selectedEnumKey = scope.enumeration[enumIndex].key;
				};
			}
		}
	};

	angular
		.module("3akm.common.arrayentry", [])
		.directive("simpleArrayEntry", SimpleArrayEntry)
		.directive("keyValueArrayEntry", KeyValueArrayEntry)
		.directive("enumValueArrayEntry", EnumValueArrayEntry);

	SimpleArrayEntry.$inject = [];
	KeyValueArrayEntry.$inject = [];
	EnumValueArrayEntry.$inject = [];
})();

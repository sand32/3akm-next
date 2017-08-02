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

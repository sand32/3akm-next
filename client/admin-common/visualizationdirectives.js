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
	var BarChart = function($rootScope, $window){
		return {
			restrict: "E",
			scope: {
				data: "=",
				options: "=",
				autoUpdate: "&"
			},
			link: function(scope, element, attrs){
				var render = function(){
					element.empty();

					var margin = {top: 20, right: 30, bottom: 30, left: 50},
						chartWidth = element.parent()[0].offsetWidth - margin.left - margin.right,
						chartHeight = element.parent()[0].offsetHeight - margin.top - margin.bottom,
						barWidth = 30;

					var x = d3.scale.ordinal()
						.domain(scope.options.labels)
						.rangeRoundBands([0, chartWidth], .1);
					var y = d3.scale.linear()
						.domain([0, d3.max(scope.data)])
						.range([chartHeight, 0]);
					var xAxis = d3.svg.axis()
						.scale(x)
						.orient("bottom");
					var yAxis = d3.svg.axis()
						.scale(y)
						.orient("left")
						.tickFormat(d3.format("d"));

					var chart = d3.select(element[0]).append("svg")
						.attr("width", chartWidth + margin.left + margin.right)
						.attr("height", chartHeight + margin.top + margin.bottom)
						.append("g")
							.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

					chart.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(-" + barWidth / 3 + ", " + chartHeight + ")")
						.call(xAxis);

					chart.append("g")
						.attr("class", "y axis")
						.call(yAxis)
						.append("text")
							.attr("transform", "rotate(90)")
							.attr("x", (chartHeight + margin.top + margin.bottom) / 2)
							.attr("y", margin.left - 10)
							.attr("dy", ".6em")
							.style("text-anchor", "end")
							.text("# of RSVPs");

					chart.selectAll(".bar")
							.data(scope.data)
						.enter().append("rect")
							.attr("x", function(d, i){return x(scope.options.labels[i]);})
							.attr("y", y)
							.attr("width", barWidth)
							.attr("height", function(d){return chartHeight - y(d);})
							.attr("fill", function(d, i){
								if(Array.isArray(scope.options.color)){
									return scope.options.color[i];
								}else{
									return scope.options.color;
								}
							});
				};
				$rootScope.$on("ResizeContentArea", render);
				angular.element($window).on("load resize", render);
				if(scope.autoUpdate()){
					scope.$watch("data", render);
				}
				render();
			}
		};
	};

	angular
		.module("3akm.admin.visualization", [])
		.directive("barChart", BarChart);

	BarChart.$inject = ["$rootScope", "$window"];
})();
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
	var BarChart = function($window){
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

					if(!scope.data || scope.data.length === 0){
						return;
					}

					var parentWidth = element.parent()[0].offsetWidth,
						parentHeight = element.parent()[0].offsetHeight,
						margin = {top: parentHeight * 0.05, right: parentWidth * 0.12, bottom: parentHeight * 0.08, left: parentWidth * 0.19},
						chartWidth = parentWidth - margin.left - margin.right,
						chartHeight = parentHeight - margin.top - margin.bottom,
						barWidth = chartWidth / scope.data.length - chartWidth / scope.data.length / 2;

					if(parentWidth === 0
					|| parentHeight === 0){
						return;
					}

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

					var aspect = parentWidth / parentHeight;
					var chart = d3.select(element[0]).append("svg")
						.attr("width", parentWidth)
						.attr("height", parentHeight)
						.attr("viewBox", "0 0 " + parentWidth + " " + parentHeight)
						.attr("preserveAspectRatio", "xMidYMid")
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
							.attr("x", parentHeight / 2)
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
				angular.element($window)
					.on("load resize", render);
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

	BarChart.$inject = ["$window"];
})();

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

require("./articles/articlecontroller.js");
require("./user/registrationcontroller.js");
require("./common/arrayentrydirectives.js");
require("./frontend-common/stylingdirectives.js");
require("./frontend-common/validationdirectives.js");

(function(){
	var Config = function($stateProvider, $urlRouterProvider, $locationProvider){
		$urlRouterProvider.otherwise("/404");
		$locationProvider.html5Mode(true);

		$stateProvider
			.state("default", {
				url: "/",
				templateUrl: "/partial/article"
			})
			.state("article", {
				url: "/article/:articleId",
				templateUrl: "/partial/article"
			})
			.state("registration", {
				url: "/register",
				templateUrl: "/partial/registrationform"
			})
			.state("404", {
				url: "/404",
				templateUrl: "/partial/404"
			});
	};

	angular
		.module("3akm.frontend", 
			[
				"ui.router",
				"ngLoadScript",
				"3akm.common.arrayentry",
				"3akm.frontend.styling",
				"3akm.frontend.validation",
				"3akm.user",
				"3akm.article"
			])
		.config(Config);

	Config.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider"];
})();

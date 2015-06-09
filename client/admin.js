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

require("./admin-common/stylingdirectives.js");
require("./admin/dashboard/dashboardcontroller.js");
require("./admin/articlelistcontroller.js");

(function(){
	var Config = function($stateProvider, $urlRouterProvider, $locationProvider, $compileProvider, ngToastProvider){
		$urlRouterProvider.otherwise("/admin");
		$locationProvider.html5Mode(true);

		$stateProvider
			.state("default", {
				url: "/",
				templateUrl: "/partial/admin/dashboard"
			})
			.state("articleList", {
				url: "/articlelist",
				templateUrl: "/partial/admin/articlelist"
			});

		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|steam|macappstore):/);

		ngToastProvider.configure({
			dismissButton: true,
			animation: "slide"
		});
	};

	angular
		.module("3akm.admin", 
			[
				"ui.router",
				"ngLoadScript",
				"ngMessages",
				"ngAnimate",
				"ngToast",
				"3akm.admin.styling",
				"3akm.admin.dashboard",
				"3akm.admin.articleList"
			])
		.config(Config);

	Config.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider", "$compileProvider", "ngToastProvider"];
})();

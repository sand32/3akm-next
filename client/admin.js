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
require("./admin/userlistcontroller.js");
require("./admin/gamelistcontroller.js");
require("./admin/lanlistcontroller.js");

(function(){
	var Config = function($stateProvider, $urlRouterProvider, $locationProvider, $compileProvider, ngToastProvider){
		$urlRouterProvider.otherwise("/");
		$locationProvider.html5Mode(true);

		$stateProvider
			.state("default", {
				url: "/",
				templateUrl: "/partial/admin/dashboard"
			})
			.state("article", {
				url: "/article",
				templateUrl: "/partial/admin/articlelist"
			})
			.state("article.detail", {
				url: "/:articleId",
				views: {
					"detail": {
						templateUrl: "/partial/admin/articledetail"
					}
				}
			})
			.state("user", {
				url: "/user",
				templateUrl: "/partial/admin/userlist"
			})
			.state("user.detail", {
				url: "/:userId",
				views: {
					"detail": {
						templateUrl: "/partial/admin/userdetail"
					}
				}
			})
			.state("game", {
				url: "/game",
				templateUrl: "/partial/admin/gamelist"
			})
			.state("game.detail", {
				url: "/:gameId",
				views: {
					"detail": {
						templateUrl: "/partial/admin/gamedetail"
					}
				}
			})
			.state("lan", {
				url: "/lan",
				templateUrl: "/partial/admin/lanlist"
			})
			.state("lan.detail", {
				url: "/:lanId",
				views: {
					"detail": {
						templateUrl: "/partial/admin/landetail"
					}
				}
			})
			.state("cod4", {
				url: "/cod4",
				templateUrl: "/partial/admin/cod4"
			});

		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|steam|macappstore):/);

		ngToastProvider.configure({
			dismissButton: true,
			animation: "slide",
			additionalClasses: "toast"
		});
	};

	angular
		.module("3akm.admin", 
			[
				"ui.router",
				"ui.bootstrap",
				"ngLoadScript",
				"ngMessages",
				"ngAnimate",
				"ngToast",
				"3akm.admin.styling",
				"3akm.admin.dashboard",
				"3akm.admin.articleList",
				"3akm.admin.userList",
				"3akm.admin.gameList",
				"3akm.admin.lanList"
			])
		.config(Config);

	Config.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider", "$compileProvider", "ngToastProvider"];
})();

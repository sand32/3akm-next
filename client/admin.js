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

require("./admin-common/stylingdirectives.js");
require("./admin/dashboard/dashboardcontroller.js");
require("./admin/articlelistcontroller.js");
require("./admin/userlistcontroller.js");
require("./admin/gamelistcontroller.js");
require("./admin/lanlistcontroller.js");
require("./admin/rsvplistcontroller.js");
require("./admin/tournamentcontroller.js");
require("./admin/recipientlistcontroller.js");
require("./admin/cod4controller.js");
require("./common/analyticsdirective.js");
require("./user/authcontroller.js");

(function(){
	var Config = function($stateProvider, $urlRouterProvider, $locationProvider, $compileProvider, $httpProvider, jwtOptionsProvider, ngToastProvider){
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
			.state("rsvp", {
				url: "/rsvp",
				templateUrl: "/partial/admin/rsvplist"
			})
			.state("rsvp.detail", {
				url: "/:rsvpId",
				views: {
					"detail": {
						templateUrl: "/partial/admin/rsvpdetail"
					}
				}
			})
			.state("tournament", {
				url: "/tournament",
				templateUrl: "/partial/admin/tournament"
			})
			.state("recipient", {
				url: "/recipient",
				templateUrl: "/partial/admin/recipientlist"
			})
			.state("recipient.detail", {
				url: "/:recipientId",
				views: {
					"detail": {
						templateUrl: "/partial/admin/recipientdetail"
					}
				}
			})
			.state("cod4", {
				url: "/cod4",
				templateUrl: "/partial/admin/cod4"
			});

		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|steam|macappstore):/);

		jwtOptionsProvider.config({
			tokenGetter: function(){
				return localStorage.getItem("id_token");
			},
			unauthenticatedRedirector: ["$state", "authManager", function($state, authManager) {
				localStorage.clear("id_token");
				authManager.unauthenticate();
				$state.go('default');
			}]
		});
		$httpProvider.interceptors.push('jwtInterceptor');

		ngToastProvider.configure({
			dismissButton: true,
			animation: "slide",
			additionalClasses: "toast"
		});
	};

	var Run = function(authManager){
		authManager.checkAuthOnRefresh();
		authManager.redirectWhenUnauthenticated();
	};

	angular
		.module("3akm.admin", 
			[
				"ui.router",
				"ui.bootstrap",
				"angular-jwt",
				"ngLoadScript",
				"ngMessages",
				"ngAnimate",
				"ngToast",
				"3akm.auth",
				"3akm.common.analytics",
				"3akm.admin.styling",
				"3akm.admin.dashboard",
				"3akm.admin.articleList",
				"3akm.admin.userList",
				"3akm.admin.gameList",
				"3akm.admin.lanList",
				"3akm.admin.rsvpList",
				"3akm.admin.tournament",
				"3akm.admin.recipientList",
				"3akm.admin.cod4"
			])
		.config(Config)
		.run(Run);

	Config.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider", "$compileProvider", "$httpProvider", "jwtOptionsProvider", "ngToastProvider"];
	Run.$inject = ["authManager"];
})();

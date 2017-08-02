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

require("./articles/articlecontroller.js");
require("./game/gamelistcontroller.js");
require("./prep/prepcontroller.js");
require("./rsvp/appearancescontroller.js");
require("./rsvp/rsvpcontroller.js");
require("./user/registrationcontroller.js");
require("./user/profilecontroller.js");
require("./user/verifycontroller.js");
require("./user/resetpasswordcontroller.js");
require("./user/usermenudirective.js");
require("./common/analyticsdirective.js");
require("./common/arrayentrydirectives.js");
require("./common/validationdirectives.js");

(function(){
	var Config = function($stateProvider, $urlRouterProvider, $locationProvider, $compileProvider, ngToastProvider){
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
			.state("games", {
				url: "/games",
				templateUrl: "/partial/games"
			})
			.state("prep", {
				url: "/prep",
				templateUrl: "/partial/prep"
			})
			.state("appearances", {
				url: "/appearances",
				templateUrl: "/partial/appearances"
			})
			.state("rsvp", {
				url: "/rsvp",
				templateUrl: "/partial/rsvpform"
			})
			.state("registration", {
				url: "/register",
				templateUrl: "/partial/registrationform"
			})
			.state("profile", {
				url: "/profile",
				templateUrl: "/partial/profile"
			})
			.state("verify", {
				url: "/verify/:userId/:token",
				templateUrl: "/partial/verify"
			})
			.state("resetpassword", {
				url: "/resetpassword/:userId/:token",
				templateUrl: "/partial/resetpassword"
			})
			.state("404", {
				url: "/404",
				templateUrl: "/partial/404"
			});

		$compileProvider.debugInfoEnabled(false);
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|steam|macappstore):/);

		ngToastProvider.configure({
			dismissButton: true,
			animation: "slide",
			additionalClasses: "toast"
		});
	};

	angular
		.module("3akm.frontend", 
			[
				"ui.router",
				"ui.bootstrap",
				"ngLoadScript",
				"ngMessages",
				"ngAnimate",
				"ngToast",
				"3akm.common.analytics",
				"3akm.common.arrayentry",
				"3akm.common.validation",
				"3akm.article",
				"3akm.auth",
				"3akm.gameList",
				"3akm.prep",
				"3akm.appearances",
				"3akm.rsvpSubmission",
				"3akm.profile",
				"3akm.user"
			])
		.config(Config);

	Config.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider", "$compileProvider", "ngToastProvider"];
})();

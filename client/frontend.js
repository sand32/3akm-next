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

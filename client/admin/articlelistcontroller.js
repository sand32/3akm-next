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

require("../common/articleservice.js");
require("./articledetailcontroller.js");

(function(){
	var ArticleListController = function($scope, $state, ngToast, ArticleService){
		var articles = this;
		articles.list = [];

		$scope.$on("$stateChangeSuccess", function(){
			articles.selectedArticle = $state.params.articleId;
		});

		$scope.reloadList = function(){
			ArticleService.retrieveAll()
			.then(function(response){
				articles.list = response.data;
			}).catch(function(){
				ngToast.danger("Failed to retrieve articles.");
			});
		};
		$scope.reloadList();
	};

	angular
		.module("3akm.admin.articleList", 
			[
				"3akm.article",
				"3akm.admin.articleDetail"
			])
		.controller("ArticleListController", ArticleListController);

	ArticleListController.$inject = ["$scope", "$state", "ngToast", "ArticleService"];
})();

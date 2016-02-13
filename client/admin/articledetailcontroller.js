/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2016 Seth Anderson

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
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");
require("../common/enumselectdirective.js");

(function(){
	var ArticleDetailController = function($scope, $state, $modal, ngToast, ArticleService){
		var article = this;
		article.busy = false;
		article.current = {
			published: false,
			tags: []
		};
		article.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];

		if($state.params.articleId && $state.params.articleId !== "new"){
			ArticleService.retrieve($state.params.articleId)
			.then(function(response){
				article.current = response.data;
			}).catch(function(){
				$state.go("^");
				ngToast.danger("Failed to retrieve article.");
			});
		}

		article.save = function(){
			article.busy = true;
			if($state.params.articleId === "new"){
				ArticleService.create(article.current)
				.then(function(response){
					$scope.reloadList();
					$state.go(".", {articleId: response.data._id});
					ngToast.create("Article created.");
					article.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to create article.");
					article.busy = false;
				});
			}else{
				ArticleService.edit($state.params.articleId, article.current)
				.then(function(){
					$scope.reloadList();
					ngToast.create("Article updated.");
					article.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to update article.");
					article.busy = false;
				});
			}
		};

		article.delete = function(){
			var modalInstance = $modal.open({
				templateUrl: "/partial/confirmmodal",
				controller: "ConfirmController as confirm",
				resolve: {
					message: function(){return "Are you sure you want to delete this article?";}
				}
			});

			modalInstance.result.then(function(){
				article.busy = true;
				ArticleService.delete($state.params.articleId)
				.then(function(){
					$scope.reloadList();
					$state.go("^");
					ngToast.create("Article deleted.");
					article.busy = false;
				}).catch(function(){
					ngToast.danger("Failed to delete article.");
					article.busy = false;
				});
			});
		};
	};

	angular
		.module("3akm.admin.articleDetail", 
			[
				"textAngular",
				"3akm.article",
				"3akm.confirmModal",
				"3akm.common.arrayentry",
				"3akm.common.enumselect"
			])
		.controller("ArticleDetailController", ArticleDetailController);

	ArticleDetailController.$inject = ["$scope", "$state", "$modal", "ngToast", "ArticleService"];
})();

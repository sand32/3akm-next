/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2018 Seth Anderson

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

require("../common/articleservice.js");
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");
require("../common/enumselectdirective.js");

(function(){
	var ArticleDetailController = function($scope, $state, $uibModal, ngToast, ArticleService){
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
			var modalInstance = $uibModal.open({
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

	ArticleDetailController.$inject = ["$scope", "$state", "$uibModal", "ngToast", "ArticleService"];
})();

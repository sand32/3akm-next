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
require("../common/arrayentrydirectives.js");
require("../common/confirmcontroller.js");
require("../common/enumselectdirective.js");

(function(){
	var ArticleListController = function(ngToast, $modal, $q, ArticleService){
		var articles = this, updateModel;
		articles.list = [];
		articles.current = null;
		articles.boolPossibles = [
			{label: "Yes", value: true}, 
			{label: "No", value: false}
		];

		updateModel = function(article){
			var deferred = $q.defer();
			if(article && article._id){
				for(var i = 0; i < articles.list.length; i += 1){
					if(articles.list[i]._id === article._id){
						articles.list[i] = angular.copy(article);
						deferred.resolve();
					}
				}
				deferred.reject();
			}else{
				ArticleService.retrieveAll()
				.then(
					function(data){
						articles.list = data;
						deferred.resolve();
					}, function(){
						deferred.reject();
					}
				);
			}
			return deferred.promise;
		};
		updateModel();

		articles.select = function(index){
			articles.current = angular.copy(articles.list[index]);
		};

		articles.selectById = function(id){
			for(var i = 0; i < articles.list.length; i += 1){
				if(articles.list[i]._id === id){
					articles.current = angular.copy(articles.list[i]);
					return;
				}
			}
		};

		articles.startNew = function(){
			articles.current = {
				published: false,
				tags: []
			};
		};

		articles.save = function(){
			if(!articles.current._id){
				ArticleService.create(articles.current)
				.then(
					function(data){
						updateModel()
						.then(function(){
							articles.selectById(data.id);
						});
						ngToast.create("Article created.");
					}, function(){
						ngToast.danger("Failed to create article.");
					}
				);
			}else{
				ArticleService.edit(articles.current._id, articles.current)
				.then(
					function(){
						updateModel(articles.current);
						ngToast.create("Article updated.");
					}, function(){
						ngToast.danger("Failed to update article.");
					}
				);
			}
		};

		articles.delete = function(id){
			var modalInstance = $modal.open({
				templateUrl: "/partial/confirmmodal",
				controller: "ConfirmController as confirm",
				resolve: {
					message: function(){return "Are you sure you want to delete this article?";}
				}
			});

			modalInstance.result.then(
				function(){
					ArticleService.delete(id)
					.then(
						function(){
							updateModel();
							articles.current = null;
							ngToast.create("Article deleted.");
						}, function(){
							ngToast.danger("Failed to delete article.")
						}
					);
				}
			);
		};
	};

	angular
		.module("3akm.admin.articleList", 
			[
				"textAngular",
				"3akm.article",
				"3akm.confirmModal",
				"3akm.common.arrayentry",
				"3akm.common.enumselect"
			])
		.controller("ArticleListController", ArticleListController);

	ArticleListController.$inject = ["ngToast", "$modal", "$q", "ArticleService"];
})();

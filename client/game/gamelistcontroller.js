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

require("../common/lanservice.js");
require("../common/sectionentrydirective.js");

(function(){
	var GameListController = function($sce, LanService){
		var ctrl = this;
		ctrl.loaded = false;
		ctrl.games = null;
		ctrl.year = 0;

		LanService.retrieveGames("current")
		.then(function(response){
			ctrl.games = response.data.games;
			for(var i = 0; i < ctrl.games.length; i += 1){
				ctrl.games[i].description = $sce.trustAsHtml(ctrl.games[i].description);
				for(var j = 0; j < ctrl.games[i].stores.length; j += 1){
					var store = ctrl.games[i].stores[j];
					store.store.appUrl = store.store.appUrl.replace("[appid]", store.appid);
				}
			}
			ctrl.year = response.data.year;
			ctrl.loaded = true;
		}).catch(function(){
			ctrl.loaded = true;
		});
	};

	angular
		.module("3akm.gameList", 
			[
				"3akm.lan",
				"3akm.common.sectionentry"
			])
		.controller("GameListController", GameListController);

	GameListController.$inject = ["$sce", "LanService"];
})();

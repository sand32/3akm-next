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

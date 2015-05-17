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

var Store = require("../model/store.js");

module.exports = function(){
	Store.findOne({name: "Steam"}, function(err, doc){
		if(!err && !doc){
			var store = new Store({
				name: "Steam",
				icon: "/images/steam20.png",
				baseUrl: "http://store.steampowered.com/",
				appUrl: "http://store.steampowered.com/app/[appid]/"
			});
			store.save(function(err){
				if(err){
					console.error("Error: " + err);
				}
			});
		}
	});
	Store.findOne({name: "GOG"}, function(err, doc){
		if(!err && !doc){
			var store = new Store({
				name: "GOG",
				icon: "/images/gog20.png",
				baseUrl: "http://www.gog.com/",
				appUrl: "http://www.gog.com/game/[appid]/"
			});
			store.save(function(err){
				if(err){
					console.error("Error: " + err);
				}
			});
		}
	});
	Store.findOne({name: "Mac"}, function(err, doc){
		if(!err && !doc){
			var store = new Store({
				name: "Mac",
				icon: "/images/mac28.png",
				baseUrl: "https://itunes.apple.com/us/genre/mac/id39?mt=12",
				appUrl: "macappstore://itunes.apple.com/app/id[appid]?mt=12"
			});
			store.save(function(err){
				if(err){
					console.error("Error: " + err);
				}
			});
		}
	});
};
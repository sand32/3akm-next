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

var fs = require("fs"),
	browserify = require("browserify"),
	q = require("q"),
	Store = require("../model/store.js"),
	config = require("../utils/common.js").config;

module.exports = {
	initializeDatabase: function(){
		Store.findOne({name: "Steam"}, function(err, doc){
			if(!err && !doc){
				var store = new Store({
					name: "Steam",
					icon: "/images/steam28.png",
					baseUrl: "http://store.steampowered.com/",
					appUrl: "steam://store/[appid]/"
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
					icon: "/images/gog28.png",
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
		Store.findOne({name: "Battle.net"}, function(err, doc){
			if(!err && !doc){
				var store = new Store({
					name: "Battle.net",
					icon: "/images/bnet28.png",
					baseUrl: "http://www.battle.net/",
					appUrl: "https://us.battle.net/shop/en/product/[appid]"
				});
				store.save(function(err){
					if(err){
						console.error("Error: " + err);
					}
				});
			}
		});
		Store.findOne({name: "Website"}, function(err, doc){
			if(!err && !doc){
				var store = new Store({
					name: "Website",
					icon: "/images/www28.png",
					baseUrl: "http://www.google.com/",
					appUrl: "[appid]"
				});
				store.save(function(err){
					if(err){
						console.error("Error: " + err);
					}
				});
			}
		});
	},

	bundleClientJS: function(){
		// Bundle client javascript
		var b = browserify(),
			frontendDeferred = q.defer(),
			adminDeferred = q.defer(),
			promise = q.all([frontendDeferred.promise, adminDeferred.promise]);

		if(!config.debugMode){
			b.plugin("minifyify", {map: false});
		}

		// Bundle frontend
		b.add("client/frontend.js");
		var outputFileStream = fs.createWriteStream("public/js/frontend.js");
		outputFileStream.on("finish", function(){
			frontendDeferred.resolve();
		}).on("error", function(){
			frontendDeferred.reject("Failed to write JS bundle");
		});
		b.bundle().pipe(outputFileStream);

		b = browserify();

		if(!config.debugMode){
			b.plugin("minifyify", {map: false});
		}

		// Bundle admin portal
		b.add("client/admin.js");
		outputFileStream = fs.createWriteStream("public/js/admin.js");
		outputFileStream.on("finish", function(){
			adminDeferred.resolve();
		}).on("error", function(){
			adminDeferred.reject("Failed to write JS bundle");
		});
		b.bundle().pipe(outputFileStream);

		return promise;
	}
};

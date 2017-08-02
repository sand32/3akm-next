/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2017 Seth Anderson

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
	Promise = require("bluebird"),
	Store = require("../model/store.js"),
	config = require("./common.js").config,
	log = require("./log.js"),

	makeJSBundle = function(bundleRoot, outFile){
		return new Promise(function(resolve, reject){
			var b = browserify();
			if(!config.debugMode){
				b.plugin("minifyify", {map: false});
			}

			b.add(bundleRoot);
			var outputFileStream = fs.createWriteStream(outFile);
			outputFileStream.on("finish", function(){
				resolve();
			}).on("error", function(){
				reject("Failed to write JS bundle: " + outFile);
			});
			b.bundle().pipe(outputFileStream);
		});
	};

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
						log.error(err);
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
						log.error(err);
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
						log.error(err);
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
						log.error(err);
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
						log.error(err);
					}
				});
			}
		});
	},

	bundleClientJS: function(){
		return Promise.all([
			makeJSBundle("client/frontend.js", "public/js/frontend.js"),
			makeJSBundle("client/admin.js", "public/js/admin.js")
		]);
	}
};

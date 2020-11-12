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
		Store.findOne({name: "Epic Games Store"}, function(err, doc){
			if(!err && !doc){
				var store = new Store({
					name: "Epic Games Store",
					icon: "/images/epic28.png",
					baseUrl: "https://www.epicgames.com/store/en-US/",
					appUrl: "https://www.epicgames.com/store/en-US/product/[appid]/home"
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

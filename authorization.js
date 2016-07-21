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

var Promise = require("bluebird");

rules = {
	isUser: function(thisUser, otherUserId){
		return new Promise(function(resolve, reject){
			if(!otherUserId
			|| thisUser._id == otherUserId){
				resolve();
			}else{
				reject();
			}
		});
	},

	hasRoles: function(user, roles){
		if(!roles){
			return Promise.resolve();
		}

		var promises = [];
		for(var i = 0; i < roles.length; i+=1){
			promises.push(user.hasRole(roles[i]));
		}
		return Promise.all(promises);
	}
}

module.exports = {
	// Authorizes a user based on the given ruleset
	// 
	// The acceptable rules are as follows, all rules are optional:
	// {
	//     isUser: (User)
	//     hasRoles: [String]
	// }
	isAuthorized: function(user, ruleset){
		if(!ruleset){
			return Promise.resolve();
		}

		return new Promise(function(resolve, reject){
			rules.hasRoles(user, ["admin"])
			.then(function(){
				resolve();
			}).catch(function(){
				Promise.all([
					rules.isUser(user, ruleset.isUser),
					rules.hasRoles(user, ruleset.hasRoles)
				]).then(resolve).catch(reject);
			});
		});
	},

	// Middleware for denying connections without authorization
	authorize: function(ruleset){
		return function(req, res, next){
			module.exports.isAuthorized(req.user, ruleset)
			.then(function(){
				next();
			}).catch(function(){
				res.status(403).end();
			});
		};
	},

	// Same as above, but use the current user as the target user
	authorizeSessionUser: function(ruleset){
		return function(req, res, next){
			if(req.params.user === "session"){
				req.params.user = req.user._id.toString();
			}
			module.exports.isAuthorized(req.user, ruleset)
			.then(function(){
				return module.exports.isAuthorized(req.user, {isUser: req.params.user})
			}).then(function(){
				next();
			}).catch(function(){
				res.status(403).end();
			});
		};
	}
};

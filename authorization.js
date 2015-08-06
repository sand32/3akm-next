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

var q = require("q");

rules = {
	isUser: function(thisUser, otherUserId){
		var deferred = q.defer();
		if(!otherUserId
		|| thisUser._id == otherUserId){
			deferred.resolve();
		}else{
			deferred.reject();
		}
		return deferred.promise;
	},

	hasRoles: function(user, roles){
		if(!roles){
			return q.resolve();
		}

		var promises = [];
		for(var i = 0; i < roles.length; i+=1){
			promises.push(user.hasRole(roles[i]));
		}
		return q.all(promises);
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
			return q.resolve();
		}

		var deferred = q.defer();
		rules.hasRoles(user, ["admin"])
		.done(
			function(){
				deferred.resolve();
			},
			function(){
				q.all([
					rules.isUser(user, ruleset.isUser),
					rules.hasRoles(user, ruleset.hasRoles)
				]).done(deferred.resolve, deferred.reject);
			}
		);
		return deferred.promise;
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
}

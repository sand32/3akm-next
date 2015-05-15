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

rules = {
	isUser: function(thisUser, otherUserId){
		return thisUser._id == otherUserId;
	},

	hasRoles: function(user, roles){
		if(roles.length === 0){
			return false;
		}
		var hasRolesSuccess = true;
		for(var i = 0; i < roles.length; i+=1){
			if(!user.hasRole(roles[i])){
				hasRolesSuccess = false;
			}
		}
		return hasRolesSuccess;
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
		if(!ruleset || user.hasRole("admin")){
			return true;
		}

		return (ruleset.isUser ? rules.isUser(user, ruleset.isUser) : false) ||
				(ruleset.hasRoles ? rules.hasRoles(user, ruleset.hasRoles) : false);
	},

	// Middleware for denying connections without authorization
	authorize: function(ruleset){
		return function(req, res, next){
			if(module.exports.isAuthorized(req.user, ruleset)){
				next();
			}else{
				res.status(403).end();
			}
		};
	},

	// Same as above, but use 
	authorizeSessionUser: function(ruleset){
		return function(req, res, next){
			if(req.params.user === "session"){
				req.params.user = req.user._id.toString();
			}
			if(module.exports.isAuthorized(req.user, ruleset) 
			&& module.exports.isAuthorized(req.user, {isUser: req.params.user})){
				next();
			}else{
				res.status(403).end();
			}
		};
	}
}

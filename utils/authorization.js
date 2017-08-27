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

var Promise = require("bluebird");

rules = {
	isUser: function(thisUser, otherUserId){
		if(!otherUserId
		|| thisUser._id == otherUserId){
			return Promise.resolve(true);
		}else{
			return Promise.resolve(false);
		}
	},

	hasRoles: function(user, roles){
		if(!roles){
			return Promise.resolve(true);
		}

		var promises = [];
		for(var i = 0; i < roles.length; i+=1){
			promises.push(user.hasRole(roles[i]));
		}
		return Promise.all(promises)
		.then(function(results){
			for(var i = 0; i < results.length; i += 1){
				if(results[i] !== true){
					return Promise.resolve(false);
				}
			}
			return Promise.resolve(true);
		});
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
		if(!user){
			return Promise.resolve(false);
		}
		if(!ruleset){
			return Promise.resolve(true);
		}

		return rules.hasRoles(user, ["admin"])
		.then(function(isAdmin){
			if(isAdmin){
				return Promise.resolve(true);
			}

			return Promise.all([
				rules.isUser(user, ruleset.isUser),
				rules.hasRoles(user, ruleset.hasRoles)
			]).then(function(results){
				for(var i = 0; i < results.length; i += 1){
					if(results[i] !== true){
						return Promise.resolve(false);
					}
				}
				return Promise.resolve(true);
			});
		});
	},

	// Middleware for denying connections without authorization
	authorize: function(ruleset){
		return function(req, res, next){
			module.exports.isAuthorized(req.user, ruleset)
			.then(function(authorized){
				if(authorized){
					next();
				}else{
					res.status(403).end();
				}
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
			.then(function(authorized){
				if(authorized){
					return module.exports.isAuthorized(req.user, {isUser: req.params.user});
				}else{
					res.status(403).end();
				}
			}).then(function(authorized){
				if(authorized){
					next();
				}else{
					res.status(403).end();
				}
			});
		};
	}
};

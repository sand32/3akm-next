/*
-----------------------------------------------------------------------------
Copyright (c) 2014 Seth Anderson

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

// Authorizes a user based on the given ruleset
// 
// The acceptable rules are as follows, all rules are optional:
// {
//     isUser: (User)
//     hasRoles: [String]
// }
module.exports = function(user, ruleset, combination){
	if(!ruleset){
		return true;
	}

	if(combination === "or"){
		return (ruleset.isUser ? rules.isUser(user, ruleset.isUser) : false) ||
				(ruleset.hasRoles ? rules.hasRoles(user, ruleset.hasRoles) : false);
	}else{
		return (ruleset.isUser ? rules.isUser(user, ruleset.isUser) : true) && 
				(ruleset.hasRoles ? rules.hasRoles(user, ruleset.hasRoles) : true);
	}
}


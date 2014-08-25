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

var mongoose = require("mongoose"),
	bcrypt = require("bcrypt-nodejs"),
	userSchema = mongoose.Schema({
		email: {
			type: String,
			required: true,
			unique: true
		},
		passwordHash: {
			type: String,
			required: true
		},
		verified: {
			type: Boolean,
			default: false
		},
		created: {
			type: Date,
			default: Date.now
		},
		modified: {
			type: Date,
			default: Date.now
		},
		accessed: {
			type: Date,
			default: Date.now
		},
		vip: {
			type: Boolean,
			default: false
		},
		lanInviteDesired: {
			type: Boolean,
			default: true
		},
		blacklisted: {
			type: Boolean,
			default: false
		},
		firstName: String,
		lastName: String,
		primaryHandle: String,
		tertiaryHandles: [String],
		roles: [String],
		services: [{
			service: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Service",
				required: true
			},
			serviceHandle: String
		}]
	});

userSchema.methods.hash = function(pass){
	return bcrypt.hashSync(pass, bcrypt.genSaltSync(), null);
};

userSchema.methods.isValidPassword = function(pass){
	return bcrypt.compareSync(pass, this.passwordHash);
};

userSchema.methods.hasRole = function(role){
	return this.roles.indexOf(role) !== -1;
};

module.exports = mongoose.model("User", userSchema);

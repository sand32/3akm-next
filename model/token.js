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

var mongoose = require("mongoose"),
	Promise = require("bluebird");
mongoose.Promise = Promise;
var crypto = require("crypto"),

	genHash = function(value, salt){
		var hash = crypto.createHash("sha256");
		salt = salt || crypto.randomBytes(16);
		hash.update(value);
		hash.update(salt);
		return Buffer.concat([hash.digest(), salt]).toString("hex");
	},

	compareHash = function(token, value){
		var buffer = new Buffer(token, "hex"), salt,
			hash = crypto.createHash("sha256");
		salt = buffer.slice(buffer.length - 16, buffer.length);
		return token === genHash(value, salt);
	},

	tokenSchema = mongoose.Schema({
		token: String,
		createdAt: {
			type: Date,
			default: Date.now,
			expires: 3600
		}
	});

tokenSchema.methods.validateToken = function(data){
	return compareHash(this.token, data);
};

tokenModel = mongoose.model("Token", tokenSchema);

tokenModel.createToken = function(data){
	var token = new tokenModel({token: genHash(data)});
	return token.save()
	.then(function(){
		return token.token;
	});
};

module.exports = tokenModel;

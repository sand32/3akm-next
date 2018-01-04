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

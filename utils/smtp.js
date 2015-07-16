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

var q = require("q"),
	nodemailer = require("nodemailer"),
	smtpPool = require("nodemailer-smtp-pool"),
	config = require("./common.js").config,
	transport = nodemailer.createTransport(smtpPool({
		host: config.smtp.address,
		port: config.smtp.port,
		secure: true,
		auth: {
			user: config.smtp.user,
			pass: config.smtp.password
		}
	}));

module.exports = {
	sendMail: function(message){
		var deferred = q.defer();
		message.from = {
			name: "3AKM LAN",
			address: config.smtp.fromAddress
		};
		transport.sendMail(message, function(err, info){
			if(err){
				deferred.reject(err);
			}else{
				deferred.resolve();
			}
		});
	},

	sendEmailVerification: function(user){
		message.to = {
			name: user.firstName + " " + user.lastName,
			address: user.email
		};
		message.html = "";
	}
};

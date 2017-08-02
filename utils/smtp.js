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

var Promise = require("bluebird"),
	nodemailer = require("nodemailer"),
	smtpPool = require("nodemailer-smtp-pool"),
	Token = require("../model/token.js"),
	config = require("./common.js").config,
	transport = Promise.promisifyAll(nodemailer.createTransport(smtpPool({
		host: config.smtp.address,
		port: config.smtp.port,
		auth: {
			user: config.smtp.user,
			pass: config.smtp.password
		}
	}))),

	sendMail = function(message){
		message.from = {
			name: "3AKM",
			address: config.smtp.fromAddress
		};

		return transport.sendMailAsync(message)
		.catch(function(err){
			return Promise.reject({reason: "smtp-error", message: err});
		});
	};

module.exports = {
	sendMail: function(message){
		return sendMail(message);
	},

	sendEmailVerification: function(app, user, siteUrl){
		return Token.createToken("verify" + user.email)
		.then(function(token){
			message = {
				to: {
					name: user.firstName + " " + user.lastName,
					address: user.email
				},
				subject: "Email Verification"
			};
			return new Promise(function(resolve, reject){
				app.render("mail/emailverification.jade", {
					siteUrl: siteUrl,
					verificationLink: siteUrl + "/verify/" + user._id + "/" + token
				}, function(err, html){
					if(err){
						reject({reason: "html-rendering-error", message: err});
					}else{
						message.html = html;
						sendMail(message).then(function(){
							resolve();
						}).catch(function(err){
							reject(err);
						});
					}
				});
			});
		});
	},

	sendPasswordReset: function(app, user, siteUrl){
		return Token.createToken("passwordreset" + user.email)
		.then(function(token){
			message = {
				to: {
					name: user.firstName + " " + user.lastName,
					address: user.email
				},
				subject: "Forgot Password"
			};
			return new Promise(function(resolve, reject){
				app.render("mail/resetpassword.jade", {
					siteUrl: siteUrl,
					verificationLink: siteUrl + "/resetpassword/" + user._id + "/" + token
				}, function(err, html){
					if(err){
						reject({reason: "html-rendering-error", message: err});
					}else{
						message.html = html;
						sendMail(message).then(function(){
							resolve();
						}).catch(function(err){
							reject(err);
						});
					}
				});
			});
		});
	}
};

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

var Promise = require("bluebird"),
	nodemailer = require("nodemailer"),
	Token = require("../model/token.js"),
	config = require("./common.js").config,
	transport = Promise.promisifyAll(nodemailer.createTransport({
		host: config.smtp.address,
		port: config.smtp.port,
		auth: {
			user: config.smtp.user,
			pass: config.smtp.password
		}
	})),

	sendMail = function(message){
		message.from = "3AKM <" + config.smtp.fromAddress + ">";

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
			var message = {
				to: user.firstName + " " + user.lastName + " <" + user.email + ">",
				subject: "Email Verification"
			};
			return new Promise(function(resolve, reject){
				app.render("mail/emailverification.pug", {
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
			var message = {
				to: user.firstName + " " + user.lastName + " <" + user.email + ">",
				subject: "Forgot Password"
			};
			return new Promise(function(resolve, reject){
				app.render("mail/resetpassword.pug", {
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

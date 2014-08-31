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
	authorize = require("../authorization.js"),
	blendedAuthenticate = require("../utils.js").blendedAuthenticate,
	multer = require("multer");

module.exports = function(app, prefix){
	app.post(prefix + "/image", multer({
		dest:"./public/uploads/images/",
		fileSize: 4000000, // 4MB
		limits: {
			fields: 0,
			files: 1
		},
		onFileUploadStart: function(file){
			if(file.mimetype.indexOf("image/")){
				return false;
			}
		},
		onError: function(error, next){
			console.log("Error uploading image: " + error);
			next(error);
		}
	}), function(req, res){
		if(req.files.file){
			res.status(200).send(req.files.file);
		}else{
			res.status(400).end();
		}
	});

	app.get(prefix + "/test", function(req, res){
		res.send("<form action='/api/upload/image' method='post' enctype='multipart/form-data'><input type='file' name='file'/><input type='submit' value='Send'/></form>");
	});
}

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

var mongoose = require("mongoose")
mongoose.Promise = require("bluebird");
var rsvpSchema = mongoose.Schema({
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true
		},
		lan: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Lan",
			required: true
		},
		status: {
			type: String,
			enum: ["Yes", "No", "Maybe"],
			default: "Yes"
		},
		playing: {
			type: Boolean,
			default: true
		},
		guests: {
			type: Number,
			default: 0,
			min: 0
		},
		attended: {
			type: Boolean,
			default: false
		},
		cleaning: {
			type: Boolean,
			default: false
		},
		tournaments: [{
			game: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Game",
				required: true
			},
			scores: [Number]
		}],
		bringingFood: {
			type: Boolean,
			default: false
		}
	});

rsvpSchema.index({user: 1, lan: 1}, {unique: true});

module.exports = mongoose.model("Rsvp", rsvpSchema);

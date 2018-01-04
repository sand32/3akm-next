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
var lanSchema = mongoose.Schema({
		beginDate: {
			type: Date,
			required: true
		},
		endDate: {
			type: Date,
			required: true
		},
		entryFee: {
			type: Number,
			default: 10
		},
		active: {
			type: Boolean,
			default: false
		},
		acceptingRsvps: {
			type: Boolean,
			default: false
		},
		games: [{
			game: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Game",
				required: true
			},
			tournament: {
				type: Boolean,
				default: false
			},
			tournamentName: String,
			placements: [{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User"
			}],
			placementsLocked: {
				type: Boolean,
				default: false
			},
			sortIndex: {
				type: Number,
				default: 0
			}
		}],
		foodRequired: [{
			name: {
				type: String,
				required: true
			},
			amount: {
				type: Number,
				default: 1
			}
		}]
	});

lanSchema.methods.hasGame = function(gameId){
	for(var i = 0; i < this.games.length; i += 1){
		if(this.games[i].game.toString() == gameId
		|| this.games[i].game._id.toString() == gameId){
			return true;
		}
	}
	return false;
}

lanSchema.methods.game = function(gameId){
	for(var i = 0; i < this.games.length; i += 1){
		if(this.games[i].game.toString() == gameId
		|| this.games[i].game._id.toString() == gameId){
			return this.games[i];
		}
	}
	return null;
}

module.exports = mongoose.model("Lan", lanSchema);

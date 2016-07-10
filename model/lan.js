/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2016 Seth Anderson

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
	lanSchema = mongoose.Schema({
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
			}]
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

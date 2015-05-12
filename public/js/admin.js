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

$(function(){
	//----------------------------
	// Common Behavior
	//----------------------------



	//----------------------------
	// Page-Specific Behavior
	//----------------------------
	
	// LAN Manager
	//----------------------------

	getGameList = function(){
		var games = [];
			gameFields = $("#lan-editor-form input[name = 'game-selector']:checked").closest(".game");
		for(var i = 0; i < gameFields.length; i += 1){
			var tourney = $(gameFields[i]).find("input[name = 'tournament-selector']").is(":checked");
			games.push({
				game: $(gameFields[i]).attr("name"),
				tournament: tourney,
				tournamentName: tourney ? $(gameFields[i]).find("input[name = 'tournament-name']").val() : ""
			});
		}
		return games;
	};

	getFoodList = function(){
		var food = [],
			foodFields = $("#lan-editor-form .foodList");
		for(var i = 0; i < foodFields.length; i += 1){
			if($(foodFields[i]).find("[name = 'foodName']").val() != ""){
				food.push({
					name: $(foodFields[i]).find("[name = 'foodName']").val(),
					amount: Number($(foodFields[i]).find("[name = 'foodAmount']").val())
				});
			}
		}
		return food;
	};

	addLAN = function(){
		$.ajax({
			type: "POST",
			url: "/api/lan",
			contentType: "application/json",
			data: JSON.stringify({
				beginDate: $("#lan-editor-form input[name = 'beginDate']").val(),
				endDate: $("#lan-editor-form input[name = 'endDate']").val(),
				active: $("#lan-editor-form input[name = 'active-yes']").parent().hasClass("active"),
				acceptingRsvps: $("#lan-editor-form input[name = 'acceptingRsvps-yes']").parent().hasClass("active"),
				games: getGameList(),
				foodRequired: getFoodList()
			}),
			processData: false,
			success: function(){
				location.replace("/admin/lan");
			},
			error: function(){
				setErrorAlert("Error adding LAN.");
			}
		});
	};

	updateLAN = function(id){
		$.ajax({
			type: "PUT",
			url: "/api/lan/" + id,
			contentType: "application/json",
			data: JSON.stringify({
				beginDate: $("#lan-editor-form input[name = 'beginDate']").val(),
				endDate: $("#lan-editor-form input[name = 'endDate']").val(),
				active: $("#lan-editor-form input[name = 'active-yes']").parent().hasClass("active"),
				acceptingRsvps: $("#lan-editor-form input[name = 'acceptingRsvps-yes']").parent().hasClass("active"),
				games: getGameList(),
				foodRequired: getFoodList()
			}),
			processData: false,
			success: function(){
				setSuccessAlert("Successfully updated LAN.");
			},
			error: function(){
				setErrorAlert("Error updating LAN.");
			}
		});
	};

	deleteSelectedLans = function(){
		callback = function(){
			var lans = $("#lan-manager .row-selector:checked");
			for(var i = 0; i < lans.length; i += 1){
				if(i === lans.length - 1){
					$.ajax({
						type: "DELETE",
						url: "/api/lan/" + $(lans[i]).next("input[type = 'hidden']").val(),
						success: function(){
							location.reload(true);
						},
						error: function(){
							setErrorAlert("Unable to delete LAN(s).");
						}
					});
				}else{
					$.ajax({
						type: "DELETE",
						url: "/api/lan/" + $(lans[i]).next("input[type = 'hidden']").val()
					});
				}
			}
		};
		confirm("Are you sure you want to delete the selected LAN(s)?", callback);
	};

	deleteLan = function(id){
		callback = function(){
			$.ajax({
				type: "DELETE",
				url: "/api/lan/" + id,
				success: function(){
					location.reload(true);
				},
				error: function(){
					setErrorAlert("Unable to delete LAN.");
				}
			});
		};
		confirm("Are you sure you want to delete this LAN?", callback);
	};

	// Game Manager
	//----------------------------

	getSupplementalFiles = function(){
		var files = [],
			fileFields = $("#game-editor-form .supplementalFiles");
		for(var i = 0; i < fileFields.length; i += 1){
			if($(fileFields[i]).find("[name = 'fileName']").val() != ""){
				files.push({
					name: $(fileFields[i]).find("[name = 'fileName']").val(),
					url: $(fileFields[i]).find("[name = 'fileUrl']").val()
				});
			}
		}
		return files;
	};

	addGame = function(){
		var data = {
				name: $("#game-editor-form input[name = 'name']").val(),
				version: $("#game-editor-form input[name = 'version']").val(),
				descriptionHeaderImage: $("#game-editor-form input[name = 'descriptionHeaderImage']").val(),
				description: $("#game-editor-form textarea[name = 'description']").val(),
				supplementalFiles: getSupplementalFiles()
			};
		if(data.version === ""){
			delete data.version;
		}
		$.ajax({
			type: "POST",
			url: "/api/game",
			contentType: "application/json",
			data: JSON.stringify(data),
			processData: false,
			success: function(){
				location.replace("/admin/game");
			},
			error: function(){
				setErrorAlert("Error adding game.");
			}
		});
	};

	updateGame = function(id){
		var data = {
				name: $("#game-editor-form input[name = 'name']").val(),
				version: $("#game-editor-form input[name = 'version']").val(),
				descriptionHeaderImage: $("#game-editor-form input[name = 'descriptionHeaderImage']").val(),
				description: $("#game-editor-form textarea[name = 'description']").val(),
				supplementalFiles: getSupplementalFiles()
			};
		if(data.version === ""){
			delete data.version;
		}
		$.ajax({
			type: "PUT",
			url: "/api/game/" + id,
			contentType: "application/json",
			data: JSON.stringify(data),
			processData: false,
			success: function(){
				setSuccessAlert("Successfully updated game.");
			},
			error: function(){
				setErrorAlert("Error updating game.");
			}
		});
	};

	deleteSelectedGames = function(){
		callback = function(){
			var lans = $("#game-manager .row-selector:checked");
			for(var i = 0; i < lans.length; i += 1){
				if(i === lans.length - 1){
					$.ajax({
						type: "DELETE",
						url: "/api/game/" + $(lans[i]).next("input[type = 'hidden']").val(),
						success: function(){
							location.reload(true);
						},
						error: function(){
							setErrorAlert("Unable to delete game(s).");
						}
					});
				}else{
					$.ajax({
						type: "DELETE",
						url: "/api/game/" + $(lans[i]).next("input[type = 'hidden']").val()
					});
				}
			}
		};
		confirm("Are you sure you want to delete the selected game(s)?", callback);
	};

	deleteGame = function(id){
		callback = function(){
			$.ajax({
				type: "DELETE",
				url: "/api/game/" + id,
				success: function(){
					location.reload(true);
				},
				error: function(){
					setErrorAlert("Unable to delete game.");
				}
			});
		};
		confirm("Are you sure you want to delete this game?", callback);
	};

	// CoD4 Service Admin
	//----------------------------

	getGametype = function(){
		$.ajax({
			type: "GET",
			url: "/api/service/cod4/gametype",
			success: function(data){
				var latched = data.latched;
				if(latched === "") latched = data.gametype;
				$(".current-gametype").html(data.gametype);
				$(".latched-gametype").html(latched + " <span class='caret'></span>");
			},
			error: function(){
				$(".current-gametype").html("Retrieval failed");
				$(".latched-gametype").html("Retrieval failed <span class='caret'></span>");
			}
		});
	};

	setGametype = function(gametype){
		toggleApiActionElements();
		$.ajax({
			type: "PUT",
			url: "/api/service/cod4/gametype",
			contentType: "application/json",
			data: JSON.stringify({
				gametype: gametype
			}),
			processData: false,
			success: function(){
				setSuccessAlert("Gametype successfully updated. Changes will take effect on next map rotate.");
				toggleApiActionElements();
				reloadCoD4Info();
			},
			error: function(){
				setErrorAlert("Unable to set gametype.");
				toggleApiActionElements();
			}
		});
	};

	getServerStatus = function(){
		$.ajax({
			type: "GET",
			url: "/api/service/cod4/status",
			success: function(data){
				var i, player;
				$(".current-map").html(data.map);
				if(data.players.length > 0){
					$(".empty-table").addClass(".hidden");
					for(i = 0; i < data.players.length; i += 1){
						player = data.players[i];
						$(".playerlist tbody").append("<tr><td></td><td>" + 
							player.num + "</td><td>" + 
							player.name + "</td><td>" + 
							player.score + "</td><td>" + 
							player.ping + "</td><td>" + 
							player.address + "</td>" + 
							"<td>Actions</td>" + 
							"</tr>");
					}
				}else{
					$(".empty-table").removeClass(".hidden");
					$(".empty-table").html("No players online.");
				}
			},
			error: function(){
				$(".current-map").html("Retrieval failed");
				$(".empty-table").html("Retrieval failed");
			}
		});
	};

	rotateMap = function(){
		toggleApiActionElements();
		$.ajax({
			type: "POST",
			url: "/api/service/cod4/map/rotate",
			success: function(){
				setSuccessAlert("Map successfully rotated.");
				toggleApiActionElements();
				reloadCoD4Info();
			},
			error: function(){
				setErrorAlert("Unable to set gametype.");
				toggleApiActionElements();
			}
		});
	};

	say = function(){
		toggleApiActionElements();
		$.ajax({
			type: "POST",
			url: "/api/service/cod4/say",
			contentType: "application/json",
			data: JSON.stringify({
				message: $("#cod4-admin input[name = 'sayText']").val()
			}),
			processData: false,
			success: function(){
				setSuccessAlert("Message sent.");
				$("#cod4-admin input[name = 'sayText']").val("");
				toggleApiActionElements();
			},
			error: function(){
				setErrorAlert("Unable to send message.");
				toggleApiActionElements();
			}
		});
	};

	reloadCoD4Info = function(){
		getServerStatus();
		getGametype();
	};
	if($("#cod4-admin").length !== 0){
		reloadCoD4Info();
		setInterval(reloadCoD4Info, 10000);
	}

	$('[data-toggle="tooltip"]').tooltip();

	// TS3 Service Admin
	//----------------------------

	startSelectedServerInstances = function(){
		var servers = $("#ts3-admin .row-selector:checked");
		for(var i = 0; i < servers.length; i += 1){
			if(i === servers.length - 1){
				$.ajax({
					type: "POST",
					url: "/api/service/ts3/server/" + $(servers[i]).parent().next("td").text() + "/start",
					success: function(){
						setTimeout(function(){location.reload(true);}, 100);
					},
					error: function(){
						setErrorAlert("Unable to start virtual server(s).");
					}
				});
			}else{
				$.ajax({
					type: "POST",
					url: "/api/service/ts3/server/" + $(servers[i]).parent().next("td").text() + "/start"
				});
			}
		}
	};

	stopSelectedServerInstances = function(){
		callback = function(){
			var servers = $("#ts3-admin .row-selector:checked");
			for(var i = 0; i < servers.length; i += 1){
				if(i === servers.length - 1){
					$.ajax({
						type: "POST",
						url: "/api/service/ts3/server/" + $(servers[i]).parent().next("td").text() + "/stop",
						success: function(){
							setTimeout(function(){location.reload(true);}, 100);
						},
						error: function(){
							setErrorAlert("Unable to stop virtual server(s).");
						}
					});
				}else{
					$.ajax({
						type: "POST",
						url: "/api/service/ts3/server/" + $(servers[i]).parent().next("td").text() + "/stop"
					});
				}
			}
		};
		confirm("Are you sure you want to stop the selected virtual server(s)?", callback);
	};

	startServerInstance = function(serverId){
		$.ajax({
			type: "POST",
			url: "/api/service/ts3/server/" + serverId + "/start",
			success: function(){
				setTimeout(function(){location.reload(true);}, 100);
			},
			error: function(){
				setErrorAlert("Unable to start virtual server.");
			}
		});
	};

	stopServerInstance = function(serverId){
		callback = function(){
			$.ajax({
				type: "POST",
				url: "/api/service/ts3/server/" + serverId + "/stop",
				success: function(){
					setTimeout(function(){location.reload(true);}, 100);
				},
				error: function(){
					setErrorAlert("Unable to stop virtual server.");
				}
			});
		};
		confirm("Are you sure you want to stop this virtual server?", callback);
	};
});
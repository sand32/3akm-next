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

	uriVars = {};
	createURIVarObj = function(){
		var vars = location.search.replace("?", "").split("&"),
			pair;
		for(var i = 0; i < vars.length; i += 1){
			pair = vars[i].split("=");
			uriVars[pair[0]] = pair[1];
		}
	};
	createURIVarString = function(){
		var str = "?";
		for(var key in uriVars){
			if(str !== "?"){
				str += "&";
			}
			str += key + "=" + uriVars[key];
		}
		return str;
	};
	if(location.search){
		createURIVarObj();
	}

	resizeContentArea = function(){
		if($("#contentRow").height() < $(".menu-container").height()){
			$("#contentRow").css("height", $(".menu-container").height())
		}

		var contentHeight = $("#header").outerHeight() 
							+ $("#contentRow").outerHeight() 
							+ $("#footer").outerHeight(),
			containerHeight = $(".container").height(),
			windowHeight = $(window).height();

		// Set content area to full height of window
		if(windowHeight > containerHeight
		|| contentHeight > containerHeight){
			$(".container").css("height", Math.max(windowHeight, contentHeight) + "px");
		}

		// Set menu container to width of its parent since "width: inherit" 
		// apparently can't be trusted
		$(".menu-container").css("width", $("#menu").width());
	}
	$(window).on("load resize", resizeContentArea);

	confirm = function(question, callback){
		$("#confirmationModal .modal-title").html(question);
		$("#confirmationModal .btn[name = 'yes']").click(callback);
		$("#confirmationModal").modal("show");
	};

	sortTable = function(sort){
		uriVars.sort = sort;
		location.replace(location.pathname + createURIVarString());
	};

	// Add icons to sorted table columns
	if($(".sort-asc").length > 0){
		$(".sort-asc").html($(".sort-asc").html() + "<span class='glyphicon glyphicon-chevron-up' />");
	}
	if($(".sort-desc").length > 0){
		$(".sort-desc").html($(".sort-desc").html() + "<span class='glyphicon glyphicon-chevron-down' />");
	}

	// Handle table row selections
	reactOnRowSelect = function(){
		if($(".table-selectable .row-selector:checked").length > 0){
			$(".global-operations .selection-only").removeAttr("disabled");
		}else{
			$(".global-operations .selection-only").attr("disabled", "disabled");
		}
	};
	if($(".table-selectable").length > 0){
		reactOnRowSelect();
		$(".table-selectable .row-selector").click(reactOnRowSelect);
	}

	// Handle accordion section behavior
	$(".section-header").hover(function(){
			$(this).removeClass("grayscale");
		}, function(){
			$(this).addClass("grayscale");
		}
	);
	$(".section-header").mousedown(function(e){
		$(e.target).closest(".section-entry").toggleClass("section-entry-open");
	});

	uploadImage = function(fileFieldName, pathFieldName){
		var data = new FormData();
		data.append(fileFieldName, $("input[name = '" + fileFieldName + "']")[0].files[0]);
		$.ajax({
			type: "POST",
			url: "/api/upload/image",
			contentType: "multipart/form-data",
			data: data,
			cache: false,
			processData: false,
			success: function(data){
				$("input[name = '" + pathFieldName + "']").val(data.path.replace("public", ""));
			}
		});
	};

	toggleApiActionElements = function(){
		$(".api-action").toggleClass("disabled");
	};

	//----------------------------
	// Alerts
	//----------------------------

	setSuccessAlert = function(contents){
		contents = "<div class='alert alert-success' role='alert'>" + contents;
		contents += "<button type='button' class='close' data-dismiss='alert'><span aria-hidden='true'>&times;</span><span class='sr-only'>Close</span></button></div>";
		$("#header").html(contents);
	};

	setErrorAlert = function(contents){
		contents = "<div class='alert alert-danger' role='alert'>" + contents;
		contents += "<button type='button' class='close' data-dismiss='alert'><span aria-hidden='true'>&times;</span><span class='sr-only'>Close</span></button></div>";
		$("#header").html(contents);
	};

	//----------------------------
	// Page-specific Behavior
	//----------------------------

	// User Profile
	//----------------------------

	showChangePasswordModal = function(){
		$("#changePasswordModal").on("shown.bs.modal", function(e){
			$("#change-password-form input[name = 'newPassword']").focus();
		});
		$("#changePasswordModal").modal("show");
	};

	//----------------------------
	// Form Submission
	//----------------------------

	getTertiaryHandles = function(){
		var handles = [],
			fields = $("#user-editor-form input[name = 'tertiaryHandles']");
		for(var i = 0; i < fields.length; i += 1){
			handles[i] = $(fields[i]).val();
		}
		if(handles[0] == ""
		|| handles[0] == null){
			handles = [];
		}
		return handles;
	};

	// Authentication
	//----------------------------

	login = function(){
		$.ajax({
			type: "POST",
			url: "/api/user/login",
			contentType: "application/json",
			data: JSON.stringify({
				email: $("#login-form input[name = 'email']").val(), 
				password: $("#login-form input[name = 'password']").val()
			}),
			processData: false,
			success: function(){
				location.reload(true);
			},
			error: function(){
				setErrorAlert("Invalid username or password.");
			}
		});
	};

	logout = function(){
		$.ajax({
			type: "POST",
			url: "/api/user/logout",
			success: function(){
				location.reload(true);
			}
		});
	};

	register = function(){
		$.ajax({
			type: "POST",
			url: "/api/user/register",
			contentType: "application/json",
			data: JSON.stringify({
				email: $("#user-editor-form input[name = 'email']").val(),
				password: $("#user-editor-form input[name = 'password']").val(),
				firstName: $("#user-editor-form input[name = 'firstName']").val(),
				lastName: $("#user-editor-form input[name = 'lastName']").val(),
				primaryHandle: $("#user-editor-form input[name = 'primaryHandle']").val(),
				tertiaryHandles: getTertiaryHandles(),
				recaptchaResponse: grecaptcha.getResponse()
			}),
			processData: false,
			success: function(){
				location.replace("/");
			},
			error: function(){
				setErrorAlert("Unable to register user.");
			}
		});
	};

	// User Management
	//----------------------------

	resendVerificationEmail = function(id){
		$.ajax({
			type: "POST",
			url: "/api/user/" + id + "/verify",
			success: function(){
				setSuccessAlert("Verification email resent.");
			},
			error: function(){
				setErrorAlert("Failed to resend verification email.");
			}
		});
	};

	addUser = function(){
		var data = {
			email: $("#user-editor-form input[name = 'email']").val(),
			password: $("#user-editor-form input[name = 'password']").val(),
			firstName: $("#user-editor-form input[name = 'firstName']").val(),
			lastName: $("#user-editor-form input[name = 'lastName']").val(),
			primaryHandle: $("#user-editor-form input[name = 'primaryHandle']").val(),
			tertiaryHandles: getTertiaryHandles()
		};
		if($("#user-editor-form input[name = 'lanInviteDesired-yes']").length > 0){
			data.lanInviteDesired = $("#user-editor-form input[name = 'lanInviteDesired-yes']").parent().hasClass("active");
		}
		if($("#user-editor-form input[name = 'blacklisted-yes']").length > 0){
			data.blacklisted = $("#user-editor-form input[name = 'blacklisted-yes']").parent().hasClass("active");
		}
		if($("#user-editor-form input[name = 'roles']").length > 0){
			data.roles = $("#user-editor-form input[name = 'roles']").val().split(",");
		}

		$.ajax({
			type: "POST",
			url: "/api/user",
			contentType: "application/json",
			data: JSON.stringify(data),
			processData: false,
			success: function(){
				location.replace("/");
			},
			error: function(){
				setErrorAlert("Failed to register user.");
			}
		});
	}

	updateUser = function(id){
		var data = {
			email: $("#user-editor-form input[name = 'email']").val(),
			firstName: $("#user-editor-form input[name = 'firstName']").val(),
			lastName: $("#user-editor-form input[name = 'lastName']").val(),
			primaryHandle: $("#user-editor-form input[name = 'primaryHandle']").val(),
			tertiaryHandles: getTertiaryHandles(),
			lanInviteDesired: $("#user-editor-form input[name = 'lanInviteDesired-yes']").parent().hasClass("active")
		};
		if($("#user-editor-form input[name = 'blacklisted-yes']").length > 0){
			data.blacklisted = $("#user-editor-form input[name = 'blacklisted-yes']").parent().hasClass("active");
		}
		if($("#user-editor-form input[name = 'roles']").length > 0){
			data.roles = $("#user-editor-form input[name = 'roles']").val().split(",");
		}

		$.ajax({
			type: "PUT",
			url: "/api/user/" + id,
			contentType: "application/json",
			data: JSON.stringify(data),
			processData: false,
			success: function(){
				setSuccessAlert("User successfully updated.");
			},
			error: function(){
				setErrorAlert("Error updating user.");
			}
		});
	};

	changePassword = function(id){
		$.ajax({
			type: "PUT",
			url: "/api/user/" + id + "/password",
			contentType: "application/json",
			data: JSON.stringify({
				password: $("#change-password-form input[name = 'newPassword']").val()
			}),
			processData: false,
			success: function(){
				setSuccessAlert("Password changed successfully.");
			},
			error: function(){
				setErrorAlert("Error changing password.");
			}
		});
	};

	// Article Authoring
	//----------------------------

	submitNewArticle = function(){
		$.ajax({
			type: "POST",
			url: "/api/article",
			contentType: "application/json",
			data: JSON.stringify({
				title: $("#article-editor-form input[name = 'title']").val(),
				tags: $("#article-editor-form input[name = 'tags']").val().split(","),
				published: $("#article-editor-form input[name = 'published-yes']").parent().hasClass("active"),
				content: $("#article-editor-form textarea[name = 'article-content']").val()
			}),
			processData: false,
			success: function(){
				location.replace("/authoring/article");
			},
			error: function(){
				setErrorAlert("Error creating article.");
			}
		});
	};

	updateArticle = function(id){
		$.ajax({
			type: "PUT",
			url: "/api/article/" + id,
			contentType: "application/json",
			data: JSON.stringify({
				title: $("#article-editor-form input[name = 'title']").val(),
				tags: $("#article-editor-form input[name = 'tags']").val().split(","),
				published: $("#article-editor-form input[name = 'published-yes']").parent().hasClass("active"),
				content: $("#article-editor-form textarea[name = 'article-content']").val()
			}),
			processData: false,
			success: function(){
				setSuccessAlert("Successfully updated article.");
			},
			error: function(){
				setErrorAlert("Error updating article.");
			}
		});
	};

	deleteSelectedArticles = function(){
		callback = function(){
			var articles = $("#article-manager .row-selector:checked");
			for(var i = 0; i < articles.length; i += 1){
				if(i === articles.length - 1){
					$.ajax({
						type: "DELETE",
						url: "/api/article/" + $(articles[i]).next("input[type = 'hidden']").val(),
						success: function(){
							location.reload(true);
						},
						error: function(){
							setErrorAlert("Unable to delete article(s).");
						}
					});
				}else{
					$.ajax({
						type: "DELETE",
						url: "/api/article/" + $(articles[i]).next("input[type = 'hidden']").val()
					});
				}
			}
		};
		confirm("Are you sure you want to delete the selected article(s)?", callback);
	};

	deleteArticle = function(id){
		callback = function(){
			$.ajax({
				type: "DELETE",
				url: "/api/article/" + id,
				success: function(){
					location.reload(true);
				},
				error: function(){
					setErrorAlert("Unable to delete article.");
				}
			});
		};
		confirm("Are you sure you want to delete this article?", callback);
	};

	// RSVPs
	//----------------------------

	stringifyRsvpStatus = function(){
		if($("#rsvp-submission-form input[name = 'status-yes']").parent().hasClass("active")){
			return "Yes";
		}else if($("#rsvp-submission-form input[name = 'status-maybe']").parent().hasClass("active")){
			return "Maybe";
		}else{
			return "No";
		}
	};

	getTournamentParticipation = function(){
		var tournaments = [],
			tournamentFields = $("#rsvp-submission-form .active input[name = 'tournament-yes']");
		for(var i = 0; i < tournamentFields.length; i += 1){
			tournaments.push({
				tournament: $(tournamentFields[i]).closest(".tournament").attr("name")
			});
		}
		return tournaments;
	};

	submitRsvp = function(userId, year){
		$.ajax({
			type: "PUT",
			url: "/api/user/" + userId + "/rsvp/" + year,
			contentType: "application/json",
			data: JSON.stringify({
				status: stringifyRsvpStatus(),
				playing: $("#rsvp-submission-form input[name = 'playing-yes']").parent().hasClass("active"),
				guests: $("#rsvp-submission-form input[name = 'guests']").val(),
				cleaning: $("#rsvp-submission-form input[name = 'cleaning-yes']").parent().hasClass("active"),
				tournaments: getTournamentParticipation(),
				bringingFood: $("#rsvp-submission-form input[name = 'food-yes']").parent().hasClass("active")
			}),
			processData: false,
			success: function(){
				location.replace("/appearances");
			},
			error: function(){
				setErrorAlert("Unable to submit RSVP.");
			}
		});
	};

	//----------------------------
	// Form Behavior
	//----------------------------

	// Make sure the enter key submits on our forms since we're handling 
	// forms a little unconventionally
	$("form input").keypress(function(e){
		if (e.which == 13) {
			var submitButton = $(e.target).closest("form").find(".submitButton");
			if(!submitButton.attr("disabled")){
				submitButton.click();
			}
			return false;
		}
	});

	// Dynamic behavior for adding multiple array field entries
	$(".addItem").tooltip("enable");
	$(".addItem").click(function(){
		$(".addItem").before($(".addItem").attr("data-insertion"));
		$(".removeItem").tooltip("enable");
		$(".removeItem").click(function(){
			$(this).closest("div").remove();
			resizeContentArea();
		});
		$("form input").keypress(function(e){
			if (e.which == 13) {
				$(e.target).closest("form").find(".submitButton").click();
				return false;
			}
		});
		resizeContentArea();
	});
	$(".removeItem").click(function(){
		$(this).closest("div").remove();
		resizeContentArea();
	});

	// Add ckeditor to editor fields
	if($(".editorfield").length > 0){
		$(".editorfield").ckeditor(function(){
			resizeContentArea();
		});
	}

	// Add tokenization behavior to token fields
	if($(".tokenfield").length > 0){
		$(".tokenfield").tokenfield({
			createTokensOnBlur: true
		});
	}

	// Add picker behavior to date fields
	if($(".datefield").length > 0){
		$(".datefield").datetimepicker({
			pickTime: false
		}).on("dp.change", function(e){
			var validator = $(e.target).closest("form").data("bootstrapValidator"),
				fieldName = $(e.target).find("input").attr("name");
			if(validator.options.fields[fieldName]){
				validator.validateField(fieldName);
				if(!validator.isValid()){
					$(e.target).closest("form").find(".submitButton").attr("disabled", "disabled")
				}
			}
		});
	}

	// Force numeric fields to only accept numeric text
	if($("input[type = 'number']").length > 0){
		$("input[type = 'number']").keypress(function(e){
			if($(e.target).hasClass("nonnegative")){
				return String.fromCharCode(e.keyCode).match(/^\d+$/) !== null;
			}else{
				return String.fromCharCode(e.keyCode).match(/^[0-9\-]+$/) !== null;
			}
		});
	}

	//----------------------------
	// Form Validation
	//----------------------------

	if($(".validated-form").length > 0){
		$("#user-editor-form").bootstrapValidator({
			submitButtons: ".submitButton",
			fields: {
				email: {
					validators: {
						notEmpty: {
							message: "Required"
						},
						emailAddress: {
							message: "Must be a valid email address"
						}
					}
				},
				password: {
					validators: {
						notEmpty: {
							message: "Required"
						},
						identical: {
							field: "confirmPassword",
							message: "Passwords must match"
						}
					}
				},
				confirmPassword: {
					validators: {
						notEmpty: {
							message: "Passwords must match"
						},
						identical: {
							field: "password",
							message: "Passwords must match"
						}
					}
				}
			}
		});

		$("#change-password-form").bootstrapValidator({
			submitButtons: ".submitButton",
			fields: {
				newPassword: {
					validators: {
						notEmpty: {
							message: "Required"
						},
						identical: {
							field: "confirmPassword",
							message: "Passwords must match"
						}
					}
				},
				confirmPassword: {
					validators: {
						notEmpty: {
							message: "Passwords must match"
						},
						identical: {
							field: "newPassword",
							message: "Passwords must match"
						}
					}
				}
			}
		});

		$("#article-editor-form").bootstrapValidator({
			submitButtons: ".submitButton",
			fields: {
				title: {
					validators: {
						notEmpty: {
							message: "A title is required"
						}
					}
				}
			}
		});

		$("#lan-editor-form").bootstrapValidator({
			submitButtons: ".submitButton",
			fields: {
				beginDate: {
					validators: {
						notEmpty: {
							message: "A begin date is required"
						}
					}
				},
				endDate: {
					validators: {
						notEmpty: {
							message: "An end date is required"
						}
					}
				}
			}
		});

		$("#game-editor-form").bootstrapValidator({
			submitButtons: ".submitButton",
			fields: {
				name: {
					validators: {
						notEmpty: {
							message: "A name is required"
						}
					}
				}
			}
		});
	}
});

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

$(function(){

	//----------------------------
	// Common Behavior
	//----------------------------

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

	// Add icons to sorted table columns
	if($(".sort-asc").length > 0){
		$(".sort-asc").html($(".sort-asc").html() + "<span class='glyphicon glyphicon-chevron-up' />");
	}
	if($(".sort-desc").length > 0){
		$(".sort-desc").html($(".sort-desc").html() + "<span class='glyphicon glyphicon-chevron-down' />");
	}

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

	// User Manager
	//----------------------------

	reactOnUserSelect = function(){
		if($("#user-manager .user-selector:checked").length > 0){
			$("#user-manager .global-operations [name = 'delete']").removeAttr("disabled");
		}else{
			$("#user-manager .global-operations [name = 'delete']").attr("disabled", "disabled");
		}
	};
	if($("#user-manager").length > 0){
		reactOnUserSelect();
		$("#user-manager .user-selector").click(reactOnUserSelect);
	}

	sortUsers = function(sort){
		location.replace("/admin/user?sort=" + sort);
	};

	// Article Manager
	//----------------------------

	reactOnArticleSelect = function(){
		if($("#article-manager .article-selector:checked").length > 0){
			$("#article-manager .global-operations [name = 'delete']").removeAttr("disabled");
		}else{
			$("#article-manager .global-operations [name = 'delete']").attr("disabled", "disabled");
		}
	};
	if($("#article-manager").length > 0){
		reactOnArticleSelect();
		$("#article-manager .article-selector").click(reactOnArticleSelect);
	}

	deleteSelectedArticles = function(){
		callback = function(){
			var articles = $("#article-manager .article-selector:checked");
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

	sortArticles = function(sort){
		location.replace("/authoring/article?sort=" + sort);
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
				tertiaryHandles: getTertiaryHandles()
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
			tertiaryHandles: getTertiaryHandles()
		};
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

	// Dynamic behavior for adding multiple handles in the registration form
	$(".addHandle").tooltip("enable");
	$(".addHandle").click(function(){
		$(".addHandle").before('<div class="input-group" style="margin-top:.5em;"><input type="text" name="tertiaryHandles" class="form-control"><span class="input-group-btn"><a data-toggle="tooltip" data-placement="right" title="Remove this handle" class="removeHandle btn btn-default glyphicon glyphicon-minus" style="margin-top:-2px;" /></span></div>');
		$(".removeHandle").tooltip("enable");
		$(".removeHandle").click(function(){
			$(this).closest(".input-group").remove();
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
	$(".removeHandle").click(function(){
		$(this).closest(".input-group").remove();
		resizeContentArea();
	});

	tokenFieldOptions = {
		createTokensOnBlur: true
	};

	if($("#article-editor-form").length > 0){
		$("#article-editor-form input[name = 'tags']").tokenfield(tokenFieldOptions);
		$("#article-editor-form textarea[name = 'article-content']").ckeditor();
		resizeContentArea();
	}
	if($("#user-editor-form input[name = 'roles']").length > 0){
		$("#user-editor-form input[name = 'roles']").tokenfield(tokenFieldOptions);
	}

	//----------------------------
	// Form Validation
	//----------------------------

	$("#register-form").bootstrapValidator({
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
});

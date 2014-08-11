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
	resizeContentArea = function(){
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

	login = function(){
		$.post("/api/user/login", {
			email: $("#login-form input[name = 'email']").val(), 
			password: $("#login-form input[name = 'password']").val()
		},
		function(){location.reload(true);});
	};

	logout = function(){
		$.post("/api/user/logout", null, function(){location.reload(true);});
	};

	register = function(){
		$.post("/api/user/register", {
			email: $("#register-form input[name = 'email']").val(),
			password: $("#register-form input[name = 'password']").val()
		});
	};

	// Make sure the enter key submits on the login form since we're handling 
	// forms a little unconventionally
	$("#login-form input").keypress(function(){login();});

	// Dynamic behavior for adding multiple handles in the registration form
	$(".addHandle").tooltip("enable");
	$(".addHandle").click(function(){
		$(".addHandle").before('<div class="input-group" style="margin-top:.5em;"><input type="text" name="handles" class="form-control"><span class="input-group-btn"><a data-toggle="tooltip" data-placement="right" title="Remove this handle" class="removeHandle btn btn-default glyphicon glyphicon-minus" style="margin-top:-2px;" /></span></div>');
		$(".removeHandle").tooltip("enable");
		$(".removeHandle").click(function(){
			$(this).closest(".input-group").remove();
			resizeContentArea();
		});
		resizeContentArea();
	});

	//----------------------------
	// Validation
	//----------------------------

	$("#register-form").bootstrapValidator({
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
});


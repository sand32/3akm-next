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
	$(window).on("load resize", function(){
		// Set content area to full height of window
		if($(window).height() > $(".container").height()){
			$(".container").css("height", $(window).height() + "px");
		}

		// Set menu container to width of its parent since "width: inherit" 
		// apparently can't be trusted
		$(".menu-container").css("width", $("#menu").width());
	});

	login = function(){
		$.post("/api/user/login", {
			email: $("#login-form input[name = 'email']").val(), 
			password: $("#login-form input[name = 'password']").val()
		},
		location.reload(true));
	};

	logout = function(){
		$.post("/api/user/logout", null, location.reload(true));
	};

	register = function(){
		$.post("/api/user/register", {
			email: $("#register-email").val(),
			password: $("#register-password").val()
		});
	};

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


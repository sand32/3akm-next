/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2017 Seth Anderson

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

(function(){
	var LanSelectController = function($uibModalInstance, ngToast, LanService){
		var ctrl = this;
		ctrl.lans = [];

		LanService.retrieveAll()
		.then(function(response){
			ctrl.lans = response.data;
		}).catch(function(){
			ngToast.danger("Failed to retrieve LANs.");
		});

		ctrl.ok = function(userId){
			$uibModalInstance.close(userId);
		};

		ctrl.cancel = function(){
			$uibModalInstance.dismiss("cancel");
		};
	};

	angular
		.module("3akm.lanSelectModal", [])
		.controller("LanSelectController", LanSelectController);

	LanSelectController.$inject = ["$uibModalInstance", "ngToast", "LanService"];
})();

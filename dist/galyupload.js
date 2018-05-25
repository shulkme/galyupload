(function ($) {
	$.fn.galyUpload = function (opts) {
		var defaults = {
			btnBrowse: '#galy-upload-btn-browse',//文件浏览按钮
			btnUpload: '#galy-upload-btn-upload',//文件上传按钮
			btnEmpty: '#galy-upload-btn-empty',//清除文件队列按钮
			allowFileTypes: '*.pdf;*.doc;*.docx;*.jpg',//允许上传文件类型，格式'*.pdf;*.doc;'
			allowFileSize: 100000,//允许上传的最大文件大小
			multi: true,//是否允许多文件上传
			multiNum: 5,//多文件上传时允许的有效文件数
			showPreview: true,//是否显示预览
			url: '',//上传文件地址
			fileName: 'file',//文件配置参数
			formParam: null,//文件以外的配置参数，格式：{key1:value1,key2:value2}
			timeout: 3000,//请求超时时间
			okCode: 100,//与后端返回数据code值一致时执行成功回调，不配置默认200
			successFunc: null,//上传成功回调函数
			errorFunc: null,//上传失败回调函数
			deleteFunc: null//删除文件回调函数

	    }
	    var option = $.extend(defaults, opts);
		// 通用函数集合
		var F = {
			// 将文件的单位由bytes转换为KB或MB，若第二个参数指定为true，则永远转换为KB
			formatFileSize: function (size, justKB) {
				if (size > 1024 * 1024 && !justKB) {
					size = (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
				} else {
					size = (Math.round(size * 100 / 1024) / 100).toString() + 'KB';
				}
				return size;
			},
			// 将输入的文件类型字符串转化为数组,原格式为*.jpg;*.png
			getFileTypes: function (str) {
				var result = [];
				var arr = str.split(";");
				for (var i = 0, len = arr.length; i < len; i++) {
					result.push(arr[i].split(".").pop());
				}
				return result;
			}
		};
		this.each(function (index, element) {
			// 文件相关变量
			var allowFiles = [];
			var selectedFiles = {};
			// 文件上传请求次数
			var postedNum = 0;
			// 标识上传是否完成
			var upFiniehed = true;
			// 标识当前是否允许新的文件上传
			var allowNewPost = true;
			// 文件上传状态
			var uploadStatus = ['文件不符合','准备','等待','上传中','上传失败','上传成功'];
			// 进度条相关变量
			var loadedPercent = 0;
			var increasePercent = 1;
			var showTimer = undefined;
			var uploadCompleted = false;
			//  定义变量接收上传返回结果
			var response = {};
			response.success = [];
			response.error = [];
			// 实例化相关变量
			var _ele = $(element);
			var galyManager = {
				//初始化实例，构建基本框架
				init: function () {
					var $html = '';
					$html = '<div class="galy-upload-wrapper">';
					$html += '<input type="file" '
					$html += option.multi ? 'multiple ' : '';
					$html += 'class="galy-upload-fileInput" data-count="0" style="display:none;" />';
					$html += '<ul class="galy-upload-listview"></ul>';
					$html += '</div>';
					_ele.html($html);
					this.bindHead();
		        },
		        bindHead: function () {
		        	var _this = this;
					// 绑定前先解绑，一个页面多个easyUpload实例时如不解绑，事件会执行多次
					// 文件浏览按钮事件
					$(option.btnBrowse).off('click').click(function () {
						$(_ele).children().find('.galy-upload-fileInput').trigger('click');
					});
					$('.galy-upload-fileInput').off('change').change(function () {
						var count = Number($(this).attr('data-count'));
						var fileArr = [];
						var files = this.files;
						for (var i = 0; i < files.length; i++) {
							var obj = {};
							obj.index = count;
							obj.file = files[i];
							fileArr.push(obj);
							// 用对象将所有选择文件存储起来
							selectedFiles[count] = obj;
							count++;
						}
						$(this).val('').attr('data-count', count);
						_this._checkFile(fileArr, this);
					});
					//文件上传按钮
					$(option.btnUpload).off('click').click(function(){
						var listview = $(_ele).children().find('.galy-upload-listview');
						var arr = _this._findItems(1, listview);
						if (arr.length>0) {
							allowFiles = allowFiles.concat(arr);
							upFiniehed = true;
							_this._uploadFile(listview);
						}
					});
					//清空文件队列按钮
					$(option.btnEmpty).off('click').click(function(){
						var listview = $(_ele).children().find('.galy-upload-listview');
						var arr = _this._findItems(2, listview);
						if (arr.length>0) _this._deleFiles(arr,listview);
					});
		        },
		        //构建文件队列
		        bindQueue: function () {
					var _this = this;
					$('.galy-upload-btn-remove').off('click').click(function(){
						var indx = $(this).parent().attr('data-index');
						var target = $(this).parent().parent();
						_this._deleFiles([indx], target);
					});
				},
				//检查文件允许条件
		        _checkFile: function (fileArr, target) {
					var typeArr = F.getFileTypes(option.allowFileTypes);
					if (typeArr.length > 0) {
						for (var i = 0; i < fileArr.length; i++) {
							var f = fileArr[i].file;
							if (parseInt(F.formatFileSize(f.size, true)) <= option.allowFileSize) {
								if ($.inArray('*', typeArr) >= 0 || $.inArray(f.name.split('.').pop(), typeArr) >= 0) {
									fileArr[i].allow = true;
								} else {
									fileArr[i].allow = false;
								}
							} else {
								fileArr[i].allow = false;
							}
						}
					}
					this._renderFile(fileArr, target);
				},
				//读取文件信息并添加队列项
				_renderFile: function (fileArr, target) {
					var listview = $(target).parent().find('.galy-upload-listview');
					function render(file) {
						var preview;
						var f = file.file;
						var fileType = f.name.split('.').pop();
						if (fileType == 'bmp' || fileType == 'jpg' || fileType == 'jpeg' || fileType == 'png' || fileType == 'gif') {
							var imgSrc = URL.createObjectURL(f);
							preview = '<img src="' + imgSrc + '" />';
						} else if (fileType == 'rar' || fileType == 'zip' || fileType == 'arj' || fileType == 'z') {
							preview = '<i>zip</i>';
						} else {
							preview = '<i>other</i>';
						}
						var $html = '';
						$html += '<li class="galy-upload-item" data-index="' + file.index +'">';
						$html +='<button class="galy-upload-btn-remove">&Chi;</button>';
						$html += option.showPreview ? '<div class="galy-upload-preview">' + preview + '</div>' : '';
						$html += '<div class="galy-upload-info">';
						$html += '<p class="galy-upload-filename">'+ f.name +'</p>';
						$html += '<p class="galy-upload-filesize">' + F.formatFileSize(f.size) +'</p>';
						$html += file.allow ? '<p class="galy-upload-filestatus">'+uploadStatus[1]+'</p>' : '<p class="galy-upload-filestatus">'+uploadStatus[0]+'</p>';
						$html += '<div class="galy-upload-status">';
						$html += '<p class="galy-upload-progress">';
						$html += '<span class="galy-upload-bar"></span>';
						$html += '</p>';
						$html += '<p class="galy-upload-percent">0%</p>';
						$html += '</div>';
						$html += '</div>';
						$html += '<i class="upload-check upload-check-allow-'+ file.allow +'" data-up="1">1</i>';
						$html += '</li>';
						if (option.multi) {
							$(listview).append($html);
						} else {
							$(listview).html($html);
						}
					}
					for (var i = 0; i < fileArr.length; i++) {
						if (option.multi) {
							var qItemNum = $(listview).find('.galy-upload-item:visible').length;
							if (qItemNum<option.multiNum) render(fileArr[i]);          
						} else {
							render(fileArr[i]);
						}
					}
					this.bindQueue();
				},
				//队列项元素信息
				_findEle: function(index, target) {
					var obj = {};
					obj.ele = $(target).find(`.galy-upload-item[data-index=${index}]`);
					obj.upBar = $(obj.ele).find('.galy-upload-bar');
					obj.upPeacent = $(obj.ele).find('.galy-upload-percent');
					obj.fileStatus = $(obj.ele).find('.galy-upload-filestatus');
					obj.upStatus = $(obj.ele).find('.upload-check').attr('data-up');
					return obj;
				},
				//查找队列项
				_findItems: function(type,target) {
					var arr = [];
					if (type==1) {
						var icon = $(target).find('.upload-check-allow-true[data-up="1"]:visible');
					} else{
						var icon = $(target).find('.upload-check[data-up="1"]:visible,.upload-check[data-up="2"]:visible,.upload-check[data-up="4"]:visible');
					}
					for (var i = 0; i < icon.length; i++) {
						var indx = $(icon[i]).parent().attr('data-index');
						arr.push(indx);
					}
					return arr;
				},
				//设置上传状态
				 _setUpStatus: function(opt,type) {
					var param = this._findEle(opt.index, opt.target);
					if (type==1) {
						$(param.ele).find('.upload_check').attr('data-up',3);
					} else {
						$(param.ele).find('.upload_check').attr('data-up', 4);
					}
				},
				//为等待上传的队列项设置等待状态信息
				 _setStatus2: function(target) {
					var _this = this;
					allowFiles.forEach(function(item){
						var qItem = _this._findEle(item, target);
						if (qItem.upStatus=='1') {
							$(qItem.fileStatus).html(uploadStatus[2]);
							$(qItem.ele).find('.upload-check').attr('data-up',2);
						}
					});
				},
				//设置进度条
				_showProgress: function(index,target) {
					var _this = this;
					var param = this._findEle(index, target);
					$(param.fileStatus).html(uploadStatus[3]);
					var upBar = param.upBar;
					var upPeacent = param.upPeacent;
					var percentBoundary = Math.floor(Math.random() * 10) + 75;
					showTimer = setInterval(function () {
						if (loadedPercent < 100) {
							if (!uploadCompleted && loadedPercent > percentBoundary) {
								increasePercent = 0;
							} else {
								increasePercent = 1;
							}
							loadedPercent += increasePercent;
							$(upPeacent).text(loadedPercent + '%');
							$(upBar).css("width", loadedPercent + "%");
						} else {
							$(upPeacent).text('100%');
							$(upBar).css("width", "100%");
							$(param.upBar).addClass('galy-upload-status-success');
							$(param.fileStatus).html(uploadStatus[5]);
							upFiniehed = true;
							allowNewPost = true;
							clearInterval(showTimer);
							if (postedNum < allowFiles.length) _this._uploadFile(target);
						}
					}, 10);
				},
				//删除队列项
				_deleFiles: function(arr,target) {
					var _this = this;
					function dele(item) {
						response.success.forEach(function(item1,index1){
							if (item == item1.easyFileIndex) response.success.splice(index1,1);
						});
						response.error.forEach(function(item2,index2){
							if (item == item2.easyFileIndex) response.error.splice(index2, 1);
						});
					}
					function deleAllowFiles(itm) {
						allowFiles.forEach(function(item,index){
							if (itm == item) allowFiles.splice(index,1);
						}); 
					}
					arr.forEach(function(item){
						$(target).find(`.galy-upload-item[data-index=${item}]`).hide();
						if (option.multi) dele(item);
						var qItem = _this._findEle(item, target);
						if (qItem.upStatus=='2') deleAllowFiles(item);
					});
					option.deleteFunc && option.deleteFunc(response);
				}, 
				//上传文件
				_uploadFile: function(target) {
					var _this = this;
					this._setStatus2(target);
					function controlUp() {
						if (postedNum < allowFiles.length) {
							upFiniehed = false;
							upload();
						} else {
							upFiniehed = true;
						}
					}
					function upload() {
						if (allowNewPost) {
							allowNewPost = false;
							var file = selectedFiles[allowFiles[postedNum]];
							postedNum++;
							_this._resetParam();
							var fd = new FormData();
							fd.append(option.fileName, file.file);
							if (option.formParam) {
								for (key in option.formParam) {
									fd.append(key, option.formParam[key]);
								}
							}
							_this._setUpStatus({ index: file.index, target: target }, 1);
							_this._showProgress(file.index,target);
							$.ajax({
								url: option.url,
								type: "POST",
								data: fd,
								processData: false,
								contentType: false,
								datatype: "json",
								timeout: option.timeout,
								success: function (result) {
									// 标记索引，用于删除操作
									var res = eval("("+result+")");
									res.easyFileIndex = file.index;
									var param = _this._findEle(file.index, target);
									//var res = JSON.parse(res); 
									if (res.status!=option.okCode){
										allowNewPost = true;
										if (option.multi) {
											response.error.push(res);
											option.errorFunc && option.errorFunc(response);
										} else {
											option.errorFunc && option.errorFunc(res);
										}
										_this._handleFailed(param);
									} else {
										uploadCompleted = true;
										if (option.multi) {
											response.success.push(res);
											option.successFunc && option.successFunc(response);
										} else {
											option.successFunc && option.successFunc(res);
										}
									}
									controlUp();
									_this._setUpStatus({ index: file.index, target: target }, 2);
								},
								error: function (result) {
									var res = eval("("+result+")");
									res.easyFileIndex = file.index;
									if (option.multi) {
										response.error.push(res);
										option.errorFunc && option.errorFunc(response);
									} else {
										option.errorFunc && option.errorFunc(res);
									}
									allowNewPost = true;
									var param = _this._findEle(file.index, target);
									_this._handleFailed(param);
									controlUp();
									_this._setUpStatus({ index: file.index, target: target }, 2);
								}
							});
						}
					}
					if (upFiniehed) upload(target);
				},
				//上传失败反馈
				_handleFailed: function(param) {
					clearInterval(showTimer);
					//$(param.upBar).css("background-color", "red");
					$(param.upBar).addClass('galy-upload-status-error');
					$(param.fileStatus).html(uploadStatus[4]);
				},
				//重置参数
				_resetParam: function() {
					loadedPercent = 0;
					increasePercent = 1;
					showTimer = undefined;
					uploadCompleted = false;
				}
			};
      		galyManager.init();
		});
	}
}(jQuery));
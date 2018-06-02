# GalyUpload
基于 jquery 简单的文件上传插件，提供基本的样式风格，可以修改scss文件来自定义风格。
## 引入
1. 首先需要在 `<head>` 引入css样式，可以是包含自定义后的样式文件

``` html
<link rel="stylesheet" href="[Your project path]/dist/galyupload.css">
```
2. 然后在 `</body>` 前引入JavaScript文件，两者都是必要的

``` html
<script src="[Your project path]/src/jquery.min.js"></script>
<script src="[Your project path]/dist/galyupload.js"></script>
```
## 构建
1. 在网页中创建一个实例容器，只能是以 `id` 为对象

``` html
<div id="galy-upload"></div>
```
​	当然，还要指定三个基本的文件操作对象，因为插件自身没有初始化这几个对象，这样做的目的	其实是为了更好的自定义整体布局，只要指定对象就行，这里可以是 `id` 或 `class` ，这三个对象分别是`选择文件` 、 `开始上传`  、`清除队列` 。

​	例如，这样创建或指定操作对象：

``` html
<div class="galy-upload-handle">
  <button id="galy-upload-btn-browse" class="galy-upload-btn">选择文件</button>
  <button id="galy-upload-btn-upload" class="galy-upload-btn">开始上传</button>
  <button id="galy-upload-btn-empty" class="galy-upload-btn">清空队列</button>
</div>
```

​	三个 `button` 就是对应的操作对象， `id`  及 `class` 自定义就好，按钮布局及样式自定义，为了简化流程，插件本身默认指定的对象`id` 分别是 `galy-upload-btn-browse`  、 `galy-upload-btn-upload` 、`galy-upload-btn-empty`  直接在原有的元素上添加即可。

2. 然后在 `<script>` 实例化容器
 ```javascript
$('#galy-upload').galyUpload();
```

   这样就创建了基本的文件上传功能。

   ​

## 参数

仅仅实例化容器往往不能满足实际需求，这里还有提供一些插件的基本参数

| 参数             | 默认                         |  规范  | 解释                                     |
| :------------- | :------------------------- | :--: | -------------------------------------- |
| btnBrowse      | '#galy-upload-btn-browse'  |  必选  | 文件浏览按钮                                 |
| btnUpload      | '#galy-upload-btn-upload'  |  必选  | 开始上传按钮                                 |
| btnEmpty       | '#galy-upload-btn-empty'   |  必选  | 清空队列按钮                                 |
| allowFileTypes | '*.pdf;*.doc;*.docx;*.jpg' |  可选  | 文件类型                                   |
| allowFileSize  | 100000                     |  可选  | 允许上传最大文件大小                             |
| multi          | true                       |  可选  | 是否开启批量上传                               |
| multiNum       | 5                          |  可选  | 允许上传最大文件数量                             |
| showPreview    | true                       |  可选  | 是否显示预览图                                |
| url            | null                       |  必选  | 后台接收路径                                 |
| fileName       | 'file'                     |  可选  | 文件配置参数                                 |
| formParam      | null                       |  可选  | 文件以外的配置参数，格式：{key1:value1,key2:value2} |
| timeout        | 3000                       |  可选  | 请求超时时间                                 |
| okCode         | 100                        |  可选  | 后端请求成功返回代码                             |
| successFunc    | null                       |  可选  | 成功回调函数                                 |
| errorFunc      | null                       |  可选  | 失败回调函数                                 |
| deleteFunc     | null                       |  可选  | 删除回调函数                                 |

这里写一个简单的示例
``` javascript
$('#galy-upload').galyUpload({
		allowFileTypes: '*.jpg;*.png;*.bmp;*.jpeg;*.gif;*.svg;*.ico',//允许上传文件类型，格式';*.doc;*.pdf'
		allowFileSize: 100000,//允许上传文件大小(KB)
		multi: true,//是否允许多文件上传
		multiNum: 10,//多文件上传时允许的文件数
		showPreview: true,//是否显示文件预览
		url: 'upload.inc.php',//上传文件地址
		fileName: 'fileData',//文件filename配置参数
		// formParam: {
		//   token: $.cookie('token_cookie')//不需要验证token时可以去掉
		// },//文件filename以外的配置参数，格式：{key1:value1,key2:value2}
		timeout: 3000,//请求超时时间
		okCode: 100,//与后端返回数据code值一致时执行成功回调，不配置默认200
		successFunc: function(res) {
			console.log('成功回调', res);
		},//上传成功回调函数
		errorFunc: function(res) {
			console.log('失败回调', res);
		},//上传失败回调函数
		deleteFunc: function(res) {
			console.log('删除回调', res);
		}//删除文件回调函数
});
```

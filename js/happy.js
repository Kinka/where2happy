/**
 * @author Kinka, kinkabrain@gmail.com
 * @description 基础组件
 */

var h = {};
//绑定
h.on = function(obj, type, func) {
	if (window.addEventListener) {
		obj.addEventListener(type, func, false);
	} else if (window.attachEvent) {
		obj.attachEvent("on" + type, func);
	} else {
		obj["on" + type] = func;
	}

	return obj;
};

h.off = function(obj, type, fn){
	if(window.removeEventListener){
		obj.removeEventListener(type, fn);
	}else{
		obj.detachEvent('on'+type,  fn);
	}

	return obj;
};

h.addClass = function(obj, className) {
	obj.className = obj.className.replace(/( *)$/, ' ') + className; 
}

h.removeClass = function(obj, className) {
	var reg = new RegExp("(^| *)" + className + "($| *)", "g");
	obj.className = obj.className.replace(reg, ' ').replace(/ +/g, " ");
}

$id = function(id) {
	return document.getElementById(id);
}

/**
 * @param {String} words
 * @param {String} title, optional
 * @param {Boolean} disapper, 是否自动消失, optional
 * @param {String} type, alert or info or error...
 */
h.alert = function(words, title, disapper, type) {
	var template = new t('\
	<div class="alert h-alert {{=type}}">\
	  <button type="button" class="close" data-dismiss="alert">×</button>\
	  <strong>{{=title}}</strong> {{=words}}\
	</div>\
	');
	var box = $(template.render({'words': words, 'title': title, 'type': type?"alert-"+type:""}));
	$('#world').prepend(box);

	disapper = typeof(disapper)==='undefined' ? true : disapper;
	if(disapper) {
		setTimeout(function(){
			box.fadeOut('slow', function() {$(this).remove();});
		}, 1000);
	}
};
h.info = function() {
	var args = Array.prototype.slice.call(arguments, 0);
	if(args.length==2) args.push(true); // @param disappear default true
	args.push('info');
	h.alert.apply(this, args);
}
h.error = function() {
	var args = Array.prototype.slice.call(arguments, 0);
	if(args.length==2) args.push(true);
	args.push('error');
	h.alert.apply(this, args);
}
h.success = function() {
	var args = Array.prototype.slice.call(arguments, 0);
	if(args.length==2) args.push(true);
	args.push('success');
	h.alert.apply(this, args);
}

// 登陆和注册对话框
// register or login
var rORlDialog = {
	init: function() {
	  var loginDialog = $('.login-dialog'),
	      registerDialog = $('.register-dialog'),
	      body = $(document.body);
	  
	  if(loginDialog) {
	    $('#btnLogin').click(function(e) {
	      rORlShow(loginDialog);
	      return false;
	    });

	    $('.login-dialog .btn-cancel').click(function(e) {
	      rORlHide(loginDialog);
	      return false;
	    });
	  }

	  if(registerDialog) {
	    $('#btnRegister').click(function(e) {
	      rORlShow(registerDialog);
	      return false;
	    });

	    $('.register-dialog .btn-cancel').click(function(e) {
	      rORlHide(registerDialog);
	      return false;
	    });
	  }

	  function rORlShow(dialog) {
	  	if(body.hasClass('overlaying')) return;
	  	
	    body.addClass('overlaying');
	    dialog.removeClass('hidden');
	    dialog.removeClass('slide-up').addClass('slide-down');
	  }
	  function rORlHide(dialog) {
	    body.removeClass('overlaying');
	    dialog.removeClass('slide-down').addClass('slide-up');

	    setTimeout(function() {dialog.addClass('hidden');}, 500);
	  }
	}// init
};

// t.js
(function(){function f(a){this.t=a}function j(a,b){for(var c=b.split(".");c.length;){if(!(c[0]in a))return!1;a=a[c.shift()]}return a}function d(a,b){return a.replace(h,function(c,a,e,f,k,h,i,l){var c=j(b,f),a="",g;if(!c)return"!"==e?d(k,b):i?d(l,b):"";if(!e)return d(h,b);if("@"==e){for(g in c)c.hasOwnProperty(g)&&(b._key=g,b._val=c[g],a+=d(k,b));delete b._key;delete b._val;return a}}).replace(i,function(a,d,e){return(a=j(b,e))||0===a?"%"==d?(new Option(a)).innerHTML.replace(/"/g,"&quot;"):a:""})}
var h=/\{\{(([@!]?)(.+?))\}\}(([\s\S]+?)(\{\{:\1\}\}([\s\S]+?))?)\{\{\/\1\}\}/g,i=/\{\{([=%])(.+?)\}\}/g;f.prototype.render=function(a){return d(this.t,a)};window.t=f})();

// 线路编辑器
/**
 * 最基本的就是编辑功能,然后编辑状态可以保存,可以重新加载并继续编辑
 * 或许,需要提供异步加载组件的功能
 * 图片:双击添加路线,单击显示选项:包括删除图片,添加说明,查看评论,查看大图,浏览等,甚至可以有分享按钮!z-index?
 * 路线:单击显示选项:删除,添加说明
 * 首先,解决图片来源:本地拖拽上传图片(平板能否支持?好像目前不支持),已经保存在用户图库里的图片
 */
 var ground,
	gallery,
	selected,
	paper,
	box,
	drawingLine = false,
	oX, oY 		// coordination of mouse in ground
	;
var Editor = (function() {

	function init() {
		ground = $id('ground');
		gallery = $id('gallery');
		paper = Raphael('ground');
		// box是个遮罩层, 用来响应mousemove事件的.|||我到底是怎么想到的?!
		box = paper.rect(0, 0, ground.offsetWidth, ground.offsetHeight);
		box.attr('fill', 'transparent');
		box.attr('stroke', 'transparent');

		Place.init();
		Gallery.init();

		box.mousemove(function(e) {
			if(drawingLine) {
				Connection.wandering(e.clientX-oX, e.clientY-oY);
			}
		});

		h.on(gallery, 'dragstart', function(e) {
			if(e.target.tagName.toLowerCase() != 'img') return;

			e.dataTransfer.effectedAllowed = "move";
			e.dataTransfer.setDragImage(e.target, 0, 0);
			// e.dataTransfer.setData('text', e.target.src);
			selected = e.target;
			selected.offsetX = e.offsetX;
			selected.offsetY = e.offsetY;
		});
		h.on(gallery, 'dragend', function(e) {
			selected = null;
		});

		h.on(ground, 'dragenter', function(e) {
			h.addClass(ground, 'dragenter');

			e.stopPropagation();
			e.preventDefault();
		});

		h.on(ground, 'drop', function(e) {
			h.removeClass(ground, 'dragenter');

			e.stopPropagation();
			e.preventDefault();

			if(selected) {
				var body = document.body;
				selected.X = e.clientX - ground.offsetLeft - selected.offsetX + body.scrollLeft;
				selected.Y = e.clientY - ground.offsetTop - selected.offsetY + body.scrollTop;
				Place.add(selected);
			}

			if(e.dataTransfer.files) { // 处理本地上传图片
				handleFiles(e.dataTransfer.files, function(img) {
					img.X = e.clientX - ground.offsetLeft + document.body.scrollLeft;
					img.Y = e.clientY - ground.offsetTop + document.body.scrollTop;
					setTimeout(function() {
						img.X -= img.offsetWidth/2;
						img.Y -= img.offsetHeight;
						Place.add(img);
					}, 100); // 留点时间给浏览器渲染吧...
				});
			}
		});

		h.on(ground, 'dragover', function(e) {
			e.stopPropagation();
			e.preventDefault();
		});
	}

	function handleFiles(files, cb) {  
	    for (var i = 0; i < files.length; i++) {  
	        var file = files[i];  

	   		if (!file.type.match(/image*/)) {  
			    continue;  
			}  
			   
			var img = document.createElement("img");  

			// 需要把图片悄悄地,悄悄地,上传到后台~~
			if(window.URL) {
				img.src = window.URL.createObjectURL(file);
			}
			else if(window.webkitURL) {
				img.src = window.webkitURL.createObjectURL(file);
			}
			else {
				var reader = new FileReader();  
				reader.onload = function(e) { 
					img.src = this.result;
				};  
				reader.readAsDataURL(file);  
			}
		
			// <div class='photo'><img src="img/4.jpg"></div>
			var photo = document.createElement('div');
			photo.className = 'photo';
			photo.appendChild(img);
			// gallery.appendChild(photo);
			var photoWrapper = $id('photoWrapper');
			photoWrapper.insertBefore(photo, photoWrapper.firstChild); // prepend
			cb(img);
	    }  
	} 

/**
 * @description 编辑器下方的图片栏
 */
Gallery = (function() {
	var wrapper,
		scrollLeft,
		scrollRight,
		step = 5,
		timerID = -1,
		interval = 50;

	function init() {
		wrapper = $id('photoWrapper');
		scrollLeft = $id('scrollLeft');
		scrollRight = $id('scrollRight');

		h.on(scrollLeft, 'mouseover', function(e) {
			startScroll(-1);
		});
		h.on(scrollLeft, 'mouseout', endScroll);

		h.on(scrollRight, 'mouseover', function(e) {
			startScroll(+1);
		});
		h.on(scrollRight, 'mouseout', endScroll);
	}

	function startScroll(dir) {
		step = 5;
		timerID = setTimeout(function() {
			scrollGallery(dir);
		}, interval);
	}

	function endScroll(e) {
		clearTimeout(timerID);
		timerID = -1;
	}

	function scrollGallery(dir) { // dir: 1 or -1
		var style = wrapper.style,
			dis = parseInt(style.left || 0) + (step * dir);
		style.left = dis + 'px';

		var left = wrapper.offsetLeft,
			width = left + wrapper.offsetWidth,
			goon = (dir>0 ? left<500 : width>440);

		if(timerID != -1 && goon ) {
			if(step < 30) step += 5;

			timerID = setTimeout(function() {
				scrollGallery(dir);
			}, interval);
		}
	}

	return {
		init: init
	};
})();

/**
 * @description 放图片的一个集合
 * @todo 要限定拖放边界
 * Object
 */
Place = (function() {
	var places = [],
		gWidth,
		gHeight,
		placeMenu,
		placeClose;

	function init() {
		gWidth = ground.offsetWidth;
		gHeight = ground.offsetHeight;
		placeMenu = $id('placeMenu');
		placeClose = $id('placeClose');

		h.on(placeClose, 'click', function(e) {
			var which = placeMenu.which;
			if(which) {
				for(var i in which.lines)
					which.lines[i].del.call(which);

				which.remove();

				hideMenu();
			}
		});
	}

	function add(img) {
		var image = paper.image(img.src, img.X, img.Y, img.offsetWidth, img.offsetHeight);
		draggable(image);
		places.push(image);
	}

	function draggable(image) {
		var justClick = true;	// 是否只是单击,而不是drag或dblclick
		var x, y;
		var w = image.attr('width'),
			h = image.attr('height');

		image.drag(function(dx, dy, _, _, e) { // dragmove
			justClick = false;
			hideMenu();

			if(drawingLine) {
				return;
			}

			if(typeof this.updateAll !== 'undefined')
				this.updateAll(x+dx, y+dy);
			this.attr({
				x: Math.min(Math.max(0, x+dx), gWidth-w),
				y: Math.min(Math.max(0, y+dy), gHeight-h)
			});
		}, function(_, _, e) { // dragstart
			justClick = false;
			hideMenu();

			if(drawingLine) {
				return;
			}
			x = this.attr('x');
			y = this.attr('y');
		}, function(e) { // dragend
			showMenu(this);
		});

		image.hover(function(e) {
			if(drawingLine)
				Connection.wandering(this.attr('x')+w/2, this.attr('y')+h/2);
			this.attr('opacity', 0.8);

			showMenu(this);

		}, function(e) {
			this.attr('opacity', 1);

			// 在一定范围之外才隐藏
			var ex = e.x - ground.offsetLeft + document.body.scrollLeft,
				ey = e.y - ground.offsetTop + document.body.scrollTop;
			if(ex < this.attr('x') || ey < this.attr('y') 
				|| ex-this.attr('width')>this.attr('x') || ey-this.attr('height')>this.attr('y'))
				hideMenu();
		});

		image.dblclick(function(e) {
			justClick = false;

			if(drawingLine) { // end
				drawingLine = false;
				Connection.to(this);
				Connection.done();
			} else { // start
				drawingLine = true;
				Connection.from(this);
			}
		});

		// 单击图片,出现选项
		image.mousedown(function(e) {
			return;
			var offsetX = ground.offsetLeft + this.attr('x'),
				offsetY = ground.offsetTop + this.attr('y'),
				that = this;

			justClick = true;
			setTimeout(function() {
				if(justClick) {
					showMenu(that);
				}
			}, 600);
		});

		image.lines = [];
		image.updateAll = function(x, y) { // update all related lines
			if(!image.lines) return;

			for(var l in image.lines) {
				var line = image.lines[l];

				if(line.deleted()) { // if line deleted, remove the handler
					image.lines.splice(l, 1);
				} else {
					line.update(x, y);
				}
					
			}
		} 
	} // draggable

	function showMenu(which) {
		var	x = ground.offsetLeft + which.attr('x'),
			y = ground.offsetTop + which.attr('y');

		h.removeClass(placeMenu, 'hidden');
		placeMenu.style.left = x + "px";
		placeMenu.style.top = y + "px";

		placeMenu.which = which;
	}

	function hideMenu() {
		if(placeMenu.className.indexOf('hidden') == -1)
			h.addClass(placeMenu, 'hidden');
	}

	return {
		init: init,
		add: add,
		places: places
	}
})();

/**
 * @description  两个地点之间的连线
 */
Connection = (function(){
	var pairs = [],
		pair,
		path, // curve
		pathA,// arrow
		curve,
		arrow;

	function init() {

	}

	function from(image) {
		var x = image.attr('x'),
			y = image.attr('y'),
			w = image.attr('width'),
			h = image.attr('height');

		path = [["M", x+w/2, y+h/2], ["C", x+w, y, x+w, y, x+w, y]];
		curve = paper.path(path).attr({stroke: Raphael.getColor(), "stroke-width": 4, "stroke-linecap": "round"});
		
		pathA = [['M',10,0],['L',-20, 0],['L',25,-25],['z'],['L',-20,0],['L',25,25]],
		arrow = paper.path(pathA).attr({fill: Raphael.getColor(), stroke: 'transparent', cursor: 'pointer', 'class': 'arrow'}); 
		// arrow.node.setAttribute('class', 'arrow');
		var p = curve.getPointAtLength(0.5*curve.getTotalLength());
    	arrow.attr({'transform': "t" + [p.x, p.y] + "r" + p.alpha});

		pair = paper.set(curve, arrow, image);

		oX = ground.offsetLeft - document.body.scrollLeft;
		oY = ground.offsetTop - document.body.scrollTop;
	}

	function to(image) {
		var x = image.attr('x'),
			y = image.attr('y'),
			w = image.attr('width'),
			h = image.attr('height');

		path[1][3] = x-w/2;
		path[1][4] = y;
		path[1][5] = x+w/2;
		path[1][6] = y+h/2;
		curve.attr({'path': path});

		var p = curve.getPointAtLength(0.5*curve.getTotalLength());
    	var x1 = pair[2].attr('x'), y1 = pair[2].attr('y');
    	var r = Raphael.angle(x1, y1, x, y);
		arrow.attr({'transform': "T" + [p.x, p.y] + "R" + r});

		pair.push(image);
	}

	function wandering(x, y) {
		path[1][3] = x;
		path[1][4] = y;
		path[1][5] = x;
		path[1][6] = y;
		curve.attr({'path': path});

		var p = curve.getPointAtLength(0.5*curve.getTotalLength());
		var x1 = pair[2].attr('x'), y1 = pair[2].attr('y');
    	var r = Raphael.angle(x1, y1, x, y);
		arrow.attr({'transform': "T" + [p.x, p.y] + "R" + r});
	}

	function cancel() { // cancel current pair

	}

	function done() {
		pairs.push(pair);

		pair.hover(function(e) {
			this.attr({stroke: Raphael.getColor()});
		}, function(e) {
			this.attr({stroke: Raphael.getColor()});
		});

		// be careful
		var _image1 = pair[2],
			_image2 = pair[3],
			_path = path,
			_curve = curve,
			_arrow = arrow;

		_curve.click(del);
		// _arrow.click(del);

		function del() {
			var that = this==_image1 ? _image2:_image1,
				line;
			for(var i in that.lines) {
				line = that.lines[i];
				if(line.deleted == deleted) {// 删除连线在另一张图片的一端
					that.lines.splice(i, 1);
					break;
				}
			}

			_curve.remove();
			_arrow.remove();
			_curve = null;
			_arrow = null;
		}

		function deleted() {
			return !_arrow;
		}
		
		function update1(x, y) {
			var w = _image1.attr('width'),
				h = _image1.attr('height'),
				x2 = _image2.attr('x'),
				y2 = _image2.attr('y');

			_path[0][1] = x + w/2;
			_path[0][2] = y + h/2;

			var angle = parseInt(Raphael.angle(x,y, x2, y2)/90);
			switch(angle) {
				case 0:
					_path[1][1] = x;
					_path[1][2] = y;
					_path[1][3] = x2 + w;
					_path[1][4] = y2 + h;
					break;
				case 1:
					_path[1][1] = x + w;
					_path[1][2] = y;
					_path[1][3] = x2;
					_path[1][4] = y2 + h;
					break;
				case 2:
					_path[1][1] = x + w;
					_path[1][2] = y + h;
					_path[1][3] = x2;
					_path[1][4] = y2;
					break;
				case 3:
					_path[1][1] = x;
					_path[1][2] = y + h;
					_path[1][3] = x2;
					_path[1][4] = y2;
					break;
			}

			_curve.attr({path: _path});

		    var p = _curve.getPointAtLength(0.5*_curve.getTotalLength());
		    var r = Raphael.angle(x, y, x2, y2);
		    _arrow.attr({'transform': "T" + [p.x, p.y] + "R" + r});
		}

		function update2(x, y) {
			var w = _image2.attr('width'),
				h = _image2.attr('height'),
				x1 = _image1.attr('x'),
				y1 = _image1.attr('y');

			var angle = parseInt(Raphael.angle(x, y, x1, y1)/90);
			switch(angle) {
				case 0:
					_path[1][1] = x1 + w;
					_path[1][2] = y1 + h;
					_path[1][3] = x;
					_path[1][4] = y;
					break;
				case 1:
					_path[1][1] = x1;
					_path[1][2] = y1 + h;
					_path[1][3] = x + w;
					_path[1][4] = y;
					break;
				case 2:
					_path[1][1] = x1;
					_path[1][2] = y1;
					_path[1][3] = x + w;
					_path[1][4] = y + h;
					break;
				case 3:
					_path[1][1] = x1 + w;
					_path[1][2] = y1;
					_path[1][3] = x;
					_path[1][4] = y + h;
					break;
			}
			_path[1][5] = x + w/2;
			_path[1][6] = y + h/2;
			_curve.attr({path: _path});

		    var p = _curve.getPointAtLength(0.5*_curve.getTotalLength());
		    var r = Raphael.angle(x1, y1, x, y);
		    _arrow.attr({'transform': "T" + [p.x, p.y] + "R" + r});
		}

		_image1.lines.push({deleted: deleted, update: update1, del: del});
		
		_image2.lines.push({deleted: deleted, update: update2, del: del});
	}

	return {
		init: init,
		pairs: pairs, // current
		from: from,
		to: to,
		done: done,
		wandering: wandering
	}
})();

	return {
		init: init
	};
})();

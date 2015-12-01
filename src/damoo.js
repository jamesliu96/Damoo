/*!
 * Damoo - HTML5 Danmaku Engine v2.1.7
 * https://github.com/jamesliu96/Damoo
 *
 * Copyright (c) 2015 James Liu
 * Released under the MIT license
 */

;(function(window) {
    var Damoo = function(m, n, r, t) {
        if (!(this instanceof Damoo)) {
            return new Damoo(m, n, r, t);
        }
        this.canvas = new Canvas(m, n, r, t);
        this.thread = new Thread(r);
        this.colorPallete = new ColorPallete();
    };

    Damoo.version = "v2.1.7";

    Damoo.dom = window.document;

    // var _crop = function(c, x) {
    //     var g = x.getImageData(0, 0, c.width, c.height);
    //     for (var i = c.height - 1, j, w = 0, d = g.data; i >= 0; i--) {
    //         for (j = c.width - 1; j >= 0; j--) {
    //             if (d[(i * c.width + j) * 4 + 3] != 0) {
    //                 if (j > w) {
    //                     w = j + 1;
    //                 }
    //             }
    //         }
    //     }
    //     c.width = w;
    //     x.putImageData(g, 0, 0);
    // };

    var _createHyperLink = function(link, width, height) {
        var linkRect = Damoo.dom.createElement('a');
        linkRect.style.height = height + "px";
        linkRect.style.width = width + "px";
        linkRect.setAttribute("href", link);
        linkRect.setAttribute("class", "hyper_link");
        linkRect.setAttribute("target", "_blank");
        return linkRect;
    };

    var Font = function(s, f) {
        this.size = s;
        this.family = f;
    };

    var _preload = function(d, f) {
        //create text canvas
        var cvs = Damoo.dom.createElement('canvas'),
            ctx = cvs.getContext('2d');
        ctx.font = f.value;
        cvs.width = ctx.measureText(d.text).width;
        cvs.height = f.size * 1.2;
        //if the width or height of canvas has changed, the font value will be set as default
        ctx.font = f.value;
        ctx.textAlign = "start";
        ctx.textBaseline = "top";
        if (d.shadow) {
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.shadowColor = "#fff";
            ctx.shadowColor = d.shadow.color;
        }
        ctx.fillStyle = d.color;
        ctx.fillText(d.text, 0, 0);
        if (d.link) {
            cvs.link = _createHyperLink(d.link, cvs.width, cvs.height);
        }
        return cvs;
    };

    var _RAF = window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function(cb) { return setTimeout(cb, 17); };

    var _CAF = window.cancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||
        window.msCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        function(id) { clearTimeout(id); };

    Damoo.prototype.show = function() {
        this.canvas.parent.appendChild(this.canvas.layer);
        return this;
    };

    Damoo.prototype.hide = function() {
        this.canvas.parent.removeChild(this.canvas.layer);
        return this;
    };

    Damoo.prototype.emit = function(d) {
        d.color = this.colorPallete.arrangeColor(d);
        var cvs = _preload(d, this.canvas.font);
        //if the danmaku is too long to place, set the fixed as false
        if (cvs.width > 0.8 * this.canvas.width) {
            d.fixed = false;
        }
        this.thread.push({
            canvas: cvs,
            fixed: d.fixed,
            index: this.thread.index,
            speed: Math.pow(cvs.width, 1 / 3) * 0.6,
            offset: {
                x: this.canvas.width,
                y: this.canvas.font.size * this.thread.index
            },
            link: d.link
        });
        return this;
    };

    Damoo.prototype.clear = function() {
        this.thread.empty();
        return this;
    };

    var _afid;

    var _render = function() {
        this.canvas.clear();
        for (var i = 0; i < this.thread.length; i++) {
            var d = this.thread.get(i),
                x = d.offset.x,
                y = d.offset.y;
            this.canvas.draw(d, x, y);
            d.offset.x -= d.speed;
            if (x <= -d.canvas.width) {
                this.thread.remove(i);
            }
        }
        _afid = _RAF(function(self) {
            return function() {
                _render.call(self);
            };
        }(this));
    };

    Damoo.prototype.start = function() {
        if (this.state === void 0) {
            this.clear().show();
        }
        if (!this.state) {
            _render.call(this);
            this.state = 1;
        }
        return this;
    };

    Damoo.prototype.suspend = function() {
        if (this.state === void 0) {
            return this;
        }
        _CAF(_afid);
        this.state = 0;
        return this;
    };

    Damoo.prototype.resume = function() {
        return this.start();
    };

    Damoo.prototype.autoColor = function() {
        if (arguments.length >= 1) {
            this.colorPallete.autoArrange = argument[0];
        } else {
            this.colorPallete.autoArrange = !this.colorPallete.autoArrange;
        }
        return this;
    }

    var Canvas = function(m, n, r, t) {
        this.parent = m.nodeType == 1 ? m : Damoo.dom.getElementById(m);
        this.id = n;
        this.rows = r;
        this.width = this.parent.offsetWidth;
        this.height = this.parent.offsetHeight;
        if (this.height / this.rows < 12) {
            this.rows = this.height / 12;
        }
        this.font = new Font(this.height / this.rows, t || "sans-serif");
        this.layer = Damoo.dom.createElement('canvas');
        this.context = this.layer.getContext('2d');
        this.layer.id = this.id;
        this.layer.width = this.width;
        this.layer.height = this.height;
        this.layer.style.display = "block";
        this.layer.style.backgroundColor = "transparent";
        if (this.parent.style.position) {
            this.layer.style.position = "fixed";
            this.layer.style.left = this.parent.offsetLeft;
            this.layer.style.top = this.parent.offsetTop;
        } else {
            this.parent.style.position = "relative";
            this.layer.style.position = "absolute";
            this.layer.style.left = 0;
            this.layer.style.top = 0;
        }
        this.layer.style.zIndex = 99999;
    };

    Canvas.prototype.clear = function() {
        this.context.clearRect(0, 0, this.width, this.height);
    };

    Canvas.prototype.draw = function(t, x, y) {
        var left, top;
        if (t.fixed) {
            left = (this.width - t.canvas.width) / 2 + 0.5 | 0;
        } else {
            left = x + 0.5 | 0;
        }
        top = y + 0.5 | 0;
        this.context.drawImage(t.canvas, left, top);
        if (t.link !== undefined) {
            this.parent.appendChild(this.adjustLinkPosition(t.canvas.link, top, left));
        }
    };

    Canvas.prototype.adjustLinkPosition = function(linkRect, top, left) {
        linkRect.style.left = left + "px";
        linkRect.style.top = top + "px";
        return linkRect;
    }

    Object.defineProperty(Font.prototype, 'value', {
        get: function() {
            return this.size + "px " + this.family;
        }
    });

    var Thread = function(r) {
        this.index = 0;
        this.rows = r;
        this.pool = [];
    };

    Thread.prototype.push = function(d) {
        this.index++;
        if (this.index >= this.rows) {
            this.index = 0;
        }
        this.pool.push(d);
    };

    Thread.prototype.get = function(d) {
        return this.pool[d];
    };

    Thread.prototype.remove = function(d) {
        var item = this.get(d);
        if (item.link !== undefined) {
            item.canvas.link.remove();
        }
        var i = item.index;
        if (this.index > i) {
            this.index = i;
        }
        this.pool.splice(d, 1);
    };

    Thread.prototype.empty = function() {
        this.index = 0;
        this.pool = [];
    };

    Object.defineProperty(Thread.prototype, 'length', {
        get: function() {
            return this.pool.length;
        }
    });

    var ColorPallete = function() {
        this.colorPool = ["#748CB2", "#9CC677", "#EACF5E", "#F9AD79",
          "#D16A7C", "#8873A2", "#3A95B3", "#B6D949", "#FDD36C", "#F47958",
          "#A65084", "#0063B1", "#0DA841", "#FCB71D", "#F05620", "#B22D6E",
          "#3C368E", "#8FB2CF", "#95D4AB", "#EAE98F", "#F9BE92", "#EC9A99",
          "#BC98BD", "#1EB7B2", "#73C03C", "#F48323", "#EB271B", "#D9B5CA",
          "#AED1DA", "#DFECB2", "#FCDAB0", "#F5BCB4"
        ],
        this.current = 0;
        this.autoArrange = false;
    }

    ColorPallete.prototype.arrangeColor = function(d) {
        var color = d.color || this.autoArrange ? this.colorPool[this.current] : "#000";
        this.current = this.current === this.colorPool.length ? this.current = 0 : this.current = this.current + 1;
        return color;
    }

    window.Damoo = Damoo;
})(window);
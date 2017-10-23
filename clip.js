/* eslint-disable */
import Cropper from 'cropperjs';
import Exif from 'exif-js';
import ajax from '@/util/ajax';
import message from '../message';

export default {
    install(Vue) {
        // 初始化方法
        Vue.prototype.initilize = function (opt) {
            this.options = opt;
            // 创建dom
            this.createElement();
            this.resultObj = opt.resultObj;
            // 初始化裁剪对象
            this.cropper = new Cropper(this.preview, {
                aspectRatio: opt.aspectRatio ? opt.aspectRatio : 1,
                viewMode: 1,
                dragMode: 'move',
                background: false,
                zoomable: true,
                center: false,
                zoomOnWheel: false,
                zoomOnTouch: false,
                wheelZoomRatio: .1,
                cropBoxMovable: false,
                cropBoxResizable: false,
                autoCropArea: 1,
                guides: false,
                modal: true,
                highlight: true,
                zoom: function (e) {
                    // console.log(e.type, e.detail.ratio);
                },
            });
        };
        // 创建一些必要的DOM，用于图片裁剪
        Vue.prototype.createElement = function () {
            // 初始化图片为空对象
            this.preview = null;
            let str = '<div class="clip-container"><img id="clip_image" src="originUrl" class="clip-image"></div>' +
                      '<p class="clip-header"><span>修改头像</span><i class="iconfont iconfont-close"></i></p>' +
                      '<div class="load-effect"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><p>处理中...</p></div>' +
                      '<div class="btn-container"><button type="button" class="clip-cancel">取消</button><button type="button" class="clip-button">确定</button>' +
                      '<input type="range" min="0" max="100" step="10" @input="change" @change="change" class="clip-range" value="0"></div>';

            const body = document.getElementsByTagName('body')[0];
            this.reagion = document.createElement('div');
            this.reagion.id = 'clip_container';
            this.reagion.className = 'container';
            this.reagion.innerHTML = str;
            // 添加创建好的DOM元素
            body.appendChild(this.reagion);
            this.preview = document.getElementById('clip_image');
            // 绑定一些方法
            this.initFunction();
        };
        // 初始化一些函数绑定
        Vue.prototype.initFunction = function () {
            const self = this;
            this.clickBtn = document.getElementsByClassName('clip-button')[0];
            this.cancelBtn = document.getElementsByClassName('clip-cancel')[0];
            this.cancelIcon = document.getElementsByClassName('iconfont-close')[0];
            this.range = document.getElementsByClassName('clip-range')[0];
            this.effect = document.getElementsByClassName('load-effect')[0] ;
            this.preWidth = null;
            this.room = 0;
            this.document = document.body;
            // 确定事件
            this.addEvent(this.clickBtn, 'click', () => {
                self.crop();
            });
            // 取消事件
            this.addEvent(this.cancelBtn, 'click', () => {
                self.destoried();
            });
            this.addEvent(this.cancelIcon, 'click', () => {
                self.destoried();
            });
            this.addEvent(this.range, 'input', () => {
                self.cropper.zoom(.006 * (self.range.value - self.preWidth));
                if (!self.range.value) {
                    self.cropper.zoom(-10);
                }
                this.preWidth = self.range.value;
            })
            // 清空input的值
            this.addEvent(this.fileObj, 'click', function () {
                this.value = '';
            });
        };

        // 外部接口，用于input['file']对象change时的调用
        Vue.prototype.clip = function (e,opt) {
            const self = this;
            this.fileObj = e.srcElement;
            const files = e.target.files || e.dataTransfer.files;
            const objType = ['png', 'PNG', 'jpg', 'JPG', 'jpeg', 'JPEG'];
            let picFormat = null;
            // 获取图片文件资源
            this.picValue = files[0];
            const img = document.createElement('img');
            img.src = self.getObjectURL(self.picValue);
            if (this.picValue.size < 1024 * 1024 * 5) {
                const picType = this.picValue.name.split('.');
                for(let i=0; i< objType.length; i++) {
                    if (picType[picType.length - 1] === objType[i]) {
                        self.picFormat = true;
                        break;
                    }
                }
                // 不是图片直接返回
                if (!files.length) return false;
                if (!self.picFormat) {
                    message('只能上传png、jpg、jpeg格式的图片');
                    return false;
                }
                // 调用初始化方法
                this.initilize(opt);
                this.originUrl = null;
                // 去获取拍照时的信息，解决拍出来的照片旋转问题
                Exif.getData(this.picValue, function () {
                    self.Orientation = Exif.getTag(this, 'Orientation');
                    if (self.Orientation && self.Orientation !== 1) {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        if (self.Orientation != "" && self.Orientation != 1) {
                            switch (self.Orientation) {
                                case 6://需要顺时针（向左）90度旋转
                                    self.rotateImg(img, 'left', canvas);
                                    break;
                                case 8://需要逆时针（向右）90度旋转
                                    self.rotateImg(img, 'right', canvas);
                                    break;
                                case 3://需要180度旋转
                                    self.rotateImg(img, 'right', canvas);//转两次
                                    self.rotateImg(img, 'right', canvas);
                                    break;
                            }
                        }
                        // 1000只是示例，可以根据具体的要求去设定
                        // let scale;
                        // if (width > 1000 || height > 1000) {
                        //     if (width > height) {
                        //         scale = 1000 / width;
                        //     } else {
                        //         scale = 1000 / height;
                        //     }
                        // }
                        // canvas.width = scale * width;
                        // canvas.height = scale * height;
                        // let ctx = canvas.getContext('2d');
                        // ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        let data = canvas.toDataURL('image/png', 0.1);
                        self.effect.style.display = 'none';
                        self.originUrl = data;
                    } else {
                        self.effect.style.display = 'none';
                        self.originUrl = self.getObjectURL(self.picValue);

                    }
                    // 每次替换图片要重新得到新的url
                    if (self.cropper) {
                        self.cropper.replace(self.originUrl);
                    }
                });
            } else {
                message('图片不能超过5M');
            }
        };
        // 图片转码方法
        Vue.prototype.getObjectURL = function (file) {
            let url = null;
            if (window.createObjectURL != undefined) { // basic
                url = window.createObjectURL(file);
            } else if (window.URL != undefined) { // mozilla(firefox)
                url = window.URL.createObjectURL(file);
            } else if (window.webkitURL != undefined) { // webkit or chrome
                url = window.webkitURL.createObjectURL(file);
            }
            return url;
        };
        // 点击确定进行裁剪
        Vue.prototype.crop = function () {
            const self = this;
            const image = new Image();
            let croppedCanvas;
            let roundedCanvas;
            // Crop
            croppedCanvas = this.cropper.getCroppedCanvas();
            // Round
            roundedCanvas = this.getRoundedCanvas(croppedCanvas);
            const imgData = roundedCanvas.toDataURL();
            image.src = imgData;
            // 判断图片是否大于100k,不大于直接上传，反之压缩
            if (imgData.length < (100 * 1024)) {
                this.resultObj.src = imgData;
                // 图片上传
                this.postImg(imgData);
            } else {
                image.onload = function () {
                    // 压缩处理
                    const data = self.compress(image, self.Orientation);
                    self.resultObj.src = data;
                    // 图片上传
                    self.postImg(data);
                };
            }
        };
        // 获取裁剪图片资源
        Vue.prototype.getRoundedCanvas = function (sourceCanvas) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const width = 120;
            const height = 120;
            canvas.width = width;
            canvas.height = height;
            context.imageSmoothingEnabled = true;
            context.drawImage(sourceCanvas, 0, 0, width, height);
            context.globalCompositeOperation = 'destination-in';
            context.beginPath();
            context.rect(0, 0, width, height);
            context.fill();
            return canvas;
        };
        // 销毁原来的对象
        Vue.prototype.destoried = function () {
            const self = this;
            // 移除事件
            this.removeEvent(this.clickBtn, 'click', null);
            this.removeEvent(this.cancelBtn, 'click', null);
            this.removeEvent(this.fileObj, 'click', null);
            // 移除裁剪框
            this.reagion.parentNode.removeChild(this.reagion);
            // 销毁裁剪对象
            this.cropper.destroy();
            this.cropper = null;
        };
        // 图片上传
        Vue.prototype.postImg = function (data) {
            ajax.post(this.path, {
                avatar: data
            }, (response) => {
                if (response.code === 0) {
                    message('头像设定成功');
                    // console.log(data)
                } else {
                    message('头像上传失败');
                }
            }, 'json');
            const self = this;
            window.setTimeout(() => {
                self.destoried();
            }, 300);
        };

        // 图片旋转
        Vue.prototype.rotateImg = function (img, direction, canvas) {
            // 最小与最大旋转方向，图片旋转4次后回到原方向
            const min_step = 0;
            const max_step = 3;
            if (img == null) return;
            // img的高度和宽度不能在img元素隐藏后获取，否则会出错
            const height = img.height;
            const width = img.width;
            let step = 2;
            if (step == null) {
                step = min_step;
            }
            if (direction == 'right') {
                step++;
                // 旋转到原位置，即超过最大值
                step > max_step && (step = min_step);
            } else {
                step--;
                step < min_step && (step = max_step);
            }
            // 旋转角度以弧度值为参数
            const degree = step * 90 * Math.PI / 180;
            const ctx = canvas.getContext('2d');
            switch (step) {
                case 0:
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0);
                    break;
                case 1:
                    canvas.width = height;
                    canvas.height = width;
                    ctx.rotate(degree);
                    ctx.drawImage(img, 0, -height);
                    break;
                case 2:
                    canvas.width = width;
                    canvas.height = height;
                    ctx.rotate(degree);
                    ctx.drawImage(img, -width, -height);
                    break;
                case 3:
                    canvas.width = height;
                    canvas.height = width;
                    ctx.rotate(degree);
                    ctx.drawImage(img, -width, 0);
                    break;
            }
        };

        // 图片压缩
        Vue.prototype.compress = function (img, Orientation) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            // 瓦片canvas
            const tCanvas = document.createElement('canvas');
            const tctx = tCanvas.getContext('2d');
            const initSize = img.src.length;
            let width = img.width;
            let height = img.height;
            // 如果图片大于四百万像素，计算压缩比并将大小压至400万以下
            let ratio;
            if ((ratio = width * height / 4000000) > 1) {
                console.log('大于400万像素');
                ratio = Math.sqrt(ratio);
                width /= ratio;
                height /= ratio;
            } else {
                ratio = 1;
            }
            canvas.width = width;
            canvas.height = height;
            // 铺底色
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // 如果图片像素大于100万则使用瓦片绘制
            let count;
            if ((count = width * height / 1000000) > 1) {
                count = ~~(Math.sqrt(count) + 1); // 计算要分成多少块瓦片
                // 计算每块瓦片的宽和高
                const nw = ~~(width / count);
                const nh = ~~(height / count);
                tCanvas.width = nw;
                tCanvas.height = nh;
                for (let i = 0; i < count; i++) {
                    for (let j = 0; j < count; j++) {
                        tctx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
                        ctx.drawImage(tCanvas, i * nw, j * nh, nw, nh);
                    }
                }
            } else {
                ctx.drawImage(img, 0, 0, width, height);
            }
            // 修复ios上传图片的时候 被旋转的问题
            if (Orientation != '' && Orientation != 1) {
                switch (Orientation) {
                    case 6:// 需要顺时针（向左）90度旋转
                        this.rotateImg(img, 'left', canvas);
                        break;
                    case 8:// 需要逆时针（向右）90度旋转
                        this.rotateImg(img, 'right', canvas);
                        break;
                    case 3:// 需要180度旋转
                        this.rotateImg(img, 'right', canvas);// 转两次
                        this.rotateImg(img, 'right', canvas);
                        break;
                }
            }
            // 进行最小压缩
            const ndata = canvas.toDataURL('image/jpeg', 0.1);
            // console.log(`压缩前：${  initSize}`);
            // console.log(`压缩后：${  ndata.length}`);
            // console.log(`压缩率：${  ~~(100 * (initSize - ndata.length) / initSize)  }%`);
            tCanvas.width = tCanvas.height = canvas.width = canvas.height = 0;
            return ndata;
        };

        // 添加事件
        Vue.prototype.addEvent = function (obj, type, fn) {
            if (obj.addEventListener) {
                obj.addEventListener(type, fn, false);
            } else {
                obj.attachEvent(`on${type}`, fn);
            }
        };
        // 移除事件
        Vue.prototype.removeEvent = function (obj, type, fn) {
            if (obj.removeEventListener) {
                obj.removeEventListener(type, fn, false);
            } else {
                obj.detachEvent(`on${type}`, fn);
            }
        };
    }
};

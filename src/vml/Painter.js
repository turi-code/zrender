/**
 * VML Painter.
 *
 * @module zrender/vml/Painter
 */

define(function (require) {

    var zrLog = require('../core/log');
    var vmlCore = require('./core');

    function parseInt10(val) {
        return parseInt(val, 10);
    }

    var VMLPainter = function (root, storage) {

        vmlCore.initVML();

        this.root = root;

        this.storage = storage;

        var vmlRoot = vmlCore.doc.createElement('div');

        var vmlRootStyle = vmlRoot.style;
        vmlRootStyle.cssText = 'display:inline-block;overflow:hidden;position:relative;\
            width:300px;height:150px;';// default size is 300x150 in Gecko and Opera

        this._vmlRoot = vmlRoot;

        this.resize();

        // Modify storage
        var oldDelFromMap = storage.delFromMap;
        var oldAddToMap = storage.addToMap;
        storage.delFromMap = function (elId) {
            var el = storage.get(elId);

            oldDelFromMap.call(storage, elId);

            if (el) {
                var vmlEl = el.__vmlEl;
                if (vmlEl && vmlEl.parentNode) {
                    vmlRoot.removeChild(vmlEl);
                    el.__vmlEl = null;
                }

                el.dispose && el.dispose();
            }
        }

        storage.addToMap = function (el) {
            // Displayable already has a vml node
            var vmlEl = el.__vmlEl;
            if (vmlEl) {
                vmlRoot.appendChild(vmlEl);
            }

            oldAddToMap.call(storage, el);
        }

        this._firstPaint = true;
    };

    VMLPainter.prototype = {

        constructor: VMLPainter,

        refresh: function () {

            var list = this.storage.getDisplayList(true);

            this._paintList(list);
        },

        _paintList: function (list) {
            var vmlRoot = this._vmlRoot;
            var parent = vmlRoot.parentNode;
            for (var i = 0; i < list.length; i++) {
                var displayable = list[i];
                if (displayable.__dirty && !displayable.invisible) {
                    var vmlEl = displayable.brush(vmlRoot);
                    // First creation
                    if (vmlEl && vmlEl.parentNode != vmlRoot) {
                        vmlRoot.appendChild(vmlEl);
                    }
                    displayable.__dirty = false;
                }
            }

            if (this._firstPaint) {
                // Detached from document at first time 
                // to avoid page refreshing too many times

                // FIXME 如果每次都先 removeChild 可能会导致一些填充和描边的效果改变
                this.root.appendChild(vmlRoot);
                this._firstPaint = false;
            }
        },

        resize: function () {
            var width = this._getWidth();
            var height = this._getHeight();

            if (this._width != width && this._height != height) {
                this._width = width;
                this._height = height;

                var vmlRootStyle = this._vmlRoot.style;
                vmlRootStyle.width = width + 'px';
                vmlRootStyle.height = height + 'px';
            }
        },

        dispose: function () {
            this.root.innerHTML = '';

            this._vmlRoot =
            this.storage = null;
        },

        getWidth: function () {
            return this._width;
        },

        getHeight: function () {
            return this._height;
        },

        _getHeight: function () {
            return this._height;
        },

        _getWidth: function () {
            var root = this.root;
            var stl = root.currentStyle;

            return ((root.clientWidth || parseInt10(stl.width))
                    - parseInt10(stl.paddingLeft)
                    - parseInt10(stl.paddingRight)) | 0;
        },

        _getHeight: function () {
            var root = this.root;
            var stl = root.currentStyle;

            return ((root.clientHeight || parseInt10(stl.height))
                    - parseInt10(stl.paddingTop)
                    - parseInt10(stl.paddingBottom)) | 0;
        }
    }

    // Not supported methods
    function createMethodNotSupport(method) {
        return function () {
            zrLog('In IE8.0 VML mode painter not support method "' + method + '"')
        }
    }

    var notSupportedMethods = [
        'getLayer', 'insertLayer', 'eachLayer', 'eachBuildinLayer', 'eachOtherLayer', 'getLayers',
        'modLayer', 'delLayer', 'clearLayer', 'toDataURL', 'pathToImage'
    ];

    for (var i = 0; i < notSupportedMethods.length; i++) {
        var name = notSupportedMethods[i];
        VMLPainter.prototype[name] = createMethodNotSupport(name);
    }

    return VMLPainter;
});
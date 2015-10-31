define(function (require) {

    var graphic = require('../../util/graphic');

    function LineDraw() {
        this.group = new graphic.Group();
    }

    var lineDrawProto = LineDraw.prototype;

    /**
     * @param {module:echarts/data/List} data
     * @param {module:echarts/model/Series} seriesModel
     * @param {module:echarts/ExtensionAPI} api
     * @param {boolean} [enableAnimation=false]
     */
    lineDrawProto.updateData = function (data, seriesModel, api, enableAnimation) {
        var group = this.group;
        var oldData = this._data;

        data.diff(oldData)
            .add(function (idx) {
                var shape = data.getItemLayout(idx);
                if (shape) {
                    var line = new graphic[shape.cpx1 != null ? 'BezierCurve' : 'Line']({
                        shape: shape
                    });

                    data.setItemGraphicEl(idx, line);
                    group.add(line);   
                }
            })
            .update(function (newIdx, oldIdx) {
                var line = oldData.getItemGraphicEl(oldIdx);
                var shape = data.getItemLayout(newIdx);
                if (!shape) {
                    group.remove(line);
                    return;
                }
                if (shape.cpx1 != null && shape.type === 'line') {
                    var oldShape = line.shape;
                    line = new graphic.BezierCurve({
                        shape: oldShape
                    });
                    line.setShape({
                        cpx1: (oldShape.x1 + oldShape.x2) / 2,
                        cpy1: (oldShape.y1 + oldShape.y2) / 2
                    });
                }
                api.updateGraphicEl(line, shape);

                data.setItemGraphicEl(newIdx, line);
                group.add(line);
            })
            .remove(function (idx) {
                group.remove(oldData.getItemGraphicEl(idx));
            })
            .execute();

        this._data = data;

        this.updateVisual();
    };

    lineDrawProto.updateVisual = function () {
        var data = this._data;
        data.eachItemGraphicEl(function (el, idx) {
            var itemModel = data.getItemModel(idx);
            el.setStyle(itemModel.getModel('lineStyle.normal').getLineStyle());
        });
    };

    lineDrawProto.updateLayout = function () {
        var data = this._data;
        data.eachItemGraphicEl(function (el, idx) {
            var points = data.getItemLayout(idx);
            data.setShape({
                x1: points[0][0],
                y1: points[0][1],
                x2: points[1][0],
                y2: points[1][1]
            });
        });
    };



    return LineDraw;
});
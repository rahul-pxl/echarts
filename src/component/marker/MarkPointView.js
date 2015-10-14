define(function (require) {

    var DataSymbol = require('../../chart/helper/DataSymbol');
    var zrUtil = require('zrender/core/util');

    var List = require('../../data/List');

    var markerHelper = require('./markerHelper');

    require('../../echarts').extendComponentView({

        type: 'markPoint',

        init: function () {
            this._dataSymbolMap = {};
        },

        render: function (markPointModel, ecModel) {
            var dataSymbolMap = this._dataSymbolMap;
            for (var name in dataSymbolMap) {
                dataSymbolMap[name].__keep = false;
            }

            ecModel.eachSeries(function (seriesModel) {
                var mpModel = seriesModel.markPointModel;
                mpModel && this._renderSeriesMP(seriesModel, mpModel);
            }, this);

            for (var name in dataSymbolMap) {
                if (!dataSymbolMap[name].__keep) {
                    dataSymbolMap[name].remove();
                    this.group.remove(dataSymbolMap[name].group);
                }
            }
        },

        _renderSeriesMP: function (seriesModel, mpModel) {
            var coordSys = seriesModel.coordinateSystem;
            var seriesName = seriesModel.name;
            var seriesData = seriesModel.getData();

            var dataSymbolMap = this._dataSymbolMap;
            var dataSymbol = dataSymbolMap[seriesName];
            if (!dataSymbol) {
                dataSymbol = dataSymbolMap[seriesName] = new DataSymbol();
            }

            var mpData = createList(coordSys, seriesData, mpModel);
            var dims = mpData.dimensions.slice(0, 2);

            mpData.each(function (idx) {
                var itemModel = mpData.getItemModel(idx);
                var point;
                var xPx = itemModel.getShallow('x');
                var yPx = itemModel.getShallow('y');
                if (xPx != null && yPx != null) {
                    point = [xPx, yPx];
                }
                else {
                    var x = mpData.get(dims[0], idx);
                    var y = mpData.get(dims[1], idx);
                    point = coordSys.dataToPoint([x, y]);
                }

                mpData.setItemLayout(idx, point);

                mpData.setItemVisual(idx, {
                    symbolSize: itemModel.getShallow('symbolSize'),
                    color: itemModel.get('itemStyle.normal.color')
                        || seriesData.getVisual('color'),
                    symbol: itemModel.getShallow('symbol')
                });
            });

            // TODO Text are wrong
            dataSymbol.updateData(mpData, true);

            this.group.add(dataSymbol.group);

            dataSymbol.__keep = true;
        }
    });

    /**
     * @inner
     * @param {module:echarts/coord/*} coordSys
     * @param {module:echarts/data/List} seriesData
     * @param {module:echarts/model/Model} mpModel
     */
    function createList (coordSys, seriesData, mpModel) {
        var baseAxis = coordSys && coordSys.getBaseAxis();
        var valueAxis = coordSys && coordSys.getOtherAxis(baseAxis);
        var dimensions = seriesData.dimensions.slice();
        // Polar and cartesian with category axis may have dimensions inversed
        var dimensionInverse = dimensions[0] === 'y' || dimensions[0] === 'angle';
        if (dimensionInverse) {
            dimensions.inverse();
        }

        var mpData = new List(zrUtil.map(
            dimensions, seriesData.getDimensionInfo, seriesData
        ), mpModel);

        mpData.initData(
            zrUtil.filter(
                zrUtil.map(mpModel.get('data'), zrUtil.curry(
                    markerHelper.dataTransform, seriesData, baseAxis, valueAxis
                )),
                zrUtil.curry(
                    markerHelper.dataFilter, coordSys, dimensionInverse
                )
            )
        );

        return mpData;
    };
});
define(function (require) {
    return function (ecModel) {

        var mapSymbolOffsets = {};

        ecModel.eachSeriesByType('map', function (mapModel) {

            var geo = mapModel.coordinateSystem;

            var data = mapModel.getData();

            data.each('value', function (value, idx) {
                if (isNaN(value)) {
                    return;
                }

                var name = data.getName(idx);
                var region = geo.getRegion(name);

                var offset = mapSymbolOffsets[name] || 0;

                if (!region) {
                    return;
                }
                var point = geo.dataToPoint(
                    region.getCenter()
                );

                mapSymbolOffsets[name] = offset + 1;

                data.setItemLayout(idx, {
                    point: point,
                    offset: offset
                });
            })
        });
    }
});
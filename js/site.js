function generate3WComponent(data, geom) {


    var lookup = genLookup(geom);

    var rowChart = dc.rowChart('#rowchart');
    var carte = dc.leafletChoroplethChart('#map');



    var cf = crossfilter(data);

    var affectedDim = cf.dimension(function (d) {
        return d['#affected'];
    });
    var mapDim = cf.dimension(function (d) {
        return d['#code'];
    });


    var rowChartGroup = affectedDim.group();
    var mapGroup = mapDim.group();


    rowChart.width(400).height(360)
        .dimension(affectedDim)
        .group(rowChartGroup)
        .elasticX(true)
        .colors(["#03a9f4"])
        .colorAccessor(function (d, i) {
            return 0;
        })
        .renderTitle(false)
        .xAxis().ticks(0);

    carte.width($('#map').width()).height(360)
        .dimension(affectedDim)
        .group(mapGroup)
        .center([0, 0])
        .zoom(0)
        .geojson(geom)
        .colors(['#CCCCCC', "#03a9f4", '#3B88C0'])
        .colorDomain([0, 2])
        .colorAccessor(function (d, i) {
            console.log(d['#affected'])
            if (d > 0) {
                return 1;
            } else {
                return 0;
            }
        })
        .featureKeyAccessor(function (feature) {
            return feature.properties["id"];
        }).popup(function (d) {
            return lookup[d.key];
        })
        .renderPopup(true);

    dc.renderAll();

    var map = carte.map();

    zoomToGeom(geom);


    function zoomToGeom(geom) {
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]]);
    }

    function genLookup(geojson) {
        var lookup = {};
        geojson.features.forEach(function (e) {
            lookup[e.properties["id"]] = String(e.properties["name"]);
        });
        return lookup;
    }
}


function hxlProxyToJSON(input) {
    var output = [];
    var keys = []
    input.forEach(function (e, i) {
        if (i == 0) {
            e.forEach(function (e2, i2) {
                var parts = e2.split('+');
                var key = parts[0]
                if (parts.length > 1) {
                    var atts = parts.splice(1, parts.length);
                    atts.sort();
                    atts.forEach(function (att) {
                        key += '+' + att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function (e2, i2) {
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

//load 3W data

var dataCall = $.ajax({
    type: 'GET',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https://docs.google.com/spreadsheets/d/1LFvxJvpmCNozC7x0uX2EzRz_SgzlpStfbiD6BkvpA7A/edit#gid=0&force=on',
    dataType: 'json',
});

//load geometry

var geomCall = $.ajax({
    type: 'GET',
    url: 'data/countries.json',
    dataType: 'json',
});

//when both ready construct 3W

$.when(dataCall, geomCall).then(function (dataArgs, geomArgs) {
    var data = hxlProxyToJSON(dataArgs[0]);
    var geom = geomArgs[0];
    geom.features.forEach(function (e) {
        e.properties["id"] = String(e.properties["id"]);
    });
    generate3WComponent(data, geom);
});

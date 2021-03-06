// Philosopher Map
var map = L.map('map').setView([52, 15.2551], 3.5);

// Remove certain zoom controls
map.zoomControl.remove()
new L.Control.Zoom({ position: 'bottomright' }).addTo(map);
map.touchZoom.disable();
map.scrollWheelZoom.disable();
map.boxZoom.disable();
map.keyboard.disable();

// Set minimum zoom
map.options.minZoom = 2;

// Create and style leaflet map from geojson file
$.ajax({
  dataType: "json",
  url: "static/json/western_countries.json",
  success: function(data) {
    var geoJsonLayer = new L.geoJson(data.features, {
                        style: function(feature) {
                            switch(feature.properties['CONTINENT']) {
                                case 'North America': return {fillColor: '#492D1F',
                                                              fillOpacity: 1,
                                                              weight: 1.2,
                                                              color: '#8eaecc',
                                                              opacity: 1
                                                      };
                                case 'Europe': return {fillColor: '#492D1F',
                                                       fillOpacity: 1,
                                                       weight: 1.2,
                                                       color: '#8eaecc',
                                                       opacity: 1
                                               };
                                default: return {
                                    fillColor: 'none',
                                    fillOpacity: 1,
                                    weight: 1.2,
                                    color: '#492D1F',
                                    opacity: 0.5
                                }
                            }
                        }
    });
    geoJsonLayer.addTo(map);
  }
}).error(function() {});

// Customized leaflet icon
var featherPenIcon = L.icon({
    iconUrl: "static/imgs/feather-pen.png",
    iconSize:     [30, 88],
    iconAnchor:   [0, 88],
    popupAnchor:  [24, -76]
});

// Bar chart global variables
var width = $("#bar-chart").width(),
    height = $("#bar-chart").height()

xScale= d3.scaleLinear()
           .domain([0, 0.6])
           .range([0, width])


// Add current time philosophers onto map
var markers = new Array();
var titles = new Array();
$(function() {
    $("#time-slider").on("change", function() {
        $.getJSON($SCRIPT_ROOT + '/_current_phils', {
            year: $("#time-slider").val()
        }, function(data) {
            var new_markers = new Array();
            data.json_list.forEach(function(phil) {
                var marker = L.marker([phil.latitude, phil.longitude], {icon: featherPenIcon});

                if (markers.indexOf(marker) == -1) {
                    markers.push(marker);
                    map.addLayer(marker);
                    marker.bindPopup("<span class='phil-sum'>" + phil.name + "</span>");
                }
                new_markers.push(marker);
            });

            markers.forEach(function(element) {
                if (new_markers.indexOf(element) == -1) {
                    map.removeLayer(element);
                }
            });
        });
        // Get the top 5 topics for a specific year
        $.getJSON($SCRIPT_ROOT + '/_calculate_topics', {
            year: $("#time-slider").val()
        }, function(data) {
            var topics = data.json_list;
            var probs = [topics.first_prob, topics.second_prob, topics.third_prob,
                         topics.fourth_prob, topics.fifth_prob];
            var currentTitles = [topics.first_title, topics.second_title, topics.third_title,
                          topics.fourth_title, topics.fifth_title];

            var topicInfo = []
            for (i = 0; i < probs.length; i++) {
                topicInfo.push({
                    title: currentTitles[i],
                    prob: probs[i]
                });
            }

            updateBarChart(topicInfo)
        });
    });
});

// Jump to a certain philosopher's time period
$(function() {
    $("input[type='text']").on("keydown", function(k) {
        if (k.keyCode == 13) {
            $.getJSON($SCRIPT_ROOT + '/_jump_to_phil', {
                name: $(this).val()
            }, function(data) {
                $('#time-slider').val(String(data.year)).change()
                $('#time').val(String(data.year)).change()
            })
        }
    });
});

String.prototype.capitalize = function(){
   return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
  };

// Bring up a philosopher summary
$(".leaflet-popup-pane").on("click", function() {
    $("span.phil-sum").on("click", function() {
        var name = $("span.phil-sum").text()
        var modal = $(".modal.philosopher-summary")
        $.getJSON($SCRIPT_ROOT + '/_phil_sum', {
            name: name
        }, function(data) {
            $(".close").on("click", function() {
                modal.fadeOut(1000)
                $(".journey").removeClass("blur")
            });

            modal.click(function(e) {
                if (e.target.class == "wrapper" || $(e.target).parents(".wrapper").size()) {
                    doNothing()
                } else {
                   modal.fadeOut(1000)
                   $(".journey").removeClass("blur")
                }
            });

            $("div.wrapper h1").text(data.name.toLowerCase().capitalize())
            var underscoreName = data.image_path.split("/").pop();
            var imgPath = "/static/imgs/philosophers/" + underscoreName

            $("div.summary img").attr("src", imgPath)
            $("div.summary p#summary").text(data.summary)

            var similar = [data.first_name, data.second_name, data.third_name,
                       data.fourth_name, data.fifth_name]

            var similarLis = d3.select("div.summary ul#similar")
                               .selectAll("li")
                               .data(similar)

            similarLis.text(function(d) { return d.toLowerCase().capitalize() })
            similarLis.enter().append("li")
                      .text(function(d) { return d.toLowerCase().capitalize() })
            similarLis.exit().remove()

            $("div.info p#year-born").text(String(data.year_born))
            $("div.info p#year-died").text(String(data.year_died))

            var topics = [data.first_topic, data.second_topic]
            var topicLis = d3.select("div.info ul#topics")
                             .selectAll("li")
                             .data(topics)

            topicLis.text(function(d) { return d })
            topicLis.enter().append("li")
                    .text(function (d) { return d })
            topicLis.exit().remove()

            var docs = d3.select("div.info ul#documents")
                         .selectAll("li")
                         .data(data.documents)

            docs.html(function(d) { return "<a href='" + d.url + "' target='_blank'>" + d.title +
                                    " (" + d.year + ")</a>"})
            docs.enter().append("li")
                .html(function(d) { return "<a href='" + d.url + "' target='_blank'>" + d.title +
                                           " (" + d.year + ")</a>"})
            docs.exit().remove()

            modal.fadeIn(1000, function() {
                $(".journey").addClass("blur")
            });
        });
    })
});

function updateBarChart(currentInfo) {
    var bars = d3.select("#bar-chart")
                 .selectAll(".bar")
                 .data(currentInfo)

    var h2s = d3.select("#bar-chart")
                .selectAll("h2")
                .data(currentInfo)

    var h1s = d3.select("#bar-chart")
                .selectAll("h1")
                .data(currentInfo)

    bars.transition()
        .style("width", function(d) { return String(xScale(d.prob)) + "px"; });

    bars.enter().append("div")
        .attr("class", "bar")
        .transition()
        .style("width", function(d) { return String(xScale(d.prob)) + "px"; })

    bars.exit().remove()

    h2s.transition()
       .text(function(d) { return d.title; });

    h2s.enter().append("h2")
       .transition()
       .text(function(d) { return d.title; })

    h2s.exit().remove()

    h1s.transition()
       .text(function(d) { return String(Math.round(d.prob * 100)) + "%"; });

    h1s.enter().append("h1")
       .transition()
       .text(function(d) { return String(Math.round(d.prob * 100)) + "%"; })

    h1s.exit().remove()

}

function doNothing() {
    return
}

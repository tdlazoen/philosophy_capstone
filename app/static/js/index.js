// Ensure user always begins at top of page
$(window).load(function() {
    $(this).scrollTop()
    $("#home h1:nth-of-type(1)").fadeIn(1000, function() {
        $("#home h1:nth-of-type(2)").fadeIn(1000, function() {
            $("a.begin").fadeIn(1000)
        });
    });
    $("div#howto").show(function() {
        $("#map, #topic-bars, output, .more-info").addClass("blur")
        $("div.search-bar, div.controls").addClass("extra-focus")

        $(this).click(function(e) {
            e.preventDefault()
            $("#map, #topic-bars, output, .more-info").removeClass("blur")
            $("div.search-bar, div.controls").removeClass("extra-focus")
            $(this).fadeOut(1000)
        });
    });
    $("#time-slider").val("1597").change();

});

// Scroll to story section from home page
$(".page-scroll").click(function(e) {
    e.preventDefault();
    var section = $(this).attr("href");
    $("html, body").animate({
        scrollTop: $(section).offset().top
    }, 1100);
});

$("#time-slider").click(function(e) {
    e.preventDefault()
    var value = $(this).val();
    $(this).val(value).change();
    $("#time").val(value).change();
    clearIntervals(intervalIds)
    cancelAnimationFrame(requestAnimationReference)
})

$("#time-slider").on("change", function(e) {
    e.preventDefault();
    var value = $(this).val();
    $("div#topic-bars #header").text("Top 5 Topics for " + String(value))
});

var intervalIds = [],
    starttime,
    requestAnimationReference;

window.requestAnimationFrame = window.requestAnimationFrame
                               || window.mozRequestAnimationFrame
                               || window.webkitRequestAnimationFrame
                               || window.msRequestAnimationFrame;

window.cancelAnimationFrame = window.cancelAnimationFrame
                              || window.mozCancelAnimationFrame

// Move slider when play is pressed
$("#play").click(function(e) {
    e.preventDefault();
    clearIntervals(intervalIds);
    var slider = $("#time-slider");
    var output = $("#time");
    var value = $("#time-slider").val();
    var oldValue = Math.floor(value)
    var dist = 2001 - Math.floor(value);
    var duration = 150000 - (300 * (404 - dist))
    requestAnimationReference = requestAnimationFrame(function(timestamp) {
                                        starttime = timestamp
                                        playSmoothly(timestamp, slider, output, dist, value, oldValue, duration)
                                });
});

$("#pause").click(function(e) {
    clearIntervals(intervalIds);
    cancelAnimationFrame(requestAnimationReference)
});

$("#rewind").mousedown(function(e) {
    cancelAnimationFrame(requestAnimationReference)
    e.preventDefault();
    intervalIds.push(
        iterateSlider(1597, 2001, add=false)
    );
}).bind('mouseup mouseleave', function() {
    clearIntervals(intervalIds)
});

$("#stop").click(function(e) {
    e.preventDefault();
    clearIntervals(intervalIds)
    cancelAnimationFrame(requestAnimationReference)
    $("#time-slider").val("1597").change()
    $("#time").val("1597").change()
    markers.forEach(function(marker) {
        map.removeLayer(marker);
    });
});

// Show info on how to use app
$("#question").click(function(e) {
    e.preventDefault()
    $("#map, #topic-bars, output, .more-info").addClass("blur")
    $("div.search-bar, div.controls").addClass("extra-focus")

    $("#howto").fadeIn(1000, function() {
        $(this).click(function(e) {
            e.preventDefault()
            $("#map, #topic-bars, output, .more-info").removeClass("blur")
            $("div.search-bar, div.controls").removeClass("extra-focus")
            $(this).fadeOut(1000)
        });
    });
});

function clearIntervals(obj) {
    obj.forEach(function(element) {
        clearInterval(element);
    });
}

function iterateSlider(min, max, add=true) {
    id = setInterval(function() {
        var value = $("#time-slider").val();
        if (add === true) {
            var intVal = Math.floor(value) + 1;
        }
        else {
            var intVal = Math.floor(value) - 1
        }

        if (intVal >= max) {
            intVal = String(max);
            clearIntervals(intervalIds);
        }
        else if (intVal <= min) {
            intVal = String(min);
            clearIntervals(intervalIds);
        };
        $("#time-slider").val(String(intVal)).change();
        $("#time").val(String(intVal)).change();
    }, 10);
    return id
}

function playSmoothly(timestamp, el, el2, dist, start, oldValue, duration) {
    var timestamp = timestamp;
    var runtime = timestamp - starttime;
    var progress = runtime / duration;

    progress = Math.min(progress, 1);
    var value = Math.floor((progress * dist) + Math.floor(start))

    if (value - oldValue >= 1) {
        el.val(String(value)).change();
        el2.val(String(value)).change();
        oldValue = value
    }

    if (progress < 1) {
        requestAnimationReference = requestAnimationFrame(function(timestamp) {
                                        playSmoothly(timestamp, el, el2, dist, start, oldValue, duration)
                                    });
    }
}

function outputUpdate(val) {
  if (val > 2001) {
      val = 2001;
  }
  else if (val < 1597) {
      val = 1597;
  };
  $("#time").val(val).change()
}

(function(){
	var thousandsLocale = {"thousands": "\xa0"}
	var locale = {
	"dateTime": "%A %e %B %Y",
	"date": "%d/%m/%Y",
	"time": "%H:%M:%S",
	"periods": ["AM", "PM"],
	"days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
	"shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
	"months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
	"shortMonths": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
}
	d3.timeFormatDefaultLocale(locale);
	// var numberFormat = d3.locale(thousandsLocale);
	// console.log(numberFormat(50000));
	var locale = d3.formatLocale({
	  decimal: ",",
	  thousands: " ",
	  grouping: [3]
	});
	var format = locale.format(",d");
	console.log(format(20000), format(1000))

	var format = d3.timeFormat("%c");

	var animTimeout;
	var dateCounter = 0;
	var availableDates = [];

	var margin = {top: 0, right: 10, bottom: 10, left: 10};

	var width = 1500 - margin.left - margin.right,
	height = 600 - margin.top - margin.bottom;

	var projection = d3.geoRobinson().scale(190).center([0, 12]);

	var path = d3.geoPath()
		.projection(projection);

  // Add zoom: https://github.com/d3/d3-zoom
	// Example implementation: https://bl.ocks.org/d3noob/e549dc220052ac8214b9db6ce47d2a61


		// .call(zoom)

	Promise.all([d3.json("data/world_countries.json"), d3.csv("data/time-series.csv?UPDATE")]).then( function (data) {
		var geodata = data[0];
		var data = data[1];

		data.forEach(function(d) {
			if( availableDates.indexOf( d['timestamp'] ) == -1 ){
				availableDates.push( d['timestamp'] );
			}
			d.n = +d.Confirmed;
		});
		availableDates.sort();

		var svg = d3.select("#map").append("svg")
			.append("g")
			.attr('id', 'container');


    svg.append('g')
      .attr('class', 'countries')
      .selectAll('path')
      .data(geodata.features)
      .enter().append('path')
        .attr('d', path)
				.style('fill', '#888')
        .style('stroke', 'white')
        .style('opacity', 1)
        .style('stroke-width', 0.3);

		/*
		Date picker
		*/
		var slider = $("#range_slider").ionRangeSlider({
				// skin: "flat",
				values: availableDates,
				prettify: function(d){ console.log(d); return d},
				onChange: function(data){
					update_date( data.from_value );
				}
		});

		function update_date(timestamp) {
			// TODO: change this (dirty)
			svg.selectAll(".circles").remove();

			var circles = svg
		    .selectAll(".circles")
		    .data(data.filter(function(d){ return d.timestamp == timestamp}).filter(function(d){ return d.Confirmed > 0}).sort(function(a,b) { return +b.n - +a.n }));

				var circleEnter = circles
		    .enter()
				.append("g")
				.attr("class", "circles");

				circleEnter
		    .append("circle")
					.attr("class", "circle")
		      .attr("cx", function(d){ return projection([+d.lng, +d.lat])[0] })
		      .attr("cy", function(d){ return projection([+d.lng, +d.lat])[1] })
		      .attr("r", function(d){ return size(+d.n) })
		      .style("fill", function(d){ return '#C32E1E' })
		      .attr("fill-opacity", 0.5)
					.on("click", function(d) {
						d3.event.preventDefault();
						displayDetail(d);
					})
					.on("mouseover", function(d) {
						displayDetail(d);
					});

			circles.select("circle")
			.transition()
			.duration(150)
			.attr("r", function(d){ return size(+d.n) })
			.style("fill", function(d){ return '#C32E1E' });

			circles.exit()
          .remove();
		}

		// Bubble size
	  var valueExtent = d3.extent(data, function(d) { return +d.n; })
	  var size = d3.scalePow() // previously: d3.scaleSqrt()
			.exponent(1/3)
	    .domain(valueExtent)
	    .range([ 3, 40 ]) // Size in pixel

			// Legend: from Bubblemap Template by Yan Holtz
			// https://www.d3-graph-gallery.com/graph/bubble_legend.html
			// https://www.d3-graph-gallery.com/graph/bubblemap_template.html
			var valuesToShow = [1, 1000, 10000, 50000]
			var xCircle = 80
			var xLabel = xCircle + 100;
			var yCircle = height * 0.75;

			svg
			  .selectAll("legend")
			  .data(valuesToShow)
			  .enter()
			  .append("circle")
			    .attr("cx", xCircle)
			    .attr("cy", function(d){ return yCircle - size(d) } )
			    .attr("r", function(d){ return size(d) })
			    .style("fill", "none")
			    .attr("stroke", "black")

			// Add legend: segments
			svg
			  .selectAll("legend")
			  .data(valuesToShow)
			  .enter()
			  .append("line")
			    .attr('x1', function(d){ return xCircle + size(d) } )
			    .attr('x2', xLabel)
			    .attr('y1', function(d){ return yCircle - size(d) } )
			    .attr('y2', function(d){ return yCircle - size(d) } )
			    .attr('stroke', 'black')
			    .style('stroke-dasharray', ('2,2'))

			// Add legend: labels
			svg
			  .selectAll("legend")
			  .data(valuesToShow)
			  .enter()
			  .append("text")
			    .attr('x', xLabel)
			    .attr('y', function(d){ return yCircle - size(d) } )
			    .text( function(d){ return d + ' cas' } )
			    .style("font-size", 12)
			    .attr('alignment-baseline', 'middle')

			// right details panel (mobile devices: bottom)
			function displayDetail(d) {
				d3.select(".map-details")
				.html(function() {
					var location = d['country'];
					if(d['Province/State']){
						location += ', ' + d['Province/State']
					}

					// <p><span class="stats">Dernière mise à jour</span> ${d['Last Update']}</p>
					// -> parse and convert time
// <p><span class="stats">Décès</span> ${d.Deaths}</p>
// <p><span class="stats">Rétablissements</span> ${d.Recovered}</p>

					return `<h4>${location}</h4>
						<p><span class="stats">Cas confirmés cumulés</span> ${d.Confirmed}</p>
						<p><span class="stats">Guérisons</span> ${d.recovered}</p>
						<p><span class="stats">Décès</span> ${d.deaths}</p>
						<p><span class="stats">Infections encore existantes</span> ${d.existing}</p>
						<p><span class="stats">Date</span> ${d.timestamp}</p>

					`;})
					.style('opacity', 1);
				}

				function sizeChange() {
					// TODO adapter pour version embed
					d3.select("g#container").attr("transform", "scale(" + $("#map").width() / 1000 + ")");
					$("#map svg").height($("#map").width()*0.5);
				}


				d3.select(window)
					.on("resize", sizeChange);

				sizeChange();

				function runAnimation(){

					$('.filter-container, .irs-with-grid, .irs, #range_slider').click(function(){
						$('.play').removeClass('pause');
						clearTimeout(animTimeout);
					});

					// doc: http://ionden.com/a/plugins/ion.rangeSlider/demo_interactions.html
					var slider_instance = $("#range_slider").data("ionRangeSlider");

					slider_instance.update({
						from: dateCounter
					});
					update_date( availableDates[dateCounter] );

					dateCounter += 1;
					if(dateCounter < availableDates.length){
						animTimeout = setTimeout(runAnimation, 200);
					}else{
						dateCounter = 0;
						$('.play').removeClass('pause');
					}
				}

				// TODO: on scroll
				// animTimeout = setTimeout(runAnimation, 500)

				$('.play').click(function(){
					if($(this).hasClass('pause')){
						console.log('Clear timeout');
						clearTimeout(animTimeout);
						$(this).removeClass('pause')
					}else{
						animTimeout = setTimeout(runAnimation, 200);
						$(this).addClass('pause')
					}
				});

				var worldMapScene = new ScrollMagic.Scene({triggerElement: "#map", duration: 300})
					.addTo(controller)
					.addIndicators({'name': 'animated map'}) // debug
					.on("enter", function(){
						// on commence tranquille
						runAnimation();
					})
					.on("leave", function(event){
						clearTimeout(animTimeout);
					});

				/*var zoom = d3.zoom()
			      .scaleExtent([1, 8])
			      .on('zoom', function() {
			          svg.selectAll('path')
			           .attr('transform', d3.event.transform);
			});
			svg.call(zoom);*/

				/*
					c3js graph also enables date picking
				*/

				var lastIndex;
				var chart = c3.generate({
					padding: {
						right: 30,
    			},
					size: {
						height: 200
					},
					bindto: "#time-serie-chart",

					data: {
						url: 'data/linegraphs-c3.csv?UPDATE',
						type: 'line',
						x: 'timestamp',
						colors: {
							'Infections confirmées': '#930025',
							'Guérisons': '#4E8054'
						}
					},
					axis: {
						x: {
							type: 'timeseries',
							tick: {
								format: '%d.%m.%Y',
								count: 4
							},
						},
						y: {
							tick: {
								values: [0, 100000, 200000, 300000],
								// format: d3.format(".0s")
							}
						}
					},
					grid: {
						y: {
							lines: [
								{ value: 0},
								{ value: 100000},
								{ value: 200000},
								{ value: 300000}
							]
						}
					},
					tooltip: {
						format: {
							value: function (value, ratio, id, index) {
								if (index != lastIndex) {
									// TODO use value here
									if (index < availableDates.length){
										update_date(availableDates[index]);
										var $slider = $("#range_slider");
										$slider.data("ionRangeSlider").update({
											from: index
										});

										clearTimeout(animTimeout);
										$('.pause').removeClass('pause')
									}
									lastIndex = index;
								}
								return value;
							}
						}
					}
				}); // end c3js graph
	});
})();

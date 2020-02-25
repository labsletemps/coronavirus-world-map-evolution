(function(){
	var animTimeout;

	var filters = {
		// 'date': '2020-01-22',
		'date': '2020-02-23',
	}
	var dateCounter = 0;
	var availableDates = ['2020-01-22',
'2020-01-23',
'2020-01-24',
'2020-01-25',
'2020-01-26',
'2020-01-27',
'2020-01-28',
'2020-01-29',
'2020-01-30',
'2020-01-31',
'2020-02-01',
'2020-02-02',
'2020-02-03',
'2020-02-04',
'2020-02-05',
'2020-02-06',
'2020-02-07',
'2020-02-08',
'2020-02-09',
'2020-02-10',
'2020-02-11',
'2020-02-12',
'2020-02-13',
'2020-02-14',
'2020-02-15',
'2020-02-16',
'2020-02-17',
'2020-02-18',
'2020-02-19',
'2020-02-20',
'2020-02-21',
'2020-02-22',
'2020-02-23',
'2020-02-24'];

	var margin = {top: 0, right: 10, bottom: 10, left: 10};

	var width = 1500 - margin.left - margin.right,
	height = 760 - margin.top - margin.bottom;

	var projection = d3.geoRobinson().scale(160);

	var path = d3.geoPath()
	.projection(projection);

	Promise.all([d3.json("data/world_countries.json"), d3.csv("data/time-series.csv?3")]).then( function (data) {
		var geodata = data[0];
		var data = data[1];

		
		data.forEach(function(d) {
			d.n = +d.Confirmed;
			d.ts = +d.ts;
		});

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
			Create Range Slider
		*/
		// pour dates plus precises
		var lang = "fr-FR";
		var year = 2018;

		function dateToTS (date) {
				return date.valueOf();
		}

		function tsToISO (ts) {
			return (new Date(ts)).toISOString().split('T')[0]
		}

		function tsToDate (ts) {
				var d = Date.parse(ts);

				// On affiche les dates en français
				return d.toLocaleDateString(lang, {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
				});
		}

		// var marks = [new Date(1582412400000)];
		//
		// function addMarks($slider) {
		//         var html = '';
		//         var left = 0;
		//         var left_p = "";
		//         var i;
		//
		//         for (i = 0; i < marks.length; i++) {
		//             left = convertToPercent(marks[i]);
		//             left_p = left + "%";
		//             html += '<span class="showcase__mark" style="left: ' + left_p + '">';
		//             html += marks[i];
		//             html += '</span>';
		//         }
		//
		//         $slider.append(html);
		//     }

		var slider = $("#range_slider").ionRangeSlider({
				// type: "double",
				// skin: "flat",
				// grid: true,
				// grid_num: 4,
				values: availableDates,
				// prettify: tsToDate,
				onChange: function(data){
					update_date( data.from_value );
				}
		});

		/* FILTRES */

		function applyFilters(d){
			if(filters['date']){
				// console.log(d.ts, filters['date']['timestamp'], d.ts == filters['date']['timestamp'])
				if(d.timestamp != filters['date']){
					return 0;
				}else{
					console.log('true')
				}
			}
			if(filters['genre']){
				console.log('filter by genre');
				if(d.gender != filters['genre']){
					return 0;
				}
			}
			return 1;
		}

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
		  // circles.exit().remove();
		}
		// FILTER UPDATES
		// for a given year
		function update_datex(timestamp){
			filters['date'] = timestamp;

			circle
			.data(data.filter(function(d){ return d.timestamp == timestamp}))
				.transition()
				.duration(200)
				.style('opacity', function(d){
					return applyFilters(d);
				});
		}




		// Bubble size
	  var valueExtent = d3.extent(data, function(d) { return +d.n; })
	  var size = d3.scalePow() // previously: d3.scaleSqrt()
			.exponent(1/3)
	    .domain(valueExtent)
	    .range([ 3, 50]) // Size in pixel

		/*var circle = svg
			.selectAll("circles")
			.data(data.sort(function(a,b) { return +b.n - +a.n }))
			.enter()
			.append("circle")
				.attr("class", "circle")
				.attr("cx", function(d){ return projection([+d.lng, +d.lat])[0] })
				.attr("cy", function(d){ return projection([+d.lng, +d.lat])[1] })
				.attr("r", function(d){ return size(+d.n) })
				.style("fill", function(d){ return '#C32E1E' })
				.attr("opacity", applyFilters)
				.attr("fill-opacity", 0.5)
				.on("click", function(d) {
					d3.event.preventDefault();
					displayDetail(d);
				})
				.on("mouseover", function(d) {
					displayDetail(d);
				});*/

			// Exit Doc: https://www.d3indepth.com/enterexit/
			// circle.exit().remove();


			// Legend: from Bubblemap Template by Yan Holtz
			// https://www.d3-graph-gallery.com/graph/bubble_legend.html
			// https://www.d3-graph-gallery.com/graph/bubblemap_template.html
			var valuesToShow = [1, 1000, 10000, 50000]
			var xCircle = 80
			var xLabel = xCircle + 100;
			var yCircle = height / 2;

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
					var $d5 = $("#range_slider");

					$('.filter-container, .irs-with-grid, .irs, #range_slider').click(function(){
						$('.play').removeClass('pause');
						clearTimeout(animTimeout);
					})

					// doc: http://ionden.com/a/plugins/ion.rangeSlider/demo_interactions.html
					var d5_instance = $d5.data("ionRangeSlider");

					d5_instance.update({
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

				animTimeout = setTimeout(runAnimation, 500)

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

				/*
					c3js graph also enables date picking
				*/

				var lastIndex;
				var chart = c3.generate({
					size: {
						height: 200
					},
					bindto: "#time-serie-chart",

					data: {
						url: 'data/linegraphs-c3.csv',
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
								count: 6
							},
						},
						y: {
							tick: {
								values: [0, 40000, 80000]
							}
						}
					},
					grid: {
						/*x: {
							lines: [
								{value: '2020-02-13', text: 'Nouvelle mesure'}
							]
						},*/
						y: {
							lines: [
								{ value: 0},
								{ value: 40000},
								{ value: 80000},
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
										var $d5 = $("#range_slider");
										$d5.data("ionRangeSlider").update({
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

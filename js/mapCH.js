(function(){
	var playedCH = false;
	var showAbsoluteValues = false;

	var current_timestamp = '2020-03-07';

	var thousandsLocale = {"thousands": "\xa0"}
	var timeLocale = {
		"dateTime": "%A %e %B %Y",
		"date": "%d/%m/%Y",
		"time": "%H:%M:%S",
		"periods": ["AM", "PM"],
		"days": ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
		"shortDays": ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
		"months": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
		"shortMonths": ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
	}
	d3.timeFormatDefaultLocale(timeLocale);

	var locale = d3.formatLocale({
	  decimal: ",",
	  thousands: " ",
	  grouping: [3]
	});
	var format = locale.format(",d");

	var timeFormat = d3.timeFormat("%c");

	var animTimeoutCH;
	var dateCounter = 0;
	var availableDates = [];
	var selectedDates = [
		'2020-02-24',
		'2020-03-05',
		'2020-03-07',
		'2020-03-17', // VD > 1000 cas (précédents chiffres: se produisait le 19 mars)
		'2020-03-21', // ZH (précédents chiffres: 23 mars)
		'2020-07-21', // GE devant le Tessin en valeurs relatives
	];
	var explainLabels = new Map();

	explainLabels.set('2020-02-24',
		[{'dx': 100, 'dy': 80, 'canton': 'TI', 'label': 'Premier cas confirmé au Tessin: un septuagénaire a été infecté en Italie', 'title': '24 février', 'lat': 46.331734, 'lng': 8.8004529}
	]);

	explainLabels.set('2020-03-05', [
		{'dx': -10, 'dy': -100, 'canton': 'VD', 'label': 'Premier décès en Suisse, au CHUV', 'title': '5 mars', 'lat': 46.5613135, 'lng': 6.536765},
	]);
	explainLabels.set('2020-03-07', [
		{'dx': 300, 'dy': 10, 'canton': 'ZH', 'label': 'Zurich compte 36 cas cumulés', 'title': '7 mars', 'lat': 47.3768866, 'lng': 8.541694}
	]);

	explainLabels.set('2020-03-17',
		[{'dx': -10, 'dy': -90, 'canton': 'VD', 'label': 'Vaud dépasse 1000 cas confirmés', 'title': '17 mars', 'lat': 46.5613135, 'lng': 6.536765}]
	);

	explainLabels.set('2020-03-21',
		[{'dx': 300, 'dy': 10, 'canton': 'ZH', 'label': '1000e cas confirmé à Zurich', 'title': '23 mars', 'lat': 47.3768866, 'lng': 8.541694}]
	);

	explainLabels.set('2020-07-21',
		[{'dx': 60, 'dy': 20, 'canton': 'GE', 'label': 'Plusieurs jours d’affilée, Genève compte plus de 20 cas quotidiens', 'title': 'Juillet', 'lat': 46.2043907, 'lng': 6.1431577}]
	);

	var margin = {top: 0, right: 10, bottom: 10, left: 10};

	var width = 1500 - margin.left - margin.right,
	height = 800 - margin.top - margin.bottom;

	var projection = d3.geoMercator()
	    .center([9.4, 46.65])
	    .scale(12000)
	    .translate([ width/2, height/2 ]);
	var dataById = d3.map();

	Promise.all([d3.json("data/cantons-1k.json"), d3.csv("data/covid19_cases_ch.csv?UPDATE")]).then(function(data) {
		var geodata = data[0];
		var data = data[1];


		data.forEach(function(d) {
			d.no = +d.no;
			d.confirmed_daily = +d.confirmed_daily;
			d.confirmed_sum = +d.confirmed_sum;
			d.n = +d.n;
			d.daily_rate = +d.daily_rate;
			d.sum_rate = +d.sum_rate;
			if( availableDates.indexOf( d['date'] ) == -1 ){
				availableDates.push( d['date'] );
			}
			dataById.set(d.no, d);
		});

		var valueExtent = d3.extent(data, function(d) { return +d.daily_rate; })
		var colorScale = d3.scaleSqrt()
		.domain(valueExtent)
		.range(["#27751D", "#C22E1D"]);

		availableDates.sort();

		var svg = d3.select("#mapCH").append("svg")
			.append("g")
			.attr('id', 'containerCH');

		svg.append("g")
			.attr('class', 'cantons')
			.selectAll("path")
			.data( topojson.feature(geodata, geodata.objects.cantons).features )
			.enter()
			.append("path")
			.style('fill', function(d){
				if(showAbsoluteValues){
					return '#888';
				}else{
					var rows = data.filter(function(e){ return (e.no == d.properties.KANTONSNUM && e.timestamp == current_timestamp)} );
					if(rows.length > 0){
						return colorScale(rows[0].daily_rate);
					}else{
						console.log('Error for', d.properties.KANTONSNUM)
						return '#ccc';
					}

				}
			})
			.attr("d", d3.geoPath()
					.projection(projection)
			)
			.style("stroke", "#fff")
			.style('stroke-width', 0.3)
			.on('mouseover', function(d) {
				d3.select(this).style('stroke-width', 1.5);
			 	d3.event.preventDefault();
				var d2 = data.filter(function(e){ return (e.no == d.properties.KANTONSNUM && e.timestamp == current_timestamp)} )[0];
			 	displayDetail(d2);
			 }).on('mouseout', function(d) {
			 	d3.select(this).style('stroke-width', 0.3);
			 }).on("click", function(d) {
				var d2 = data.filter(function(e){ return (e.no == d.properties.KANTONSNUM && e.timestamp == current_timestamp)} )[0];
			 	displayDetail(d2);
			 });


			function update_date(timestamp) {
				current_timestamp = timestamp;

				svg.selectAll(".textLabels, .annotation-group").remove();

				if(explainLabels.has(timestamp)){
					$.each(explainLabels.get(timestamp), function(i, item){
						annotate(item);
					});
				}



				// svg.selectAll(".textLabels").remove();
				// svg.selectAll(".textLabels").remove();

				var cantons = svg.selectAll(".cantons path")
		      .transition().duration(200)
		      .style("fill", function(d){
						if(showAbsoluteValues){
							return '#888';
						}else{
							return colorScale(data.filter(function(e){ return (e.no == d.properties.KANTONSNUM && e.timestamp == current_timestamp)} )[0].daily_rate);
						}
					});

				if(showAbsoluteValues){
					// TODO: change this (dirty)
					svg.selectAll(".circles").remove();

					var circles = svg
						.selectAll(".circles")
						.data(data.filter(function(d){ return d.timestamp == timestamp}).filter(function(d){ return d.n > 0}).sort(function(a,b) { return +b.n - +a.n }));

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
							.style("fill", function(d){ return d.status == '' ? '#C32E1E' : '#f5670c' })
							.attr("fill-opacity", function(d){ return d.status == '' ? 0.5 : 0.3} )
							.on("click", function(d) {
								d3.event.preventDefault();
								displayDetail(d);
							})
							.on("mouseover", function(d) {
								displayDetail(d);
							});

							var textGroup = circleEnter.append("g")
								.attr("class", "textLabels")
							    .attr("transform", function(d, i) { return "translate(" + projection([+d.lng, +d.lat])[0] + "," + projection([+d.lng, +d.lat])[1] + ")"; })
									.on("click", function(d) {
										d3.event.preventDefault();
										displayDetail(d);
									})
									.on("mouseover", function(d) {
										displayDetail(d);
									});

							textGroup.append("rect")
							    .attr("width", 80)
							    .attr("height", 40)
									.attr("x", -40)
									.attr("y", -15)
									.attr("rx", 3)
									.attr("ry", 3)
									.attr("fill", "#fff")
									.attr("fill-opacity", 0.3);

							textGroup.append("text")
								.attr("text-anchor", "middle")
							    .text(function(d) { return 'Cas: ' + d.n; });
							textGroup.append("text")
								.attr("text-anchor", "middle")
								.attr("dy", 20)
							    .text(function(d) { return 'Taux: ' + d.daily_rate; });

					textGroup.select("text")
					.transition()
					.duration(150);

					textGroup.exit()
							.remove();
				} else {

					// dry: tomorrow
					var textLabels = svg
					.selectAll(".textLabels")
					.data( data.filter(function(d){ return (d.timestamp == timestamp && d.n > 0)}) );

					var textEnter = textLabels
						.enter()
						.append("g")
						.attr("class", "textLabels");

					var textGroup = textEnter.append("g")
							.attr("transform", function(d, i) { return "translate(" + projection([+d.lng, +d.lat])[0] + "," + projection([+d.lng, +d.lat])[1] + ")"; })
							.on("click", function(d) {
								d3.event.preventDefault();
								displayDetail(d);
							})
							.on("mouseover", function(d) {
								displayDetail(d);
							});

					textGroup.append("rect")
							.attr("width", 80)
							.attr("height", 40)
							.attr("x", -40)
							.attr("y", -15)
							.attr("rx", 3)
							.attr("ry", 3)
							.attr("fill", "#fff")
							.attr("fill-opacity", 0.5);

					textGroup.append("text")
						.attr("text-anchor", "middle")
							.text(function(d) { return 'Cas: ' + d.n; });
					textGroup.append("text")
						.attr("text-anchor", "middle")
						.attr("dy", 20)
							.text(function(d) { return 'Taux: ' + d.daily_rate; });

					textGroup.select("circle")
					.transition()
					.duration(150)
					.attr("r", function(d){ return size(+d.n) })
					.style("fill", function(d){ return '#C32E1E' });

					textGroup.exit()
							.remove();
				}

			}


			// Bubble size
			var valueExtent = d3.extent(data, function(d) { return +d.n; })
			var size = d3.scaleSqrt()
				.domain(valueExtent)
				.range([ 3, 60 ]) // Size in pixel


				// legends
				if(!showAbsoluteValues){
					var labels = [0.1, 0.5, 1.0, 5.0, 10.0]
					var size_l = 20
					var distance_from_top = height * 0.2;
					// Legend title
					svg
						.append("text")
							.style("fill", "black")
							.attr("x", 20)
							.attr("y", distance_from_top - labels.length*(size_l+5) + (size_l/2))
							.attr("width", 90)
							.text("Nouveaux cas pour 100 000 habitants")
							.style('font-size', '16px')

					// Add one dot in the legend for each name.

					svg.selectAll("mydots")
						.data(labels)
						.enter()
						.append("rect")
							.attr("x", 20)
							.attr("y", function(d,i){ return distance_from_top - i*(size_l+5)}) // 100 is where the first dot appears. 25 is the distance between dots
							.attr("width", size_l)
							.attr("height", size_l)
							.style("fill", function(d){ return colorScale(d)})

					// Add one dot in the legend for each name.
					svg.selectAll("mylabels")
						.data(labels)
						.enter()
						.append("text")
							.attr("x", 20 + size_l*1.2)
							.attr("y", function(d,i){ return distance_from_top - i*(size_l+5) + (size_l/2)}) // 100 is where the first dot appears. 25 is the distance between dots
							.style("fill", '#000')
							.text(function(d){ return d + (d == 800 ? ' et plus' : '')})
							.attr("text-anchor", "left")
							.style("alignment-baseline", "middle")

				}else{
						// Legend: from Bubblemap Template by Yan Holtz
						// https://www.d3-graph-gallery.com/graph/bubble_legend.html
						// https://www.d3-graph-gallery.com/graph/bubblemap_template.html
						var valuesToShow = [200, 800, 1600]
						var xCircle = 80
						var xLabel = xCircle + 100;
						var yCircle = height * 0.2;

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
							}

		// right details panel (mobile devices: bottom)
		function displayDetail(d) {
			d3.select(".map-details-CH")
			.html(function() {
				// var location = d['country'];
				// if(d['Province/State']){
				// 	location += ', ' + d['Province/State']

				var addendum = '';
				if(d.status != ''){
					addendum = '<p><span class="stats">Pas de données pour cette date:</span> les données du jour précédent sont indiquées</p>';
				}
				return `<h4>${d.name}</h4>
					<p><span class="stats">Nouveaux cas:</span> ${parseInt( d.confirmed_daily )}</p>
					<p><span class="stats">Taux pour 100 000 habitants:</span> ${d.daily_rate}</p>
					<p><span class="stats">Cas confirmés cumulés:</span> ${parseInt( d.confirmed_sum )}</p>
					<p><span class="stats">Taux pour 100 000 habitants:</span> ${d.sum_rate} (soit ${d.sum_perc}%)</p>
					${addendum}
					<p><span class="stats">Date:</span> ${ timeFormat( new Date(d.timestamp) ) }</p>

				`;})
				.style('opacity', 1);
			}

		/*
		Date picker
		*/
		var slider = $("#range_sliderCH").ionRangeSlider({
				// skin: "flat",
				values: availableDates,
				prettify: function(d){ return d},
				onChange: function(data){
					// TODO: find nearest
					// dateCounter = availableDates.indexOf(data.from_value);
					update_date( data.from_value );
				}
		});

		function sizeChange() {
			// TODO adapter pour version embed
			d3.select("g#containerCH").attr("transform", "scale(" + $("#mapCH").width() / 1000 + ")");
			$("#mapCH svg").height($("#mapCH").width()*0.7);
		}


		d3.select(window)
			.on("resize", sizeChange);

		sizeChange();

		// animate
		function runAnimation(){
			// doc: http://ionden.com/a/plugins/ion.rangeSlider/demo_interactions.html
			var slider_instance = $("#range_sliderCH").data("ionRangeSlider");

			slider_instance.update({
				from: availableDates.indexOf(selectedDates[dateCounter])
			});
			update_date( selectedDates[dateCounter] );

			dateCounter += 1;
			if(dateCounter < selectedDates.length){
				animTimeoutCH = setTimeout(runAnimation, 2000);
			}else{
				playedCH = true;
				dateCounter = 0;
				$('.play-ch').removeClass('pause-ch');
			}
		}

		// TODO: on scroll
		// animTimeoutCH = setTimeout(runAnimation, 500)

		$('.play-ch').click(function(){
			if($(this).hasClass('pause-ch')){
				clearTimeout(animTimeoutCH);
				$(this).removeClass('pause-ch')
			}else{
				animTimeoutCH = setTimeout(runAnimation, 200);
				$(this).addClass('pause-ch')
			}
		});

		// stop si interaction
		$('.filter-container-ch, .irs-with-grid, .irs, #range_sliderCH').click(function(){
			$('.play-ch').removeClass('pause-ch');
			clearTimeout(animTimeoutCH);
		});

		$('#showAbsoluteCH').change(function(){
			// invert
			showAbsoluteValues = $(this).prop('checked');
			svg.selectAll(".circles").remove();
			svg.selectAll(".textLabels").remove();

			update_date(current_timestamp);
		})

		var swissMapScene = new ScrollMagic.Scene({triggerElement: "#mapCH", duration: 300})
			.addTo(controller)
			// .addIndicators({'name': 'animated map'}) // debug
			.on("enter", function(){
				// on commence tranquille
				if(!playedCH){
					runAnimation();
					$('.play-ch').addClass('pause-ch');
				}
			})
			.on("leave", function(event){
				clearTimeout(animTimeoutCH);
				$('.play-ch').removeClass('pause-ch');
			});

			var lastIndex;
			var chart = c3.generate({
				padding: {
					right: 30,
  			},
				size: {
					height: 200
				},
				bindto: "#time-serie-chart-ch",

				data: {
					url: 'data/c3-linegraph-ch.csv?UPDATE',
					type: 'line',
					x: 'timestamp',
					colors: {
						'Nouveaux décès': '#930025',
						'Nombre de cas hospitalisés': '#54aac3',
					}
				},
		    point: {
		        show: true // ($(window).width() > 600)
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
							// values: [0, 10000, 20000, 30000],
							// format: d3.format(".0s")
						}
					}
				},
				grid: {
					y: {
						lines: [
							{ value: 0},
							{ value: 10000},
							{ value: 20000},
							{ value: 30000},
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
									var $slider = $("#range_sliderCH");
									$slider.data("ionRangeSlider").update({
										from: index
									});

									clearTimeout(animTimeoutCH);
									$('.pause-ch').removeClass('pause-ch')
								}
								lastIndex = index;
								// TODO: find nearest
								// dateCounter = index;
							}
							return value;
						}
					}
				}
			}); // end c3js graph

			// Annotate
			// using https://github.com/susielu/d3-annotation/blob/master/d3-annotation.min.js

			function annotate(item){
				// lat, lng, title, label

				var type = d3.annotationCalloutCircle;
				var annotations = [{
					note: {
						label: item.label,
						title: item.title
					},
					data: { lat: item.lat, lng: item.lng },
					className: "show-bg",
					dx: item.dx,
					dy: item.dy,
					subject: {
				    radius: 50,
				    radiusPadding: 5
				  }
				}];

			var makeAnnotations = d3.annotation()
				.type(type)
				.accessors({
					x: function(d){ return projection([+d.lng, +d.lat])[0] },
					y: function(d){ return projection([+d.lng, +d.lat])[1] }
				})
				.annotations(annotations)

				svg
					.append("g")
					.attr("class", "annotation-group")
					.call(makeAnnotations);
			}
	});
})();

(function(){
	var filters = {
		// 'date': '2020-01-22',
		'date': '2020-02-23',
	}
	var dateCounter = 0;


	var margin = {top: 200, right: 10, bottom: 10, left: 10};

	var width = 1500 - margin.left - margin.right,
	height = 1000 - margin.top - margin.bottom;

	var projection = d3.geoRobinson().scale(180);

	var path = d3.geoPath()
	.projection(projection);

	queue()
	.defer(d3.json, "data/world_countries.json")
	.defer(d3.csv, "data/time-series-last.csv")
	.await(ready);

	function ready(err, geodata, data) {

		if (err) console.warn(err, "error loading data");

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
				var d = new Date(ts);

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

		// FILTER UPDATES
		// for a given year
		function update_date(timestamp){
			filters['date'] = timestamp;

			svg.selectAll(".circle")
				.transition()
				.duration(200)
				.style('opacity', function(d){
					return applyFilters(d);
				});
		}




		// Bubble size
	  var valueExtent = d3.extent(data, function(d) { return +d.n; })
	  var size = d3.scalePow() // previously: d3.scaleSqrt()
			.exponent(1/2)
	    .domain(valueExtent)
	    .range([ 2, 50]) // Size in pixel

		svg
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
				});

			// Legend: from Bubblemap Template by Yan Holtz
			// https://www.d3-graph-gallery.com/graph/bubble_legend.html
			// https://www.d3-graph-gallery.com/graph/bubblemap_template.html
			var valuesToShow = [1, 1000, 64000]
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

					return `<h4>${location}</h4>
						<p><span class="stats">Cas confirmés</span> ${d.Confirmed}</p>
						<p><span class="stats">Décès</span> ${d.Deaths}</p>
						<p><span class="stats">Rétablissements</span> ${d.Recovered}</p>
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

				var dateList = [1581894000000,
 1581980400000,
 1579734000000,
 1580770800000,
 1581548400000,
 1580252400000,
 1581721200000,
 1580425200000,
 1581202800000,
 1581375600000,
 1580079600000,
 1579647600000,
 1580684400000,
 1582326000000,
 1581030000000,
 1580511600000,
 1582153200000,
 1581116400000,
 1579906800000,
 1580598000000,
 1580166000000,
 1581634800000,
 1580338800000,
 1581807600000,
 1581289200000,
 1579993200000,
 1581462000000,
 1579820400000,
 1580857200000,
 1582239600000,
 1580943600000,
 1582412400000,
 1582066800000];
				// setInterval(function(){
				// 	console.log(new Date(dateList[dateCounter]))
				// 	slider.update({
        //     from: new Date(dateList[dateCounter]),
        // });
				// }, 500)

	}
})();

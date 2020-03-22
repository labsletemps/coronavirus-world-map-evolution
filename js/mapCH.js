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

	var format = d3.timeFormat("%c");

	var animTimeout;
	var dateCounter = 0;
	var availableDates = [];

	var margin = {top: 0, right: 10, bottom: 10, left: 10};

	var width = 1500 - margin.left - margin.right,
	height = 800 - margin.top - margin.bottom;

	var projection = d3.geoMercator()
	    .center([9.4, 46.65])
	    .scale(12000)
	    .translate([ width/2, height/2 ]);
			
	var colorScaleCorona = d3.scalePow()
    .exponent(0.5)
    .domain([0, 1000])
    .range(["#ececec", "red"]);

Promise.all([d3.json("data/cantons-1k.json"), d3.csv("data/covid19_cases_switzerland.csv")]).then(function(data) {
		var geodata = data[0];
		var data = data[1];
		
		data.forEach(function(d) {
			// TODO: change it when processing CSV file
			d['timestamp'] = d['Date'];
			if( availableDates.indexOf( d['timestamp'] ) == -1 ){
				availableDates.push( d['timestamp'] );
			}
			d.n = +d.CH;
		});
		availableDates.sort();

		var svg = d3.select("#mapCH").append("svg")
			.style('border', '1px solid black')
			.append("g")
			.attr('id', 'containerCH');

		svg.append("g")
			.attr('class', 'cantons')
			.selectAll("path")
			.data( topojson.feature(geodata, geodata.objects.cantons).features )
			.enter()
			.append("path")
			.attr("fill", function (d) {
				// todo: dataById
				return colorScaleCorona(1);
			})
			.attr("d", d3.geoPath()
					.projection(projection)
			)
			.style("stroke", "#abb7b7")
			.style("stroke-width", "1px")
			.on('mouseover', function(d) {
				d3.select(this).style('stroke', 'black');
				d3.event.preventDefault();
				displayDetail(d);
			}).on('mouseout', function(d) {
				d3.select(this).style('stroke', '#abb7b7');
			}).on("click", function(d) {
				displayDetail(d);
			})
			.style("opacity", .6)
			// .exit()
			// .transition().duration(200)
			// .attr("r",1)
			// .remove();

		/*
		Date picker
		*/
		var slider = $("#range_sliderCH").ionRangeSlider({
				// skin: "flat",
				values: availableDates,
				prettify: function(d){ console.log(d); return d},
				onChange: function(data){
					update_date( data.from_value );
				}
		});

		function update_date(timestamp) {
		
		}
		
		function sizeChange() {
			// TODO adapter pour version embed
			d3.select("g#containerCH").attr("transform", "scale(" + $("#mapCH").width() / 1000 + ")");
			$("#mapCH svg").height($("#mapCH").width()*0.7);
		}


		d3.select(window)
			.on("resize", sizeChange);

		sizeChange();

	});
})();

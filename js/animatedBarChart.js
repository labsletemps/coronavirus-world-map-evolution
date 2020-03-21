$( document ).ready(function() {
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
  var format = d3.timeFormat("%c");
  var filter_china = 'Chine';

  var availableDates = [];
  var dateCounter = 1;
  var margin = { top: 40, bottom: 10, left: 124, right: 20 };

  var width = parseInt(d3.select("#chartTop").style("width")) - margin.left - margin.right;

  // var width = 800 - margin.left - margin.right;
  var height = 300 - margin.top - margin.bottom;
  var data;

  var stepDuration = 800;

  var svg = d3
    .select("#chartTop")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  // Groupe
  var g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Echelles
  var xscale = d3.scaleLinear().range([0, width]);
  var yscale = d3
    .scaleBand()
    .rangeRound([0, height])
    .paddingInner(0.1);

  // Axes
  var xaxis = d3.axisTop().scale(xscale);
  var g_xaxis = g.append("g").attr("class", "x axis");
  var yaxis = d3.axisLeft().scale(yscale);
  var g_yaxis = g.append("g").attr("class", "y axis");

  d3.json("data/top10.json?UPDATE").then(json => {
    data = json;
    data.forEach(function(d) {
      if( availableDates.indexOf( d['date'] ) == -1 ){
        availableDates.push( d['date'] );
      }
    });

    first_day_data = data.filter(d => d.date === availableDates[0]).filter(d => d.country != filter_china)
    update(first_day_data, stepDuration * 0.8);
  });

  function update(new_data, duration) {
    xscale.domain([0, d3.max(new_data, d => d.confirmed)]).nice();
    yscale.domain(new_data.map(d => d.country));

    g_xaxis.transition().call(
      xaxis
      .ticks(5)
      .tickFormat( d3.format(".0s") )
    );
    g_yaxis.transition().call(yaxis);

    // data join! (faire idem pour carte?)
    var rect = g
      .selectAll("rect")
      .data(new_data, d => d.country)
      .join(
        enter => {
          var rect_enter = enter.append("rect")
            .attr("x", 0)
            .attr("y", height) // les pays partent du bas, plop
            .style("fill", function(d){
              if(d.country == 'Italie') return '#4E8054';
              if(d.country == 'Suisse') return '#E01649';
              return '#930025'
            });
          rect_enter.append("title");
          return rect_enter;
        },
        update => update,
        exit => exit.remove()
      );

    rect
      .transition()
      .duration(duration) // 400
      .attr("height", yscale.bandwidth())
      .attr("width", d => xscale(d.confirmed))
      .attr("y", d => yscale(d.country));

    rect.select("title").text(d => d.country);
  }

  $( "#displayChina" ).change(function() {
    if($(this).prop( "checked" )){
      filter_china = 'no-filter';
    } else {
      filter_china = 'Chine';
    }
    update( data.filter(d => d.date === availableDates[dateCounter]).filter(d => d.country != filter_china), 100 );
  });


  // comme map.js
  function runAnimation(){
    update( data.filter(d => d.date === availableDates[dateCounter]).filter(d => d.country != filter_china), stepDuration * 0.8);

    $('.date').text( format( new Date(availableDates[dateCounter])) );


    // todo enlever
    /*if(availableDates[dateCounter] == '2020-03-09'){
      clearTimeout(animTimeout);
    }*/

    $('.stop').click(function(){
      $('.play').removeClass('pause');
      clearTimeout(animTimeout);
    })

    // TODO: cleaner code
    dateCounter += 1;
    if(dateCounter < availableDates.length){
      animTimeout = setTimeout(runAnimation, stepDuration);
    }else{
      dateCounter -= 1;
      $('.play').removeClass('pause');
    }
  }

  // on commence tranquille
  animTimeout = setTimeout(runAnimation, stepDuration);

  $('.reload').click(function(){
    clearTimeout(animTimeout);
    dateCounter = 0;
    runAnimation();
  })
});
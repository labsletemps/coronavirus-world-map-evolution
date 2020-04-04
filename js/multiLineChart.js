/**

Copyright 2020 Le Temps

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

class multilineChart {
  constructor(opts = {}) {
    this.selector = opts.selector ? opts.selector : '#multilineChart';
    this.margin = opts.margin ? opts.margin : { top: 40, bottom: 30, left: 50, right: 100 };
    this.xTickFormat = opts.xTickFormat ? opts.xTickFormat : "d";

    this.timeScale = opts.timeScale ? opts.timeScale : false;

    this.file = opts.file;
    this.fatLineWidth = opts.fatLineWidth ? opts.fatLineWidth : 3;
    this.needsFatLine = false;
    this.data = null;
    this.mouseOverTimeout = null;
    this.countries = [];
    this.selectedColumns = ['Corée du Sud', 'Etats-Unis',
    'France', 'Italie', 'Royaume-Uni',
    'Suisse'];

    var container = d3.select(this.selector).node();
    if(!container){
      console.error('Error: element ' + this.selector + ' not found');
    }else{
      this.width = parseInt(d3.select(this.selector).style("width")) - this.margin.left - this.margin.right;
      this.height = 400 - this.margin.top - this.margin.bottom;
      this.tickNumber = 4;

      var svg = d3
        .select(this.selector)
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom);

      this.g = svg.append("g").attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }
    this.createScales();
    this.fetch();
  }

  fetch(){
    var theChart = this;
    d3.csv(this.file).then( function(data) {
      theChart.data = data;
      data.forEach(function(d) {
        if(theChart.timeScale){
          d.xValue = new Date(d.timestamp);
        }else{
          d.xValue = +d.country_day;
        }
      });

      theChart.countries = data.columns.slice(1).map(function(id) {
        return {
          id: id,
          values: data.map(function(d) {
            return {day: d.xValue, value: parseFloat(d[id])};
          })
        };
      });
      theChart.draw();
    });
  }

  createScales(){
    // Global variable for all data
    let data;
    var countries;

    // Scales setup
    if(this.timeScale){
      this.xscale = d3.scaleTime().range([0, this.width]);
    }else{
      this.xscale = d3.scaleLinear().range([0, this.width]);
    }

    this.yscale = d3.scaleLinear().range([this.height, 0]);
    this.zscale = d3.scaleOrdinal(d3.schemeCategory10);

    // Axis setup
    if(this.timeScale){
      this.xaxis = d3.axisBottom().scale(this.xscale).ticks(this.tickNumber).tickFormat( d3.timeFormat("%d %b") );
    }else{
      this.xaxis = d3.axisBottom().scale(this.xscale);
    }

    this.g_xaxis = this.g.append("g").attr("class", "x axis").attr("transform", "translate(0," + this.height + ")");
    this.yaxis = d3.axisLeft().scale(this.yscale).tickFormat( d3.format(this.xTickFormat) );
    this.g_yaxis = this.g.append("g").attr("class", "y axis");
  }

  draw() {
    // Update scales
    if(this.timeScale){
      this.xscale.domain(d3.extent(this.data, function(d) { return d.xValue; }));
    }else{
      this.xscale.domain(d3.extent(this.data, function(d) { return d.xValue; })).nice;
    }


    this.yscale.domain([
      d3.min(this.countries, function(c) { return d3.min(c.values, function(d) { return d.value; }); }),
      d3.max(this.countries, function(c) { return d3.max(c.values, function(d) { return d.value; }); })
    ]).nice();

    this.zscale.domain(this.countries.map(function(c) { return c.id; }));

    // Render axis
    this.g_xaxis.transition().call(this.xaxis);
    this.g_yaxis.transition().call(this.yaxis);

    // Render chart
    var theChart = this;

    var lineStatic = d3.line()
      .defined(function(d){ return !isNaN(d.value); })
      .curve(d3.curveBasis)
      .x(function(d) { return theChart.xscale(d.day); })
      .y(function(d) { return theChart.yscale(d.value); });

    var country = this.g.selectAll(".city")
      .data(this.countries)
      .enter().append("g")
      .attr("class", function(d){ return "country " + d.id});

    country.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return lineStatic(d.values.filter(function(d){ return d.value != 0;}) ); })
      .style("stroke", function(d) { return theChart.zscale(d.id); });

    country.append("text")
      .datum(function(d) { return {id: d.id, value: d.values[d.values.filter(function(d){ return !isNaN(d.value);}).length - 1]}; })
      .attr("transform", function(d) { return "translate(" + theChart.xscale(d.value.day) + "," + theChart.yscale(d.value.value) + ")"; })
      .attr("x", 3)
      .attr("dy", "0.35em")
      .attr("class", "country-label")
      .text(function(d) { return d.id; });

    if(this.needsFatLine){
      this.addFatLine();
    }
  }

  addFatLine(){
    if(!this.data){
      // Wait for fetch
      this.needsFatLine = true;
    }else{
      var theChart = this;

      var fatLine = d3.line()
        .defined(function(d){ return d.Suisse !== ''; })
        .curve(d3.curveBasis)
        .x(function(d) { return theChart.xscale(d.xValue); })
        .y(function(d) { return theChart.yscale(d.Suisse); });

      var path = this.g.append("path")
        .attr("d", fatLine( this.data.filter(function(d){ return d.Suisse != 0;})) )
        .attr("stroke", "#b80021")
        .attr("stroke-width", this.fatLineWidth)
        .attr("fill", "none");

      var totalLength = path.node().getTotalLength();

      // Animate
      path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(4000)
        .ease(d3.easeCubic)
        .attr("stroke-dashoffset", 1);
    }
  }

}

/**

Copyright 2020 Le Temps

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

class multilineChart {
  constructor(opts = {}) {

    this.selector = opts.selector ? opts.selector : '#multilineChart';

    // Layout and margins
    this.hideLabel = opts.hideLabel ? opts.hideLabel : false;

    this.margin = opts.margin ? opts.margin : { top: 40, bottom: 30, left: 50, right: 100 };
    this.height = opts.height ? opts.height : 400 - this.margin.top - this.margin.bottom;

    if(this.hideLabel === true){
      this.margin.right = this.margin.left;
    }

    // Line style
    this.straightLine = opts.straightLine ? opts.straightLine : false;
    this.fatLineWidth = opts.fatLineWidth ? opts.fatLineWidth : 3;
    this.colors = opts.colors ? opts.colors : null;

    // Axis
    this.tickNumber = opts.tickNumber ? opts.tickNumber : 4;
    this.xMin = opts.xMin ? opts.xMin : false;
    this.yMax = opts.yMax ? opts.yMax : false;

    /* Axis Scales */
    this.yTickFormat = opts.yTickFormat ? opts.yTickFormat : "d";
    this.timeScale = opts.timeScale ? opts.timeScale : false;
    this.exponentScale = opts.exponentScale ? opts.exponentScale : false;
    this.logScale = opts.logScale ? opts.logScale : false;

    // Custom Annotations
    this.needsMouseGroup = opts.needsMouseGroup ? opts.needsMouseGroup : true;
    this.annotationSplitter = opts.annotationSplitter ? opts.annotationSplitter : ' ';
    this.hasConfidenceInterval = opts.hasConfidenceInterval ? opts.hasConfidenceInterval : false;
    this.needsReLimit = opts.needsReLimit ? opts.needsReLimit : false;
    this.needsRectlayer = opts.needsRectlayer ? opts.needsRectlayer : false;
    this.weekly = opts.weekly ? opts.weekly : false;

    // Data
    this.data = null;
    this.file = opts.file;

    /* booleans */
    this.annotationsDrawn = false;
    this.needsFatLine = false;
    this.needsAnnotations = false;

    /* tooltip and mouse */
    this.tooltip = null;
    this.mouseG = null;
    this.mouseMoveTimeout = null;

    /* columns */
    this.columns = [];

    /* create container */
    var container = d3.select(this.selector).node();
    if(!container){
      console.error('Error: element ' + this.selector + ' not found');
    }else{
      this.width = parseInt(d3.select(this.selector).style("width")) - this.margin.left - this.margin.right;

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

  setLogScale(useLogScale){
    this.g.selectAll('.country').remove();
    this.g.selectAll('.axis').remove();
    this.logScale = useLogScale;
    // TODO: animate
    // this.yaxis.scale(this.yscale());
    this.createScales();
    this.draw();
  }
  setData(name, file){
    // todo: don’t reload
    // and animate change
    this.g.selectAll('.country').remove();
    this.file = file;
    this.fetch();
  }

  addData(data){
    this.data = data;

    var theChart = this;

    data.forEach(function(d) {
      if(theChart.timeScale){
        d.xValue = new Date(d.timestamp);
      }else{
        d.xValue = +d.country_day;
      }
    });
    var lastColIndex = theChart.hasConfidenceInterval ? data.columns.length - 2 : data.columns.length;

    this.columns = data.columns.slice(1, lastColIndex).map(function(id) {
      return {
        id: id,
        values: data.map(function(d) {
          return {xValue: d.xValue, value: parseFloat(d[id])};
        })
      };
    });
    this.draw();
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

      var lastColIndex = theChart.hasConfidenceInterval ? data.columns.length - 2 : data.columns.length;

      theChart.columns = data.columns.slice(1, lastColIndex).map(function(id) {
        return {
          id: id,
          values: data.map(function(d) {
            return {xValue: d.xValue, value: parseFloat(d[id])};
          })
        };
      });
      theChart.draw();
    });
  }

  createScales(){
    // Scales setup
    if(this.timeScale){
      this.xscale = d3.scaleTime().range([0, this.width]);
    }else{
      this.xscale = d3.scaleLinear().range([0, this.width]);
    }

    if(this.exponentScale){
      this.yscale = d3.scalePow(0.5).range([this.height, 0]);
    }else if (this.logScale){
      this.yscale = d3.scaleLog().clamp(true).domain([
        0.1,
        d3.max(this.columns, function(c) { return d3.max(c.values, function(d) { return d.value; }); })
      ]).range([this.height, 0]);
    }else{
      this.yscale = d3.scaleLinear().range([this.height, 0]);
    }
    if(this.colors !== null){
      this.zscale = d3.scaleOrdinal().range(this.colors);
    }else{
      this.zscale = d3.scaleOrdinal(d3.schemeCategory10);
    }

    // Axis setup
    if(this.timeScale){
      this.xaxis = d3.axisBottom().scale(this.xscale).ticks(this.tickNumber).tickFormat( this.width > 600 ? d3.timeFormat("%d %b") : d3.timeFormat('%d.%m') );
    }else{
      this.xaxis = d3.axisBottom().scale(this.xscale).ticks();
    }

    if(this.logScale){
      this.yaxis = d3.axisLeft().scale(this.yscale).ticks(3).tickFormat( d3.format(this.yTickFormat) );
    }else{
      this.yaxis = d3.axisLeft().scale(this.yscale).tickFormat( d3.format(this.yTickFormat) );
    }

    this.g_xaxis = this.g.append("g").attr("class", "x axis").attr("transform", "translate(0," + this.height + ")");
    this.g_yaxis = this.g.append("g").attr("class", "y axis");
    this.g_rectlayer = this.g.append("g").attr("class", "rectlayer");
  }

  addReLimit(){
    var bounds = this.xaxis.scale().domain();
    var theChart = this;

    this.g.append("line")
      .style("stroke", "#E06D3A") // ou precedent rouge: "rgb(231, 76, 60)")
      .style("stroke-width", 3)
      .attr("x1", function(d){ return theChart.xscale(bounds[0])})
      .attr("y1", function(d){ return theChart.yscale(1)})
      .attr("x2", function(d){ return theChart.xscale(bounds[1])})
      .attr("y2", function(d){ return theChart.yscale(1)})
  }

  addRectlayer(){
    var rectdata = [
      {xValue: new Date(this.data[this.data.length - 3].xValue), y0: 0, y1: this.height}
    ]
    var width = this.xscale(this.data[2].xValue)
    var theChart = this;

    this.g_rectlayer.selectAll(".uncertain-rectangle")
      .data(rectdata)
      .enter()
      .append("rect")
      .attr("class", "uncertain-rectangle")
      .attr("x", function(d) { return theChart.xscale(d.xValue)} )
      .attr("y", d.y0)
      .attr("width", width)
      .attr("height", function(d) { return d.y1 });
  }

  addConfidenceInterval(){
    var theChart = this;

    // Show confidence interval
    this.g.append("path")
      .datum(this.data)
      .attr("fill", "#cce5df")
      .attr("stroke", "none")
      .attr("d", d3.area()
        .x(function(d) { return theChart.xscale(d.xValue) })
        .y0(function(d) { return theChart.yscale(d.min_limit) })
        .y1(function(d) { return theChart.yscale(d.max_limit) })
      )
  }

  draw() {
    var theChart = this;

    // Update scales
    if(this.timeScale){
      this.xscale.domain(d3.extent(this.data, function(d) { return d.xValue; }));
    }else{
      this.xscale.domain(d3.extent(this.data, function(d) { return d.xValue; })).nice;
    }

    if(this.logScale){
      this.yscale.domain([
        1,
        this.yMax ? this.yMax : d3.max(this.columns, function(c) { return d3.max(c.values, function(d) { return d.value; }); })
      ]);
    }else{
      this.yscale.domain([
        theChart.xMin ? 0 : d3.min(this.columns, function(c) { return d3.min(c.values, function(d) { return d.value; }); }),
        d3.max(this.columns, function(c) { return d3.max(c.values, function(d) { return d.value; }); })
      ]).nice();
    }


    this.zscale.domain(this.columns.map(function(c) { return c.id; }));

    // Render axis
    this.g_xaxis.transition().call(this.xaxis);
    this.g_yaxis.transition().call(this.yaxis);

    if(this.hasConfidenceInterval){
      this.addConfidenceInterval();
    }

    // Render chart
    var lineStatic;

    if(this.straightLine){
      lineStatic = d3.line()
        .defined(function(d){ return !isNaN(d.value); })
        .x(function(d) { return theChart.xscale(d.xValue); })
        .y(function(d) { return theChart.yscale(d.value); });
    }else{
      lineStatic = d3.line()
        .defined(function(d){ return !isNaN(d.value); })
        .curve(d3.curveBasis)
        .x(function(d) { return theChart.xscale(d.xValue); })
        .y(function(d) { return theChart.yscale(d.value); });
    }


    var country = this.g.selectAll(".city")
      .data(this.columns)
      .enter().append("g")
      .attr("class", function(d){ return "country " + d.id});

    country.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return lineStatic(d.values.filter(function(d){ return d.value !== 0;}) ); })
      .style("stroke", function(d) { return theChart.zscale(d.id); });

    if(!this.hideLabel){
      country.append("text")
        .datum(function(d) {
          // Find last non-nan value
          var lastValueIndex = d.values.length - 1;
          while( lastValueIndex >= 0 ){
            if( ! isNaN(d.values[lastValueIndex].value)){
              break;
            } else {
              lastValueIndex--;
            }
          }
          // console.log(d.id, lastValueIndex, d.values[lastValueIndex], theChart.yscale(d.values[lastValueIndex]+1), theChart.yscale(1))

          return {id: d.id, value: d.values[lastValueIndex]};
        })
        .attr("transform", function(d) { return "translate(" + theChart.xscale(d.value.xValue) + "," + theChart.yscale(d.value.value) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .attr('stroke', function(d){ return d.id === 'Suisse'? '#b80021' : theChart.zscale(d.id)})
        .attr("class", "country-label")
        .text(function(d) { return d.id; });
    }

    if(this.needsFatLine){
      this.addFatLine();
    }
    if(this.needsAnnotations){
      // TODO
    }
    if(this.needsMouseGroup){
      this.mouseG = this.createMouseGroup();
    }
    if(this.needsReLimit){
      this.addReLimit();
    }

    if(this.needsRectlayer){
      this.addRectlayer();
    }

    this.arrangeLabels();
  }

  annotate(text, position, dx = 0, dy = -100, connectorType = 'line', title = null) {
    // using https://github.com/susielu/d3-annotation/blob/master/d3-annotation.min.js

    if(!this.data && !this.annotationsDrawn){
      // Wait for fetch
      this.needsAnnotations = true;
    }else{

       // wrapSplitter: /\n/

      var type = d3.annotationLabel;
      var annotations = [{
        note: {
          title: title,
          label: text,
          wrapSplitter: this.annotationSplitter,
        },
        data: { xValue: position.x, value: position.y },
        className: "show-bg",
        dx: dx,
        dy: dy,
        connector: { end: "arrow", type: connectorType }
      }];

      var makeAnnotations = d3.annotation()
        .type(type)
        .accessors({
          x: d => this.xscale(d.xValue),
          y: d => this.yscale(d.value)
        })
        .accessorsInverse({
           xValue: d => this.xscale.invert(d.xValue),
           value: d => this.yscale.invert(d.value)
        })
        .annotations(annotations)

        this.g
          .append("g")
          .attr("class", "annotation-group")
          .call(makeAnnotations)
      this.annotationsDrawn = true;
    }
  }

  arrangeLabels() {
    var theChart = this;

    this.g.selectAll(".country-label")
       .each(function() {
         var that = this;
         var rect1 = this.getBoundingClientRect();

         theChart.g.selectAll(".country-label")
            .each(function() {
              if(this !== that) {
                var rect2 = this.getBoundingClientRect();

                var overlap = !(rect1.right < rect2.left ||
                  rect1.left > rect2.right ||
                  rect1.bottom < rect2.top ||
                  rect1.top > rect2.bottom);

                if(overlap) {

                  var rect1_y = that.getAttribute('y');
                  var rect2_y = this.getAttribute('y');

                  var distance_y = rect2.top - rect1.top;

                  if( (distance_y < 10 ) && (distance_y > 0) ){
                    that.setAttribute('y', 5);
                    this.setAttribute('y', -5);
                  } else if ( (distance_y > -10 ) && (distance_y < 0) ) {
                    that.setAttribute('y', -5);
                    this.setAttribute('y', 5);
                  }

                  // fix temporaire france
                  if((theChart.selector === '#chartDayOffset') && (that.getAttribute('stroke') === '#d62728')){
                    that.setAttribute('x', 60);
                  }

                  // fix temporaire allemagne
                  if((theChart.selector === '#chartDayOffset') && (that.getAttribute('stroke') === '#1f77b4')){
                    that.setAttribute('y', 10);
                  }

                  that.setAttribute('class', 'country-label moved');
                  this.setAttribute('class', 'country-label moved');
                }
              }
            });
       });
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
        .attr("d", fatLine( this.data.filter(function(d){ return d.Suisse !== 0;})) )
        .attr("stroke", "#b80021")
        .attr("stroke-width", this.fatLineWidth)
        .attr("stroke-opacity", 0.8)
        .attr("fill", "none");

      var totalLength = path.node().getTotalLength();

      // Animate
      path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(3000)
        .ease(d3.easeCubic)
        .attr("stroke-dashoffset", 1);
    }
  }

  /* tooltips */

  showTooltip(idx){
    // idx = the index in value array
    var theChart = this;
    var valuesToShow = [];
    var xValue = false;

    this.columns.forEach(function(row){
      if( !isNaN( row.values[idx].value ) ){
        valuesToShow.push( {'country': row.id, 'value': row.values[idx].value} )
        if(!xValue){
          xValue = row.values[idx].xValue;
        }
      }
    });

    var xLabel = '';
    if(this.timeScale){
      xLabel = (this.weekly ? 'Semaine du ' : '') + d3.timeFormat("%d %b")(xValue);
      // this.xTickFormat = this.width > 600 ? d3.timeFormat("%d %b") : d3.timeFormat('%d.%m')
    } else {
      xLabel = 'Jour ' + d3.format('d')(xValue);
    }

    valuesToShow.sort(function(x, y){
       return d3.descending(x.value, y.value);
    })

    var xSpan = theChart.xscale(xValue) + this.margin.left + 10;
    // if(xSpan > this.width - this.margin.right){
    //   // TODO
    //   xSpan = this.width - this.margin.right;
    // }
    if(xSpan + 200 > this.margin.left + this.width){
      // TODO
      xSpan = this.margin.left + this.width - 200;
    }

    this.tooltip.html('<b>' + xLabel + '</b>')
      .style('display', 'block')
      .style('opacity', 1)
      .style('left', function(d){ return xSpan + 'px'; })
      .selectAll()
      .data(valuesToShow).enter()
      .append('div')
      .html(d => {
        // todo: couleur suisse
        if(d.country === 'Suisse'){
          return '<span style="color: #b80021;">' + d.country + '</span>: ' + d.value.toLocaleString();
        }else{
          return '<span style="color: ' + theChart.zscale(d.country) + ';">' + d.country + '</span>: ' + d.value.toLocaleString();
        }
        // return d.country + ': ' + d.value.toLocaleString();
      })
  }

  createMouseGroup(){
    // Adapted from this block by diananow
    // https://bl.ocks.org/dianaow/0da76b59a7dffe24abcfa55d5b9e163e

    if(!this.columns || !this.zscale){
      console.warn('Mouse group: data not ready yet')
      return false;
    }
    var theChart = this;

    this.tooltip = d3.select(this.selector).append("div")
      .attr('class', 'tooltip')
      .style('padding', 6)
      .style('left', '200px')
      .style('top', '20px')
      .html('')
      .style('display', 'none');

    var mouseG = this.g.append("g")
      .attr("class", "mouse-over-effects");

    mouseG.append("path") // create vertical line to follow mouse
      .attr("class", "mouse-line")
      .style("stroke", "#A9A9A9")
      .style("stroke-width", '0.5pt')
      .style("opacity", 0);

    var lines = document.getElementsByClassName('line');

    var mousePerLine = mouseG.selectAll('.mouse-per-line')
      .data(this.columns)
      .enter()
      .append("g")
      .attr("class", "mouse-per-line");

    mousePerLine.append("circle")
      .attr("r", 4)
      .style("stroke", function (d) {
        return '#ccc'
        // return theChart.zscale(d.key)
      })
      .style("fill", "none")
      .style("stroke-width", '1px')
      .style("opacity", 0);

    mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', function () { // on mouse out hide line, circles and text
        clearTimeout(theChart.mouseMoveTimeout);
        mouseG.select(".mouse-line")
          .style("opacity", "0");
        mouseG.selectAll(".mouse-per-line circle")
          .style("opacity", "0");
        mouseG.selectAll(".mouse-per-line text")
          .style("opacity", "0");
        theChart.tooltip
          .style('display', 'none')
      })
      .on('mouseover', function () { // on mouse in show line, circles and text
        mouseG.select(".mouse-line")
          .style("opacity", "1");
        mouseG.selectAll(".mouse-per-line circle")
          .style("opacity", "1");
        theChart.tooltip
          .style('display', 'block')
      })
      .on('mousemove', function () { // update tooltip content, line, circles and text when mouse moves

        clearTimeout(theChart.mouseMoveTimeout);
        var eventReceiver = this;
        var mouse = d3.mouse(this);

        theChart.mouseMoveTimeout = setTimeout(function(){

          var xValue = theChart.xscale.invert(mouse[0]);
          var bisect = d3.bisector(function (d) { return d.xValue; }).left; // retrieve row index of date on parsed csv
          var idx = -1;

          mouseG.selectAll(".mouse-per-line")
            .attr("transform", function (d, i) {

              if(idx === -1){
                idx = bisect(d.values, xValue);
              }

              if( typeof(d.values[idx]) !== 'undefined'){
                if( ! isNaN(d.values[idx].value) ){
                  mouseG.select(".mouse-line")
                    .attr("d", function () {
                      var data = "M" + theChart.xscale(d.values[idx].xValue) + "," + (theChart.height);
                      data += " " + theChart.xscale(d.values[idx].xValue) + "," + 0;
                      return data;
                    });
                  return "translate(" + theChart.xscale(d.values[idx].xValue) + "," + theChart.yscale(d.values[idx].value) + ")";
                } else{
                  // No data
                  return '';
                }
              }else{
                // Undefined index
                return '';
              }

            });
            theChart.showTooltip(idx);
          }, 5);

        });

      return mouseG;
  }

}

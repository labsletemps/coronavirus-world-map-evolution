class Chart {

    constructor(opts) {

        this.data = opts.data;
        this.element = opts.element;
        this.suffix = opts.suffix ? opts.suffix : '';
        this.ylabel = opts.ylabel ? opts.ylabel : '';
        this.serie = opts.serie ? opts.serie : '';
        this.dateFormat = "%d.%m."; //opts.dateFormat ? opts.dateFormat : "%m/%Y";
        this.dateParse = opts.dateParse ? opts.dateParse : "%b-%y";
        this.valuelabelsBottom = opts.valuelabelsBottom ? opts.valuelabelsBottom : false;
        this.kind = opts.kind ? opts.kind : 'line';

        var suffix = this.suffix;

        this.tool_tip = d3.tip()
          .attr("class", "d3-tip")
          .offset([-8, 0])
          .html(function(d) {
            // var time = d3.timeParse(this.parseDate)(d[0])
            // console.log(time);
            // return d3.timeFormat(this.dateFormat)(time)

            return (d[0]).toLocaleString('fr-FR', {month: 'long', day: 'numeric'}) + ': ' + d[1] + suffix;
          });
        // create the chart
        this.draw();
    }

    draw() {
        // define width, height and margin
        this.width = this.element.offsetWidth;
        this.height = this.width / 2;
        if(this.height > 200){
          this.height = 150;
        }
        this.margin = {
            top: 30,
            right: 90,
            bottom: 45,
            left: 52
        };
        this.padding = {
          top: 10,
          left: 30,
          right: 10,
          bottom: 0
        };
        if(this.serie == 'youth-unemployment'){
          this.padding.left = this.width/4;
          this.padding.right = this.width/4;
        };

        // set up parent element and SVG
        this.element.innerHTML = '';
        const svg = d3.select(this.element).append('svg');
        svg.attr('width',  this.width);
        svg.attr('height', this.height);

        // we'll actually be appending to a <g> element
        this.plot = svg.append('g')
            .attr('transform',`translate(${this.margin.left},${this.margin.top})`);

        // create the other stuff
        this.createScales();
        this.addAxes();
        if(this.kind == 'line'){
          this.addLine();
        } else if (this.kind == 'bar') {
          // this.createBandScale();
          this.addBar();
        }


        // label
        svg.call(this.tool_tip);
    }

    createScales() {
        // m = margin
        const m = this.margin;

        const xExtent = d3.extent(this.data, d => d[0]);
        const yExtent = d3.extent(this.data, d => d[1]);

        // baseline a zero si positif
        if (yExtent[0] > 0) { yExtent[0] = 0; };
        if (this.serie == 'youth-unemployment'){ yExtent[1] = 35; }

        this.xScale = d3.scaleTime()
            .range([this.padding.left, this.width-(m.right + this.padding.right)])
            .domain(xExtent);

        this.yScale = d3.scaleLinear()
            .range([this.height-(m.top+m.bottom), this.padding.top])
            .domain(yExtent)
            .nice();
    }

    createBandScale() {
      this.xScale = d3.scaleBand().rangeRound([0, this.width]).padding(0.1);
    }

    addAxes() {
        const m = this.margin;
        const parseDate = d3.timeParse(this.dateParse);
        // create and append axis elements
        // this is all pretty straightforward D3 stuff

        let xAxis = d3.axisBottom()
           .scale(this.xScale)
           .ticks( this.width > 400 ? d3.timeDay.every(6) : d3.timeDay.every(12)) // mobile
           .tickFormat(d3.timeFormat(this.dateFormat));


        const yAxis = d3.axisLeft()
            .scale(this.yScale)
            .ticks(4)
            .tickFormat(d3.format(''));

        this.plot.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${this.height-(m.top+m.bottom)})`)
            .call(xAxis);

        this.plot.append("g")
            .attr("class", "y axis")
            .call(yAxis)

      // label axe des y
        this.plot.append("text")
         .attr("y", -m.top + this.padding.top)
         .attr("x", 0)
         .attr("dy", "1em")
         .style("text-anchor", "middle")
         .text(this.ylabel);

    }

    addLine() {
        const line = d3.line()
            .x(d => this.xScale(d[0]))
            .y(d => this.yScale(d[1]));

        this.plot.append('path')
            // use data stored in `this`
            .datum(this.data)
            .classed('line',true)
            .attr('d',line);
            // set stroke to specified color, or default to red
            // .style('stroke', this.lineColor || 'steelblue');

        // Add the scatterplot
        this.plot.selectAll("dot")
            .data(this.data)
          .enter().append("circle")
            .attr("r", this.width > 400 ? 3 : 2)
            .attr("cx", d => this.xScale(d[0]))
            .attr("cy", d => this.yScale(d[1]))
            .on('mouseover', this.tool_tip.show)
            .on('mouseout', this.tool_tip.hide);

        // the js "this" problem
        var _data = this.data;
        var _positionBottom = this.valuelabelsBottom;
        this.plot.selectAll("valuelabels")
          .data(this.data)
          .enter().append('text')
          .filter(function(d, i) { return i === 0 || i === (_data.length - 1) })
          .attr("x", d => this.xScale(d[0]))
          .attr("y", d => this.yScale(d[1]))
          .attr("text-anchor", "middle")
          .text(d => d[1] + (this.suffix.length < 2 ? this.suffix : '') )
          .attr("transform", function(){
            if(_positionBottom){
              return "translate(0, 20)";
            }
            return "translate(0, -10)";
          });
    }

    addBar() {
        var barWidth = Math.round(this.width / 100);

        // Add the scatterplot
        this.plot.selectAll(".bar-border")
            .data(this.data)
          .enter().append("rect")
            .attr('class', 'bar-border')
            .attr('x', d => this.xScale(d[0]))
            .attr('y', d => this.yScale(d[1]))
            .attr('width', barWidth)
            .attr('height', 2);

        this.plot.selectAll(".bar")
            .data(this.data)
          .enter().append("rect")
            .attr('class', 'bar')
            .attr('x', d => this.xScale(d[0]))
            .attr('y', d => this.yScale(d[1]))
            .attr('width', barWidth)
            .attr('height', d => 2 + this.height - (this.margin.top + this.margin.bottom) - this.yScale(d[1]))
            .on('mouseover', this.tool_tip.show)
            .on('mouseout', this.tool_tip.hide);
    }

    // the following are "public methods"
    // which can be used by code outside of this file

    setColor(newColor) {
        this.plot.select('.line')
            .style('stroke', newColor);

        // store for use when redrawing
        this.lineColor = newColor;
    }

    setData(newData) {
        this.data = newData;

        // full redraw needed
        this.draw();
    }
}

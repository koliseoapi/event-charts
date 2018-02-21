import { scaleLinear, scaleBand } from "d3-scale";
import { axisLeft, axisTop } from "d3-axis";
import { select } from 'd3-selection';
import { tsv } from 'd3-request';
import { map } from 'd3-collection';
import { forceSimulation } from 'd3-force';

function createLabel(dayName, trackName, start) {
  return `${dayName}-${start}-${trackName}`;
}

export default class AgendaChart {

  constructor({ 
    // selector to find the SVG where we sill render the chart
    selector,

    // width of the chart, in pixels
    width = 600,

    // height of the bar, in pixels
    barHeight = 40,

    // margin of the chart (inside the width)
    margin = { top: 80, right: 80, bottom: 80, left: 80 },

    // property value to display. Possible values are "likes" or "feedback"
    propertyName = "likes"
  }) {
    this.svg = select(selector);
    this.width = width;
    this.barHeight = barHeight;
    this.margin = margin;
    this.propertyName = propertyName;
  }

  // proces the agenda and return something that can be used to render the chart
  // return
  // maxLikes: (int) the maximum number of likes or feedback in the agenda
  // slotLabels: (array of String) the list of labels to display in the chart
  // slots: (array of { label, value, authors }) the array of slots to display
  processAgenda(agenda) {
    let maxLikes = 0;
    let maxFeedback = 0;
    let slotLabels = [];
    let mySlots = [];
    agenda.days.forEach(({ name: dayName, tracks }) => {
      tracks.forEach(({ name: trackName, slots }) => {
        slots.forEach(({ start, contents: { type, title, totalLikes, feedback, authors } = {} }) => {
          if (type == 'TALK') {
            const totalFeedback = feedback && feedback.entriesCount || 0;
            const label = createLabel(dayName, trackName, start);
            maxLikes = Math.max(maxLikes, totalLikes)
            maxFeedback = Math.max(maxFeedback, totalFeedback);
            slotLabels.push(label)
            mySlots.push({ 
              label, 
              value, 
              authors,
              trackName, 
              title
            });
          }
        })
      })
    });
    slotLabels = slotLabels.sort();
    mySlots = mySlots.sort(({ label: label1 }, { label: label2 }) => {
      return label1 < label2 ? -1 :
        label1 > label2 ? 1 :
          0
    }
    );
    return {
      maxLikes,
      slotLabels,
      slots: mySlots,
      totalHeight: mySlots.length * this.barHeight
    };
  }
  
  createScale({ maxLikes, slotLabels, totalHeight }) {
    const x = scaleLinear()
      .domain([0, maxLikes])
      .range([0, this.width]);
    const y = scaleBand()
      .rangeRound([0, totalHeight])
      .domain(slotLabels)
      .paddingInner(.1);
    return { x, y };
  }

  clear() {
    this.svg
      .selectAll('*')
      .remove();
  }

  renderAxis(x, y) {
    const xAxis = axisTop()
      .scale(x)
      .ticks(4);
    const yAxis = axisLeft()
      .scale(y);
    this.svg.append("g")
      .attr("class", "x axis")
      //.attr("transform", "translate(0," + height + ")")
      .call(xAxis);
    this.svg.append("g")
      .attr("class", "y axis axisLeft")
      //.attr("transform", "translate(0,0)")
      .call(yAxis)
      /*
      .append("text")
      .attr("y", 6)
      .attr("dy", "-2em")
      .style("text-anchor", "end")
      .style("text-anchor", "end")
      .text("Dollars");
*/
  }

  renderBars({ slots }, x, y) {
    const bars = this.svg
      .append("g")
      .attr("class", "bars")
      .selectAll(".bar")
      .data(slots)
      .enter();
    bars.append("rect")
      .attr("class", ({ trackName }) => `bar ${trackName.toLowerCase().replace(/\s/, '-')}`)
      .attr("x", 0)
      .attr("y", ({ label }) => y(label))
      .attr("height", y.bandwidth())
      .attr("width", ({ value }) => x(value))
    ;
  }

  renderLabels({ slots }, x, y) {
    // Ellipsis on long text: https://stackoverflow.com/questions/15975440/add-ellipses-to-overflowing-text-in-svg
    function wrap() {
      var self = select(this),
        textLength = self.node().getComputedTextLength(),
        text = self.text();
      while (textLength > this.width && text.length > 0) {
        text = text.slice(0, -1);
        self.text(text + '\u2026');
        textLength = self.node().getComputedTextLength();
      }
    } 

    const labels = this.svg
      .append("g")
      .attr("class", "labels")
      .selectAll(".bar-label")
      .data(slots)
      .enter();
    labels.append("text")
      .attr("x", 0)
      .attr("dx", "1rem")
      .attr("y", ({ label }) => y(label) + y.bandwidth() / 2)
      .style("text-anchor", "start")
      .attr("class", "bar-label")
      .attr("alignment-baseline", "middle")
      .text(({trackName, title}) => `${trackName}: ${title}` )
      .each(wrap)
      ;
  }

  render(agendaJSON, propertyName) {
    const agenda = this.processAgenda(agendaJSON, propertyName);
    const { x, y } = this.createScale(agenda);
    this.clear();
    this.svg
      .attr('width', this.width)
      .attr('height', agenda.totalHeight);
    this.renderAxis(x, y);
    this.renderBars(agenda, x, y);
    this.renderLabels(agenda, x, y);
    /*
    svg
      .attr('width', this.width)
      .attr('height', slotLabels.length * BAR_HEIGHT)
      .append('g')
      .attr('class', 'graph')
      //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      */


  }
}

/*
var svg = select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("class", "graph")
d3.tsv("data.tsv", type, function (error, data) {
  x.domain(data.map(function (d) { return d.year; }));
  y0.domain([0, d3.max(data, function (d) { return d.money; })]);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
  svg.append("g")
    .attr("class", "y axis axisLeft")
    .attr("transform", "translate(0,0)")
    .call(yAxisLeft)
    .append("text")
    .attr("y", 6)
    .attr("dy", "-2em")
    .style("text-anchor", "end")
    .style("text-anchor", "end")
    .text("Dollars");

  svg.append("g")
    .attr("class", "y axis axisRight")
    .attr("transform", "translate(" + (width) + ",0)")
    .call(yAxisRight)
    .append("text")
    .attr("y", 6)
    .attr("dy", "-2em")
    .attr("dx", "2em")
    .style("text-anchor", "end")
    .text("#");
  bars = svg.selectAll(".bar").data(data).enter();
  bars.append("rect")
    .attr("class", "bar1")
    .attr("x", function (d) { return x(d.year); })
    .attr("width", x.rangeBand() / 2)
    .attr("y", function (d) { return y0(d.money); })
    .attr("height", function (d, i, j) { return height - y0(d.money); });
  bars.append("rect")
    .attr("class", "bar2")
    .attr("x", function (d) { return x(d.year) + x.rangeBand() / 2; })
    .attr("width", x.rangeBand() / 2)
    .attr("y", function (d) { return y1(d.number); })
    .attr("height", function (d, i, j) { return height - y1(d.number); });
});
function type(d) {
  d.money = +d.money;
  return d;
}
*/
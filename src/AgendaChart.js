import { scaleLinear, scaleBand } from "d3-scale";
import { axisLeft, axisTop } from "d3-axis";
import { select } from 'd3-selection';
import { tsv } from 'd3-request';
import { map } from 'd3-collection';
import { forceSimulation } from 'd3-force';

function createLabel(dayName, trackName, start) {
  return `${dayName}-${start}-${trackName}`;
}

// height of each bar, in pixels
const BAR_HEIGHT = 20;

export default class AgendaChart {

  constructor({ 
    // selector to find the SVG where we sill render the chart
    selector,

    // width of the chart, in pixels
    width = 600
  }) {
    this.svg = select(selector);
    this.width = width;
  }

  // proces the agenda and return something that can be used to render the chart
  // return
  // maxLikes: (int) the maximum number of likes or feedback in the agenda
  // slotLabels: (array of String) the list of labels to display in the chart
  // slots: (array of { label, totalLikes, totalFeedback, authors }) the array of slots to display
  processAgenda(agenda) {
    let maxLikes = 0;
    let slotLabels = [];
    let mySlots = [];
    agenda.days.forEach(({ name: dayName, tracks }) => {
      tracks.forEach(({ name: trackName, slots }) => {
        slots.forEach(({ start, contents: { type, totalLikes, feedback, authors } = {} }) => {
          if (type == 'TALK') {
            const totalFeedback = feedback && feedback.entriesCount || 0;
            const label = createLabel(dayName, trackName, start);
            maxLikes = Math.max(maxLikes, totalLikes, totalFeedback)
            slotLabels.push(label)
            mySlots.push({ label, totalLikes, totalFeedback, authors });
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
      slots: mySlots
    };
  }
  
  createScale({ maxLikes, slotLabels }) {
    const x = scaleLinear()
      .domain([0, maxLikes])
      .range([0, this.width]);
    const y = scaleBand()
      .range([0, BAR_HEIGHT + slotLabels.length])
      .domain(slotLabels)
      .padding(.1);
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
      .selectAll(".bar")
      .data(slots)
      .enter();
    bars.append("rect")
      .attr("class", "bar1")
      .attr("x", 0)
      .attr("height", y.bandwidth() / 2)
      .attr("y", function ({ label }) { return y(label); })
      .attr("width", function ({ totalLikes }) { return x(totalLikes); });
      /*
    bars.append("rect")
      .attr("class", "bar2")
      .attr("x", function (d) { return x(d.year) + x.rangeBand() / 2; })
      .attr("width", x.rangeBand() / 2)
      .attr("y", function (d) { return y1(d.number); })
      .attr("height", function (d, i, j) { return height - y1(d.number); });
      */
  }

  render(agendaJSON) {
    const agenda = this.processAgenda(agendaJSON);
    const svg = this.svg;
    const { x, y } = this.createScale(agenda);
    this.clear();
    this.renderAxis(x, y);
    this.renderBars(agenda, x, y);
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
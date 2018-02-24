import { scaleLinear, scaleBand } from "d3-scale";
import { axisLeft, axisTop } from "d3-axis";
import { select } from 'd3-selection';
import { tsv } from 'd3-request';
import { map } from 'd3-collection';
import { forceSimulation } from 'd3-force';

function createLabel(dayName, trackName, start) {
  return `${dayName}-${start}-${trackName}`;
}

const CHART_MARGIN = 80;
const BAR_HEIGHT = 20;
const BAR_MARGIN_BOTTOM = 10;
const BAR_MARGIN_RIGHT = 10;
const LABEL_HEIGHT = 16;
const LABEL_MARGIN_TOP = 10;
const LABEL_MARGIN_LEFT = 16;
const LABEL_MARGIN_BOTTOM = 5;
const AVATAR_WIDTH = 80;

export default class AgendaChart {

  constructor({ 
    // selector to find the SVG where the component will render
    selector,

    // width of the chart, in pixels
    width = 600,
  }) {
    this.svg = select(selector);
    this.width = width;
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
              likes: totalLikes,
              feedback: totalFeedback, 
              authors,
              trackName, 
              title,
              start
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
      maxFeedback,
      slotLabels,
      slots: mySlots,
      totalHeight: mySlots.length * (
        LABEL_MARGIN_TOP + LABEL_HEIGHT + LABEL_MARGIN_BOTTOM + 
        BAR_HEIGHT * 2 +
        BAR_MARGIN_BOTTOM
      )
    };
  }
  
  createScale({ maxLikes, maxFeedback, slotLabels, totalHeight }) {
    const xLikes = scaleLinear()
      .domain([0, maxLikes])
      .range([0, this.width]);
    const xFeedback = scaleLinear()
      .domain([0, maxFeedback])
      .range([0, this.width]);
    const y = scaleBand()
      .rangeRound([0, totalHeight])
      .domain(slotLabels)
      .paddingInner(.1);
    return { xLikes, xFeedback, y };
  }

  clear() {
    this.svg
      .selectAll('*')
      .remove();
  }

  renderAxis(x, y) {
    const yAxis = axisLeft()
      .scale(y)
    ;
    this.chart.append("g")
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

  renderLabels({
    talkContainer
  }) {
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

    talkContainer.append("text")
      .attr("x", LABEL_MARGIN_LEFT)
      .attr("y", LABEL_MARGIN_TOP)
      .style("dominant-baseline", "middle")
      .attr("class", "talk-title")
      .text(({ trackName, title }) => `${trackName}: ${title}`);
  }

  renderAvatars({
    talkContainer,
  }) {
    const avatars = talkContainer.append("g")
      .attr("class", "avatars")
      .selectAll('avatar')
      .data(({ authors }) => authors)
      .enter()
    ;
    avatars.append("image")
      .attr("x", 0)
      .attr("y", 0)
      //.attr("x", -AVATAR_WIDTH/2)
      //.attr("y", LABEL_MARGIN_TOP + LABEL_HEIGHT + LABEL_MARGIN_BOTTOM)
      .attr("width", AVATAR_WIDTH)
      .attr("height", AVATAR_WIDTH)
      .attr("class", "avatar")
      .attr("xlink:href", ({ avatar }) => avatar)
      .attr("clip-path", "url(#avatar-clip)")
      .attr("transform", `translate(${-AVATAR_WIDTH / 2}, ${LABEL_MARGIN_TOP + LABEL_HEIGHT + LABEL_MARGIN_BOTTOM})`)
      .style("dominant-baseline", "middle")
      .append('title')
      .text(({ name }) => name)
    ;

  }

  renderBars({ 
    talkContainer,
    agenda: { slots }, 
    x, 
    yOffset,
    // one of: ['likes', 'feedback'] to render one bar or the other
    propertyName
  }) {
    const xMax = x.domain()[1];
    talkContainer.append("rect")
      .attr("class", slot => {
        const value = slot[propertyName];
        const barClass = 
          value > xMax * .8 ? 'hot' :
          value > xMax * .6 ? 'warm' :
          value < xMax * .2 ? 'cold' :
          ''
        ;

        return `talk-bar ${barClass}`
      })
      .attr("x", 0)
      .attr("y", yOffset)
      .attr("height", BAR_HEIGHT)
      .attr("width", slot => x(slot[propertyName]))
      .append("svg:title")
    ;
    talkContainer.append("text")
      .attr("class", "talk-bar-caption")
      .attr("x", slot => x(slot[propertyName]) + BAR_MARGIN_RIGHT)
      .attr("y", yOffset + BAR_HEIGHT / 2)
      .style("dominant-baseline", "middle")
      .text((slot) => `${slot[propertyName]} ${propertyName == 'likes'? 'likes' : 'feedback entries'}`)
    ;
  }

  renderTalks({
    agenda,
    rootContainer,
    xLikes,
    xFeedback,
    y
  }) {
    const talkContainer = rootContainer.append("g")
      .attr("class", "talk-container")
      .attr("transform", ({ label }) => `translate(0, ${y(label)})`)
    ;
    this.renderLabels({ talkContainer })
    this.renderBars({ 
      talkContainer, 
      agenda, 
      x: xLikes, 
      yOffset: LABEL_MARGIN_TOP + LABEL_HEIGHT,
      propertyName: 'likes' 
    });
    this.renderBars({ 
      talkContainer, 
      agenda, 
      x: xFeedback, 
      yOffset: LABEL_MARGIN_TOP + LABEL_HEIGHT + BAR_HEIGHT,
      propertyName: 'feedback' 
    });
    this.renderAvatars({ talkContainer })
  }

  renderRootContainer({ slots }) {
    const bars = this.chart
      .append("g")
      .attr("class", "talks")
      .selectAll(".talk-container")
      .data(slots)
      .enter();
    return bars;
  }

  appendDefs() {
    const avatarRadius = AVATAR_WIDTH / 2;
    const defs = this.svg.append("defs");
    defs.append("clipPath")
      .attr("id", "avatar-clip")
      .append("circle")
      .attr("cx", avatarRadius)
      .attr("cy", avatarRadius)
      .attr("r", avatarRadius)


  }

  render(agendaJSON, propertyName) {
    const agenda = this.processAgenda(agendaJSON, propertyName);
    const { xLikes, xFeedback, y } = this.createScale(agenda);
    this.clear();
    this.svg
      .attr('width', this.width - 2 * CHART_MARGIN)
      .attr('height', agenda.totalHeight)
    ;

    this.chart = this.svg.append('g')
      .attr('class', 'chart')
      .attr("transform", `translate(${CHART_MARGIN},${CHART_MARGIN})`)
    ;
    
    this.appendDefs();
    this.renderAxis(xLikes, y);
    const rootContainer = this.renderRootContainer(agenda);
    this.renderTalks({
      agenda,
      rootContainer,
      xLikes,
      xFeedback,
      y
    })


  }
}

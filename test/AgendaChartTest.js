import { JSDOM } from 'jsdom';
import fsp from 'fs-promise';
import path from 'path';
import AgendaChart from '../src/AgendaChart';
import assert from "assert";

describe('AgendaChart', () => {

  let jsdom;
  let agenda;
  let chart;

  beforeEach(() => {
    jsdom = new JSDOM('<html><body><svg></svg></body></html>');
    chart = new AgendaChart('svg');
    return fsp.readFile(path.resolve('./test-page/local-codemotion.json'))
      .then(contents => {
        agenda = JSON.parse(contents);
      });
  });

  it('processses the agenda correctly', () => {
    const { maxLikes, slotLabels, slots } = chart.processAgenda(agenda);

    // x axis
    assert.equal(325, maxLikes);

    // y axis
    assert.equal(150, slotLabels.length);
    assert.equal('24 november-09:00-Track 1', slotLabels[0]);
    assert.equal('24 november-09:30-Track 1', slotLabels[1]);
    assert.equal('24 november-10:00-Track 1', slotLabels[2]);
    assert.equal('24 november-10:00-Track 2', slotLabels[3]);
    
    // slots
    assert.equal(150, slots.length);
    const { label, totalLikes, totalFeedback, authors } = slots[0];
    assert.equal('24 november-09:00-Track 1', label);
    assert.equal(38, totalLikes);
    assert.equal(7, totalFeedback);
    assert.equal(4, authors.length);
  });

  it('renders correctly', () => {
    chart.render(agenda);
  });

});
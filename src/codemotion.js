import AgendaChart from './AgendaChart';

function fetchJSON(url) {
  return fetch(url, {
    method: 'get', 
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }, undefined
  }).then(function (response) {
    // if the response is not 2xx, throw error message 
    if (!response.ok) {
      if (response.headers.get('Content-Type') !== 'application/json') {
        const error = new Error('Error contacting koliseo.com: ' + response.status);
        error.status = response.status;
        throw error;
      } else {
        return response.json().then((json) => {
          const error = new Error(json.message || "Error contacting koliseo.com");
          error.status = response.status;
          throw error;
        })
      }
    }

    return response.json();
  });
}

const yearSelect = document.getElementById('year-select');
const chart = new AgendaChart({ 
  selector: '.agenda-chart', 
  width: 600,
  height: 1200
});

function renderChart() {
  const url = yearSelect.value;
  fetchJSON(url).then((agenda) => {
    chart.render(agenda);
  }).catch((e) => {
    console.log(e, e);
    document.body.insertAdjacentHTML('beforeend', `<div>${e.message}</div>`);
  })
}

yearSelect.addEventListener('change', renderChart);
renderChart();
/* analytics.js
   Requires DemoStore from data.js
*/

let zoneChart, driversChart, confChart, compareChart;

function getMode(){
  const on = document.getElementById("modeToggle").checked;
  return on ? "QUANTUM" : "CLASSICAL";
}

function setKPIs(mode){
  const buildings = DemoStore.state.buildings || [];
  const rows = buildings.map(b => {
    const r = DemoStore.computeRisk(b, mode);
    const c = DemoStore.computeConfidence(b, mode);
    return { r, c, b };
  });

  const avgRisk = rows.length ? rows.reduce((a,x)=>a+x.r.score,0)/rows.length : 0;
  const high = rows.filter(x => x.r.score >= 85).length;
  const mid  = rows.filter(x => x.r.score >= 65 && x.r.score < 85).length;

  const avgConf = rows.length ? rows.reduce((a,x)=>a+x.c,0)/rows.length : 0;

  // Noise sensitivity metric (demo): avg (noise * penaltyFactor)
  const noiseSense = rows.length ? rows.reduce((a,x)=>a + (Number(x.b.signals?.noise ?? 0)),0)/rows.length : 0;

  document.getElementById("kpiAvgRisk").textContent = avgRisk.toFixed(1);
  document.getElementById("kpiHighRisk").textContent = high;
  document.getElementById("kpiMidRisk").textContent = mid;
  document.getElementById("kpiAvgConf").textContent = (avgConf*100).toFixed(0) + "%";
  document.getElementById("kpiNoiseSense").textContent = noiseSense.toFixed(2);
  

}

function buildZoneChart(mode){
  const stats = DemoStore.getZoneStats(mode); // {labels, values}
  const ctx = document.getElementById("zoneBar");

  if (zoneChart) zoneChart.destroy();
  zoneChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: stats.labels,
      datasets: [{ label: "Avg Risk", data: stats.values }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } },
        x: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } }
      }
    }
  });
}

function buildDriversChart(mode){
  const d = DemoStore.getRiskDrivers(mode); // {labels, values}
  const ctx = document.getElementById("driversDoughnut");

  if (driversChart) driversChart.destroy();
  driversChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: d.labels,
      datasets: [{ data: d.values }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "rgba(232,238,252,.8)" } }
      }
    }
  });
}

function buildConfidenceChart(mode){
  const h = DemoStore.getConfidenceHist(mode); // {labels, values}
  const ctx = document.getElementById("confHist");

  if (confChart) confChart.destroy();
  confChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: h.labels,
      datasets: [{ label: "Buildings", data: h.values }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } },
        x: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } }
      }
    }
  });
}

function buildCompareLine(){
  const series = DemoStore.getCompareSeries(); // {labels, classical, quantum}
  const ctx = document.getElementById("compareLine");

  if (compareChart) compareChart.destroy();
  compareChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: series.labels,
      datasets: [
        { label: "Classical", data: series.classical, tension: 0.35, fill: false },
        { label: "Quantum-assisted", data: series.quantum, tension: 0.35, fill: false },
      ]
    },
    options: {
      plugins: { legend: { labels: { color: "rgba(232,238,252,.8)" } } },
      scales: {
        y: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } },
        x: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } }
      }
    }
  });
}

function renderAll(){
  const mode = getMode();
  setKPIs(mode);
  buildZoneChart(mode);
  buildDriversChart(mode);
  buildConfidenceChart(mode);
  buildCompareLine(); // always show both
}

document.addEventListener("DOMContentLoaded", () => {
  // ensure alerts exist too (optional)
  DemoStore.ensureAlerts?.();

  document.getElementById("modeToggle").addEventListener("change", renderAll);
  renderAll();
});

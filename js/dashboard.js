let lineChart, barChart;

function setKpis(){
  const s = DemoStore.state;

  document.getElementById("kpiStatus").textContent = s.systemStatus;
  document.getElementById("kpiStatusHint").textContent =
    (s.systemStatus === "Operational") ? "All core services running" : "High alert load / degraded monitoring";

  document.getElementById("kpiBuildings").textContent = s.buildingsMonitored;
  document.getElementById("kpiSensors").textContent = `${s.sensorsActive}/${s.sensorsTotal}`;

  const pct = Math.round((s.sensorsActive / s.sensorsTotal) * 1000) / 10;
  document.getElementById("kpiSensorsHint").textContent = `${pct}% online`;

  document.getElementById("kpiMinor").textContent = s.minorAnomalies;
  document.getElementById("kpiCritical").textContent = s.criticalAlerts;
}

function renderAlerts(){
  const wrap = document.getElementById("recentAlerts");
  wrap.innerHTML = "";

  DemoStore.state.recentAlerts.slice(0,5).forEach(a => {
    const badgeClass = a.severity === "critical" ? "danger" : (a.severity === "warning" ? "warn" : "safe");
    const badgeText = a.severity.toUpperCase();

    const div = document.createElement("div");
    div.className = "alertItem";
    div.innerHTML = `
      <div class="alertLeft">
        <div class="alertTitle">${a.title}</div>
        <div class="alertMeta">${a.loc} • ${a.time} • Risk ${a.risk}</div>
        <div class="alertMeta">ID: ${a.id}</div>
      </div>
      <!-- ✅ changed -->
      <div class="statusBadge ${badgeClass}">${badgeText}</div>
    `;

    div.style.cursor = "pointer";
    div.addEventListener("click", () => {
      const found = DemoStore.state.buildings.find(b => (a.loc || "").includes(b.name));

      if (found){
        localStorage.setItem("IDM_SELECTED_BUILDING", found.id);
        DemoStore.state.selectedBuildingId = found.id;
      } else {
        const fallback = DemoStore.state.buildings[0];
        if (fallback){
          localStorage.setItem("IDM_SELECTED_BUILDING", fallback.id);
          DemoStore.state.selectedBuildingId = fallback.id;
        }
      }

      window.location.href = "building.html";
    });

    wrap.appendChild(div);
  });
}

function buildCharts(){
  const s = DemoStore.state;

  const ctx1 = document.getElementById("lineResonance");
  lineChart = new Chart(ctx1, {
    type: "line",
    data: {
      labels: ["Day1","Day2","Day3","Day4","Day5","Day6","Day7"],
      datasets: [{
        label: "Avg Δf/f",
        data: s.resonance7d,
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } },
        x: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } }
      }
    }
  });

  const ctx2 = document.getElementById("barAlerts");
  barChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: s.alertsByDay.labels,
      datasets: [
        { label:"Critical", data: s.alertsByDay.critical },
        { label:"Warning",  data: s.alertsByDay.warning },
        { label:"Info",     data: s.alertsByDay.info },
      ]
    },
    options: {
      plugins: { legend: { labels: { color: "rgba(232,238,252,.7)" } } },
      scales: {
        y: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } },
        x: { ticks: { color: "rgba(232,238,252,.7)" }, grid:{ color:"rgba(255,255,255,.06)" } }
      }
    }
  });
}

function exportSummary(){
  const s = DemoStore.state;
  const summary = {
    systemStatus: s.systemStatus,
    buildingsMonitored: s.buildingsMonitored,
    sensors: { active: s.sensorsActive, total: s.sensorsTotal },
    minorAnomalies: s.minorAnomalies,
    criticalAlerts: s.criticalAlerts,
    timestamp: new Date().toISOString(),
    buildings: s.buildings.map(b => {
      const r = DemoStore.computeRisk(b);
      return { ...b, riskScore: r.score, level: r.level };
    })
  };

  const blob = new Blob([JSON.stringify(summary, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "damage_mapper_summary.json";
  a.click();
  URL.revokeObjectURL(url);
}

function runDemoScenario(){
  DemoStore.state.recentAlerts.unshift({
    id:"AL-" + Math.floor(1000 + Math.random()*9000),
    severity:"warning",
    title:"Demo scenario loaded: post-event monitoring started",
    loc:"All blocks",
    time:"Now",
    risk:55
  });
  renderAlerts();
}

function simulateNewReadings(){
  DemoStore.simulateTick();
  setKpis();

  const newVal = -0.008 - Math.random()*0.01;
  DemoStore.state.resonance7d.push(Number(newVal.toFixed(3)));
  DemoStore.state.resonance7d.shift();

  lineChart.data.datasets[0].data = DemoStore.state.resonance7d;
  lineChart.update();
}

document.addEventListener("DOMContentLoaded", () => {
  setKpis();
  renderAlerts();
  buildCharts();

  document.getElementById("exportSummaryBtn").addEventListener("click", exportSummary);
  document.getElementById("runDemoBtn").addEventListener("click", (e)=>{ e.preventDefault(); runDemoScenario(); });
  document.getElementById("simulateTickBtn").addEventListener("click", simulateNewReadings);
});

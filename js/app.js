// ---------- Demo data generator (Prototype) ----------
function generateDemoScenario(scenarioName = "Post-Strike Day 1") {
  // Fake regions & buildings for simulation
  const regions = [
    { id: "R1", name: "North Zone" },
    { id: "R2", name: "Central Zone" },
    { id: "R3", name: "South Zone" }
  ];

  const buildings = [];
  for (let i = 1; i <= 18; i++) {
    const df = +(Math.random() * 0.06).toFixed(4);         // resonance shift ratio
    const ae = Math.floor(Math.random() * 30);             // acoustic emissions/day
    const accel = +(Math.random() * 1.8).toFixed(2);       // trend acceleration
    const noise = +(Math.random() * 0.9).toFixed(2);       // noise score

    // Simple risk engine (mock but logical)
    const risk = computeRiskScore({ df, ae, accel, noise });

    buildings.push({
      id: `B-${String(i).padStart(3, "0")}`,
      name: `Building ${i}`,
      regionId: regions[Math.floor(Math.random() * regions.length)].id,
      floors: Math.floor(1 + Math.random() * 7),
      material: Math.random() > 0.5 ? "Reinforced Concrete" : "Masonry",
      signals: { df, ae, accel, noise },
      riskScore: risk.score,
      status: risk.status,
      recommendation: risk.recommendation,
      lastUpdated: new Date().toISOString()
    });
  }

  // Alerts based on risk
  const alerts = buildings
    .filter(b => b.riskScore >= 70)
    .slice(0, 6)
    .map((b, idx) => ({
      id: `A-${Date.now()}-${idx}`,
      buildingId: b.id,
      severity: b.riskScore >= 85 ? "CRITICAL" : "WARNING",
      message: b.riskScore >= 85 ? "High collapse risk detected." : "Significant anomaly trend detected.",
      status: "ACTIVE",
      acknowledged: false,
      timestamp: new Date().toISOString()
    }));

  // Overview KPIs
  const activeSensors = 310 + Math.floor(Math.random() * 40);
  const totalSensors = 350;
  const criticalAlerts = alerts.filter(a => a.severity === "CRITICAL").length;
  const minorAnomalies = buildings.filter(b => b.riskScore >= 55 && b.riskScore < 70).length;

  const overview = {
    scenarioName,
    systemStatus: "OPERATIONAL",
    buildingsMonitored: buildings.length,
    activeSensors,
    totalSensors,
    minorAnomalies,
    criticalAlerts,
    lastRun: new Date().toISOString()
  };

  return { overview, regions, buildings, alerts };
}

// Risk formula (simple + explainable)
function computeRiskScore({ df, ae, accel, noise }) {
  // Weights (tunable)
  const w_df = 950;        // resonance shift is strong
  const w_ae = 1.6;        // AE rate moderate
  const w_acc = 14;        // acceleration strong
  const w_noise = -8;      // noise slightly reduces confidence

  let raw = (df * w_df) + (ae * w_ae) + (accel * w_acc) + (noise * w_noise);
  raw = Math.max(0, Math.min(100, raw));

  let status, recommendation;
  if (raw >= 85) {
    status = "EVACUATE";
    recommendation = "Evacuate immediately + engineering inspection.";
  } else if (raw >= 65) {
    status = "MONITOR";
    recommendation = "Monitor continuously + prepare reinforcement.";
  } else {
    status = "SAFE";
    recommendation = "Safe for temporary stay; continue periodic checks.";
  }

  return { score: Math.round(raw), status, recommendation };
}

// ---------- UI wiring ----------
const btnRunDemo = document.getElementById("btnRunDemo");
const btnControlCenter = document.getElementById("btnControlCenter");
const demoStatus = document.getElementById("demoStatus");

function setStatus(text, type = "info") {
  const title = demoStatus.querySelector(".status-title");
  const body = demoStatus.querySelector(".status-body");

  title.textContent = type === "ok" ? "Demo Loaded" : "Demo Status";
  body.innerHTML = text;
}

btnRunDemo?.addEventListener("click", () => {
  const scenarios = [
    "Post-Strike Day 1",
    "Aftershocks Day 3",
    "Rain & Load Day 7",
    "Long-term Deterioration Day 14"
  ];
  const chosen = scenarios[Math.floor(Math.random() * scenarios.length)];
  const data = generateDemoScenario(chosen);

  // Save to localStorage for other pages (dashboard, map, alerts)
  localStorage.setItem("IDM_DEMO_DATA", JSON.stringify(data));

  setStatus(
    `Scenario <b>${data.overview.scenarioName}</b> loaded.<br/>
     Buildings: <b>${data.overview.buildingsMonitored}</b> • Active Sensors: <b>${data.overview.activeSensors}/${data.overview.totalSensors}</b><br/>
     Critical Alerts: <b>${data.overview.criticalAlerts}</b> • Minor Anomalies: <b>${data.overview.minorAnomalies}</b><br/>
     You can now open the Control Center.`,
    "ok"
  );
});

btnControlCenter?.addEventListener("click", () => {
  // If no demo data, auto-generate a default scenario (so it never feels broken)
  if (!localStorage.getItem("IDM_DEMO_DATA")) {
    const data = generateDemoScenario("Post-Strike Day 1 (Auto)");
    localStorage.setItem("IDM_DEMO_DATA", JSON.stringify(data));
  }
window.location.href = "damage-mapper/dashboard.html";
});

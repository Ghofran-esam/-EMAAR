// risk.js
// مسؤول عن: computeRisk (Classical/Quantum) + confidence + analytics helpers

(function () {
  const { clamp } = window.IDM_Utils || {};

  function computeConfidence(building, mode = "CLASSICAL") {
    const n = Number(building.signals?.noise ?? 0); // 0..1
    const df = Math.abs(Number(building.signals?.df ?? 0));
    const ae = Number(building.signals?.ae ?? 0);
    const accel = Math.abs(Number(building.signals?.accel ?? 0));

    const strength = clamp((df * 12) + (ae / 40) + (accel / 3), 0, 1);
    const noisePenalty = (mode === "QUANTUM") ? (n * 0.55) : (n * 0.85);

    return clamp(0.25 + (0.65 * strength) - noisePenalty, 0, 1);
  }

  function computeRisk(building, mode = "CLASSICAL") {
    const s = building.signals || {};
    const df = Number(s.df ?? 0);
    const ae = Number(s.ae ?? 0);
    const accel = Number(s.accel ?? 0);
    const noise = Number(s.noise ?? 0);

    let w_df = 950;
    let w_ae = 1.6;
    let w_acc = 14;
    let w_noise = -8;

    // Quantum-assisted tweaks (demo)
    if (mode === "QUANTUM") {
      w_noise = -4.5;
      w_df = 1020;
    }

    let raw = (df * w_df) + (ae * w_ae) + (accel * w_acc) + (noise * w_noise);
    raw = clamp(raw, 0, 100);

    const score = Math.round(raw);

    let level, recommendation;
    if (score >= 85) {
      level = "danger";
      recommendation = "Evacuate immediately + engineering inspection.";
    } else if (score >= 65) {
      level = "warn";
      recommendation = "Monitor continuously + prepare reinforcement.";
    } else {
      level = "safe";
      recommendation = "Safe for temporary stay; continue periodic checks.";
    }

    const reasons = [
      { key: "Δf/f", value: df.toFixed(4) },
      { key: "AE events/day", value: ae },
      { key: "Trend acceleration", value: accel.toFixed(2) },
      { key: "Noise score", value: noise.toFixed(2) },
    ];

    return { score, level, recommendation, reasons };
  }

  // ---- Analytics helpers (used by analytics.js) ----
  function getZoneStats(state, mode = "CLASSICAL") {
    const zones = ["North Zone", "Central Zone", "South Zone"];
    const vals = zones.map(z => {
      const b = (state.buildings || []).filter(x => x.area === z);
      if (!b.length) return 0;
      const avg = b.reduce((a, x) => a + computeRisk(x, mode).score, 0) / b.length;
      return Number(avg.toFixed(1));
    });
    return { labels: zones, values: vals };
  }

  function getRiskDrivers(state, mode = "CLASSICAL") {
    const b = state.buildings || [];
    let c_df = 0, c_ae = 0, c_acc = 0;

    b.forEach(x => {
      const df = Number(x.signals?.df ?? 0);
      const ae = Number(x.signals?.ae ?? 0);
      const accel = Number(x.signals?.accel ?? 0);

      const w_df = (mode === "QUANTUM") ? 1020 : 950;
      const w_ae = 1.6;
      const w_acc = 14;

      c_df += Math.abs(df * w_df);
      c_ae += Math.abs(ae * w_ae);
      c_acc += Math.abs(accel * w_acc);
    });

    const sum = c_df + c_ae + c_acc || 1;
    const p1 = Math.round((c_df / sum) * 100);
    const p2 = Math.round((c_ae / sum) * 100);
    const p3 = Math.max(0, 100 - p1 - p2);

    return {
      labels: ["Resonance shift (Δf/f)", "Acoustic Emissions (AE)", "Trend acceleration"],
      values: [p1, p2, p3]
    };
  }

  function getConfidenceHist(state, mode = "CLASSICAL") {
    const bins = [0, 0, 0, 0, 0];
    const b = state.buildings || [];
    b.forEach(x => {
      const c = computeConfidence(x, mode);
      const pct = Math.round(c * 100);
      const idx = Math.min(4, Math.floor(pct / 20));
      bins[idx]++;
    });
    return { labels: ["0–20%","20–40%","40–60%","60–80%","80–100%"], values: bins };
  }

  function getCompareSeries(state) {
    const b = state.buildings || [];
    const labels = ["Day1","Day2","Day3","Day4","Day5","Day6","Day7"];
    const baseC = b.length ? b.reduce((a,x)=>a+computeRisk(x,"CLASSICAL").score,0)/b.length : 50;
    const baseQ = b.length ? b.reduce((a,x)=>a+computeRisk(x,"QUANTUM").score,0)/b.length : 48;

    function jitter(base) {
      return labels.map((_, i) =>
        Number((base + (Math.sin(i) * 2) + (Math.random() - 0.5) * 2).toFixed(1))
      );
    }
    return { labels, classical: jitter(baseC), quantum: jitter(baseQ) };
  }

  window.IDM_Risk = {
    computeRisk,
    computeConfidence,
    getZoneStats,
    getRiskDrivers,
    getConfidenceHist,
    getCompareSeries,
  };
})();

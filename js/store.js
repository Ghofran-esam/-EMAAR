// store.js
// مسؤول عن: localStorage load/save + adapt generator format -> state + simulateTick
// يعتمد على: IDM_Utils (يتم تعريفها هنا)

(function () {
  // ---------- Utils ----------
  const Utils = {
    clamp(n, a, b) {
      return Math.max(a, Math.min(b, n));
    },
    safeJsonParse(s) {
      try { return JSON.parse(s); } catch { return null; }
    },
    nowISO() { return new Date().toISOString(); }
  };
  window.IDM_Utils = Utils;

  // ---------- Keys ----------
  const KEYS = {
    DEMO: "IDM_DEMO_DATA",
    SELECTED: "IDM_SELECTED_BUILDING",
  };
  window.IDM_KEYS = KEYS;

  // ---------- Raw Load/Save ----------
  function loadDemoRaw() {
    const s = localStorage.getItem(KEYS.DEMO);
    if (!s) return null;
    return Utils.safeJsonParse(s);
  }

  function saveDemoRaw(raw) {
    localStorage.setItem(KEYS.DEMO, JSON.stringify(raw));
  }

  // ---------- Ensure Demo Data Exists ----------
  function ensureDemoData() {
    const raw = loadDemoRaw();
    if (raw) return raw;

    const fallback = {
      overview: {
        scenarioName: "Post-Strike Day 1 (Auto)",
        systemStatus: "OPERATIONAL",
        buildingsMonitored: 18,
        activeSensors: 320,
        totalSensors: 350,
        minorAnomalies: 5,
        criticalAlerts: 2,
        lastRun: Utils.nowISO(),
      },
      regions: [
        { id: "R1", name: "North Zone" },
        { id: "R2", name: "Central Zone" },
        { id: "R3", name: "South Zone" },
      ],
      buildings: [],
      alerts: [],
    };

    saveDemoRaw(fallback);
    return fallback;
  }

  // ---------- Adapter: raw -> state ----------
  function adapt(raw) {
    const overview = raw?.overview || {};
    const buildingsRaw = raw?.buildings || [];
    const alertsRaw = raw?.alerts || [];

    const baseLat = 31.5207, baseLng = 34.4534;

    const buildings = buildingsRaw.map((b) => {
      const latJitter = (Math.random() - 0.5) * 0.05;
      const lngJitter = (Math.random() - 0.5) * 0.06;

      const area =
        b.regionId === "R1" ? "North Zone" :
        b.regionId === "R2" ? "Central Zone" : "South Zone";

      return {
        id: b.id,
        name: b.name,
        area,
        lat: baseLat + latJitter,
        lng: baseLng + lngJitter,
        floors: b.floors,
        material: b.material,
        signals: b.signals, // {df, ae, accel, noise}
        lastUpdated: b.lastUpdated,
      };
    });

    const recentAlerts = alertsRaw.map((a) => {
      const building = buildingsRaw.find((x) => x.id === a.buildingId);
      const loc = building ? building.name : a.buildingId;

      return {
        id: a.id,
        severity: a.severity === "CRITICAL" ? "critical" : "warning",
        title: a.message,
        loc,
        time: new Date(a.timestamp).toLocaleString(),
        risk: building?.riskScore ?? (a.severity === "CRITICAL" ? 90 : 75),
      };
    });

    const resonance7d = Array.from({ length: 7 }, () => {
      const v = -0.008 - Math.random() * 0.012;
      return Number(v.toFixed(3));
    });

    const alertsByDay = {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      critical: Array.from({ length: 7 }, () => Math.floor(Math.random() * 3)),
      warning: Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)),
      info: Array.from({ length: 7 }, () => Math.floor(Math.random() * 6)),
    };

    return {
      systemStatus:
        (overview.systemStatus || "OPERATIONAL").toLowerCase() === "operational"
          ? "Operational"
          : "Degraded",
      buildingsMonitored: overview.buildingsMonitored ?? buildings.length,
      sensorsActive: overview.activeSensors ?? 310,
      sensorsTotal: overview.totalSensors ?? 350,
      minorAnomalies: overview.minorAnomalies ?? 0,
      criticalAlerts: overview.criticalAlerts ?? 0,

      buildings,
      recentAlerts,

      resonance7d,
      alertsByDay,

      selectedBuildingId: null,

      // sensors attached لاحقاً من sensorsStore.js
      sensors: [],
    };
  }

  // ---------- If buildings missing, create minimal fake ----------
  function ensureBuildings(state) {
    if (Array.isArray(state.buildings) && state.buildings.length) return;

    const baseLat = 31.5207, baseLng = 34.4534;

    state.buildings = Array.from({ length: 18 }, (_, i) => {
      const latJitter = (Math.random() - 0.5) * 0.05;
      const lngJitter = (Math.random() - 0.5) * 0.06;

      return {
        id: `B-${String(i + 1).padStart(3, "0")}`,
        name: `Building ${i + 1}`,
        area: i < 6 ? "North Zone" : i < 12 ? "Central Zone" : "South Zone",
        lat: baseLat + latJitter,
        lng: baseLng + lngJitter,
        floors: 1 + Math.floor(Math.random() * 7),
        material: Math.random() > 0.5 ? "Reinforced Concrete" : "Masonry",
        signals: {
          df: Number((Math.random() * 0.06).toFixed(4)),
          ae: Math.floor(Math.random() * 30),
          accel: Number((Math.random() * 1.8).toFixed(2)),
          noise: Number((Math.random() * 0.9).toFixed(2)),
        },
        lastUpdated: Utils.nowISO(),
      };
    });

    state.buildingsMonitored = state.buildings.length;
  }

  // ---------- Selected building helpers ----------
  function getSelectedBuildingId(state) {
    return localStorage.getItem(KEYS.SELECTED) || state.selectedBuildingId || null;
  }

  function setSelectedBuildingId(state, id) {
    state.selectedBuildingId = id;
    localStorage.setItem(KEYS.SELECTED, id);
  }

  // ---------- simulateTick (updates building signals + KPIs + calls sensors tick if exists) ----------
  function simulateTick(state) {
    state.buildings.forEach((b) => {
      b.signals.df = Number((b.signals.df + (Math.random() - 0.5) * 0.002).toFixed(4));
      b.signals.ae = Math.max(0, b.signals.ae + Math.floor((Math.random() - 0.4) * 3));
      b.signals.accel = Number((b.signals.accel + (Math.random() - 0.4) * 0.12).toFixed(2));
      b.signals.noise = Utils.clamp(b.signals.noise + (Math.random() - 0.5) * 0.08, 0, 1);
      b.lastUpdated = Utils.nowISO();
    });

    // ✅ تحديث KPIs بناءً على computeRisk من DemoStore (بعد bootstrap)
    if (window.DemoStore && typeof window.DemoStore.computeRisk === "function") {
      let minor = 0, critical = 0;
      state.buildings.forEach((b) => {
        const r = window.DemoStore.computeRisk(b, "CLASSICAL");
        if (r.score >= 85) critical++;
        else if (r.score >= 65) minor++;
      });
      state.minorAnomalies = minor;
      state.criticalAlerts = critical;
    }

    // ✅ تحديث sensors عبر SensorsStore إذا موجود
    if (window.IDM_SensorsStore && typeof window.IDM_SensorsStore.tickSensors === "function") {
      window.IDM_SensorsStore.tickSensors(state);
    }
  }

  // ---------- Public Store API ----------
  window.IDM_Store = {
    ensureDemoData,
    adapt,
    ensureBuildings,
    loadDemoRaw,
    saveDemoRaw,
    getSelectedBuildingId,
    setSelectedBuildingId,
    simulateTick,
  };
})();

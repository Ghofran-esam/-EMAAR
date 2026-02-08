// sensorsStore.js
// مسؤول عن: توليد sensors من buildings + load/save + tickSensors (battery/lastSeen/readings)

(function () {
  const { clamp } = window.IDM_Utils || {};
  const SENSORS_KEY = "IDM_SENSORS";

  function loadSensors() {
    const s = localStorage.getItem(SENSORS_KEY);
    if (!s) return null;
    try { return JSON.parse(s); } catch { return null; }
  }

  function saveSensors(sensors) {
    localStorage.setItem(SENSORS_KEY, JSON.stringify(sensors));
  }

  function buildSensorsFromBuildings(buildings) {
    const sensors = [];
    const types = ["Accelerometer", "Acoustic", "Hybrid"];
    const nodes = ["Column-1", "Column-2", "Beam-A", "Beam-B", "Core", "Corner"];
    const now = Date.now();

    buildings.forEach((b) => {
      const count = 2 + Math.floor(Math.random() * 5); // 2..6 per building
      for (let i = 0; i < count; i++) {
        const id = `S-${b.id.replace("B-", "")}-${String(i + 1).padStart(2, "0")}`;
        const battery = Math.floor(8 + Math.random() * 92);
        const noise = clamp(Number((Math.random() * 0.95).toFixed(2)), 0, 1);

        let status = "ACTIVE";
        if (battery <= 18) status = "LOW_BATTERY";
        if (Math.random() < 0.1) status = "OFFLINE";

        const minsAgo =
          status === "OFFLINE"
            ? 180 + Math.floor(Math.random() * 900)
            : 1 + Math.floor(Math.random() * 90);

        const lastSeen = new Date(now - minsAgo * 60000).toISOString();

        const lat = b.lat + (Math.random() - 0.5) * 0.0025;
        const lng = b.lng + (Math.random() - 0.5) * 0.0025;

        sensors.push({
          id,
          buildingId: b.id,
          type: types[Math.floor(Math.random() * types.length)],
          node: nodes[Math.floor(Math.random() * nodes.length)],
          status, // ACTIVE | OFFLINE | LOW_BATTERY
          battery,
          lastSeen,
          noise,
          lastReading: {
            df: Number((b.signals?.df ?? 0).toFixed(4)),
            ae: b.signals?.ae ?? 0,
            accel: Number((b.signals?.accel ?? 0).toFixed(2)),
          },
          lat,
          lng,
        });
      }
    });

    saveSensors(sensors);
    return sensors;
  }

  function ensureSensors(state) {
    let sensors = loadSensors();
    if (!Array.isArray(sensors) || sensors.length === 0) {
      sensors = buildSensorsFromBuildings(state.buildings || []);
    }
    state.sensors = sensors;
    return sensors;
  }

  // called by store.simulateTick(state)
  function tickSensors(state) {
    const sensors = state.sensors || [];
    sensors.forEach((s) => {
      if (!s.lastReading) s.lastReading = {};

      s.lastReading.df = Number(((s.lastReading.df ?? 0) + (Math.random() - 0.5) * 0.0008).toFixed(4));
      s.lastReading.ae = Math.max(0, (s.lastReading.ae ?? 0) + Math.floor((Math.random() - 0.4) * 2));
      s.lastReading.accel = Number(((s.lastReading.accel ?? 0) + (Math.random() - 0.5) * 0.06).toFixed(2));

      if (typeof s.battery === "number") {
        const drain = Math.random() < 0.35 ? 1 : 0;
        s.battery = clamp(s.battery - drain, 0, 100);
      }

      if (s.status !== "OFFLINE") {
        s.lastSeen = new Date().toISOString();
      }

      if (s.status !== "OFFLINE") {
        if (s.battery <= 18) s.status = "LOW_BATTERY";
        else s.status = "ACTIVE";
      }
    });

    saveSensors(sensors);
  }

  window.IDM_SensorsStore = {
    ensureSensors,
    tickSensors,
    buildSensorsFromBuildings,
    loadSensors,
    saveSensors,
  };
})();

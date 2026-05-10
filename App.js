import React, { useState, useEffect } from "react";

const VAC_START = new Date(2026, 4, 30); 
const VAC_END = new Date(2026, 5, 15);

export default function App() {
  const [chores, setChores] = useState([]);
  const [defaults, setDefaults] = useState(() => {
    const saved = localStorage.getItem("my_defaults");
    return saved ? JSON.parse(saved) : [{ id: 1, name: "Morning Tea", s: "06:30", cat: "Kitchen" }];
  });
  const [isHoliday, setIsHoliday] = useState(false);
  const [isVacation, setIsVacation] = useState(false);
  const [tiredId, setTiredId] = useState(null);

  useEffect(() => {
    const now = new Date();
    if (now >= VAC_START && now <= VAC_END) {
      setIsVacation(true);
      setChores([]);
    } else {
      setChores([...defaults]);
    }
    if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }
  }, [defaults]);

  const triggerNotify = (title, body, timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const target = new Date();
    target.setHours(h, m, 0);
    const delay = target.getTime() - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        if (Notification.permission === "granted") {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, { body, icon: "/icon.png" });
          });
        }
      }, delay);
    }
  };

  const addItem = (name, time, saveDefault) => {
    if (!name || !time) return;
    const item = { id: Date.now(), name, s: time, cat: isVacation ? "Travel" : "Kitchen" };
    if (saveDefault) {
      const newDefs = [...defaults, item];
      setDefaults(newDefs);
      localStorage.setItem("my_defaults", JSON.stringify(newDefs));
    } else {
      setChores([...chores, item]);
    }

    // Schedule 15m warning and start reminder
    const [h, m] = time.split(":").map(Number);
    triggerNotify("Reminder", `${name} in 15 mins`, `${h}:${m-15}`);
    triggerNotify("Task Start", `Time for ${name}`, time);
  };

  const assignAdi = (c) => {
    window.location.href = `sms:Adi&body=${encodeURIComponent("Hey Adi, can you do: " + c.name + " at " + c.s + "?")}`;
    setTiredId(null);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "'Jost', sans-serif", maxWidth: "400px", margin: "auto" }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }}>{isVacation ? "🏖️ Vacation" : "Our Vision Board"}</h1>
      
      {!isVacation && !isHoliday && (
        <button onClick={() => setIsHoliday(true)} style={{ width: "100%", padding: "10px", background: "#f0fdf4", border: "none", borderRadius: "10px", marginBottom: "15px" }}>Today is a Holiday 🍦</button>
      )}

      {isHoliday ? <p>Enjoy your rest!</p> : chores.map(c => (
        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "15px", background: "#fff", borderRadius: "12px", marginBottom: "10px", border: "1px solid #eee" }}>
          <div><strong>{c.name}</strong><br/><small>{c.s}</small></div>
          <button onClick={() => setTiredId(c.id)} style={{ background: "#FBEAF0", border: "none", borderRadius: "5px" }}>Tired?</button>
        </div>
      ))}

      <div style={{ marginTop: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "12px" }}>
        <input id="tn" placeholder="Name..." style={{ width: "100%", padding: "10px", marginBottom: "5px" }} />
        <input id="tt" type="time" style={{ padding: "10px", marginBottom: "10px" }} />
        <button onClick={() => addItem(document.getElementById('tn').value, document.getElementById('tt').value, false)} style={{ width: "100%", background: "#000", color: "#fff", padding: "10px", borderRadius: "8px" }}>Add Task</button>
        <button onClick={() => addItem(document.getElementById('tn').value, document.getElementById('tt').value, true)} style={{ width: "100%", marginTop: "5px", background: "none", border: "none", fontSize: "12px" }}>Save as Everyday Task</button>
      </div>

      {tiredId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "20px", width: "80%" }}>
            <button onClick={() => assignAdi(chores.find(x => x.id === tiredId))} style={{ width: "100%", padding: "15px", background: "#1D9E75", color: "#fff", borderRadius: "10px", border: "none" }}>Assign to Adi</button>
            <button onClick={() => setTiredId(null)} style={{ width: "100%", marginTop: "10px", background: "none", border: "none" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
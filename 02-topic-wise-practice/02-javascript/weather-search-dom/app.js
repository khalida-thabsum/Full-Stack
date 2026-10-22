// DOM events + Fetch API with the free Open-Meteo APIs (no key needed).
// Shows: input with debounce, keyboard navigation (ArrowUp/Down/Enter/Escape),
// click delegation, Promise.all, async/await, and building elements from data.

const cityInput = document.getElementById("city");
const list = document.getElementById("suggestions");
const msg = document.getElementById("msg");
let results = [];
let active = -1;
const recent = [];

const WEATHER_TEXT = { 0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 51: "Light drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 80: "Rain showers", 95: "Thunderstorm" };
const describe = code => WEATHER_TEXT[code] || `Weather code ${code}`;

// Debounce: wait until the user stops typing for 350 ms before calling the API
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

async function searchCities(text) {
  if (text.trim().length < 2) { list.hidden = true; return; }
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5`);
    const data = await res.json();
    results = data.results || [];
    active = -1;
    renderSuggestions();
    msg.textContent = results.length ? "" : "No matching city";
  } catch {
    msg.textContent = "Could not reach the city search service";
  }
}

function renderSuggestions() {
  list.innerHTML = "";
  results.forEach((r, i) => {
    const li = document.createElement("li");
    li.textContent = `${r.name}${r.admin1 ? ", " + r.admin1 : ""}, ${r.country}`;
    li.dataset.index = i;
    if (i === active) li.classList.add("active");
    list.appendChild(li);
  });
  list.hidden = results.length === 0;
}

async function showWeather(place) {
  list.hidden = true;
  cityInput.value = place.name;
  msg.textContent = "Loading...";
  const base = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&timezone=auto`;
  try {
    const [nowRes, dailyRes] = await Promise.all([
      fetch(`${base}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`),
      fetch(`${base}&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=5`)
    ]);
    if (!nowRes.ok || !dailyRes.ok) throw new Error("Weather service error");
    const now = (await nowRes.json()).current;
    const daily = (await dailyRes.json()).daily;

    document.getElementById("place").textContent = `${place.name}, ${place.country}`;
    document.getElementById("temp").textContent = Math.round(now.temperature_2m);
    document.getElementById("desc").textContent = describe(now.weather_code);
    document.getElementById("wind").textContent = now.wind_speed_10m;
    document.getElementById("hum").textContent = now.relative_humidity_2m;

    const days = document.getElementById("days");
    days.innerHTML = "";
    daily.time.forEach((d, i) => {
      const div = document.createElement("div");
      const name = new Date(d).toLocaleDateString("en-IN", { weekday: "short" });
      div.innerHTML = `<b>${name}</b><br>${Math.round(daily.temperature_2m_max[i])}&deg; / ${Math.round(daily.temperature_2m_min[i])}&deg;<br><small>${describe(daily.weather_code[i])}</small>`;
      days.appendChild(div);
    });
    document.getElementById("card").hidden = false;
    msg.textContent = "";
    addRecent(place);
  } catch (err) {
    msg.textContent = `Could not load weather: ${err.message}`;
  }
}

function addRecent(place) {
  if (recent.some(p => p.id === place.id)) return;
  recent.unshift(place);
  recent.length = Math.min(recent.length, 5);
  const box = document.getElementById("recent");
  box.innerHTML = "";
  recent.forEach(p => {
    const b = document.createElement("button");
    b.textContent = p.name;
    b.addEventListener("click", () => showWeather(p));
    box.appendChild(b);
  });
}

cityInput.addEventListener("input", debounce(e => searchCities(e.target.value), 350));

cityInput.addEventListener("keydown", e => {
  if (list.hidden) return;
  if (e.key === "ArrowDown") { active = (active + 1) % results.length; renderSuggestions(); e.preventDefault(); }
  else if (e.key === "ArrowUp") { active = (active - 1 + results.length) % results.length; renderSuggestions(); e.preventDefault(); }
  else if (e.key === "Enter" && active >= 0) { showWeather(results[active]); }
  else if (e.key === "Escape") { list.hidden = true; }
});

// Event delegation: one listener on the list handles clicks on any suggestion
list.addEventListener("click", e => {
  const li = e.target.closest("li");
  if (li) showWeather(results[li.dataset.index]);
});

document.addEventListener("click", e => {
  if (!e.target.closest(".search")) list.hidden = true;
});

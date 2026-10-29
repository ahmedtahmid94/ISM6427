const DEFAULT = { name: "Boca Raton", lat: 26.3683, lon: -80.1289 };

const CODES = {
  0: ["Clear", "☀️"], 1: ["Mostly Clear", "🌤️"], 2: ["Partly Cloudy", "⛅"], 3: ["Cloudy", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Fog", "🌫️"],
  51: ["Drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Drizzle", "🌦️"],
  61: ["Rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy Rain", "🌧️"],
  71: ["Snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy Snow", "❄️"],
  80: ["Showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Heavy Showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm", "⛈️"], 99: ["Thunderstorm", "⛈️"],
};
const describe = (code) => CODES[code] || ["Unknown", "🌡️"];
const $ = (id) => document.getElementById(id);

async function loadWeather({ name, lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
    `&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;

  try {
    const data = await (await fetch(url)).json();
    render(name, data);
  } catch {
    $("condition").textContent = "Unable to load weather";
  }
}

function render(name, { current, hourly, daily }) {
  const [label] = describe(current.weather_code);
  $("location").textContent = name;
  $("temp").textContent = `${Math.round(current.temperature_2m)}°`;
  $("condition").textContent = label;
  $("hilo").textContent = `H:${Math.round(daily.temperature_2m_max[0])}°  L:${Math.round(daily.temperature_2m_min[0])}°`;
  $("feels").textContent = `${Math.round(current.apparent_temperature)}°`;
  $("humidity").textContent = `${current.relative_humidity_2m}%`;
  $("wind").textContent = `${Math.round(current.wind_speed_10m)} mph`;
  $("uv").textContent = Math.round(daily.uv_index_max[0]);

  const code = current.weather_code;
  document.body.className = !current.is_day ? "night" : code >= 51 ? "rain" : code >= 3 ? "cloudy" : "";

  // Next 24 hours starting from the current hour
  const start = hourly.time.findIndex((t) => t >= current.time.slice(0, 13));
  $("hourly").innerHTML = hourly.time.slice(start, start + 24).map((t, i) => {
    const idx = start + i;
    const hour = i === 0 ? "Now" : new Date(t).toLocaleTimeString([], { hour: "numeric" });
    return `<div class="hour"><span>${hour}</span><span class="icon">${describe(hourly.weather_code[idx])[1]}</span>
      <span>${Math.round(hourly.temperature_2m[idx])}°</span></div>`;
  }).join("");

  $("daily").innerHTML = daily.time.map((d, i) => {
    const day = i === 0 ? "Today" : new Date(d + "T00:00").toLocaleDateString([], { weekday: "short" });
    return `<li><span>${day}</span><span class="icon">${describe(daily.weather_code[i])[1]}</span>
      <span class="range"><span class="lo">${Math.round(daily.temperature_2m_min[i])}°</span>${Math.round(daily.temperature_2m_max[i])}°</span></li>`;
  }).join("");
}

$("search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = $("city").value.trim();
  if (!query) return;
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`);
    const { results } = await res.json();
    if (!results) return alert("City not found");
    const { name, latitude, longitude } = results[0];
    $("city").value = "";
    loadWeather({ name, lat: latitude, lon: longitude });
  } catch {
    alert("Search failed");
  }
});

loadWeather(DEFAULT);

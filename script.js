// @ts-nocheck
const zipRegex = /^\d+$/;
window.addEventListener("load", populateCountries);
const UNSPLASH_KEY = "qSqSpxwdV5UPjneY8ac3m9RFyWYChdpGkW5OuO-lGgM";
const PEXELS_KEY = "5vHM3wVI0NO81NzLcdqyNoatULUJ6rHE4nB2cKZftz22FKHMIZKXT7kH";
let weather = {
  apiKey: "00fd322a4038191a9b93e201caf62103",

  
  fetchWeather: async function (input) {
    let apiUrl = "";
    const countryCode = document.getElementById("country").value || "us";

    try {
      // Decide which endpoint to use
      if (zipRegex.test(input)) {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${input},${countryCode}&units=metric&appid=${this.apiKey}`;
      } else {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${input}&units=metric&appid=${this.apiKey}`;
      }

      const response = await fetch(apiUrl);

      // If ZIP lookup fails, use geocoding fallback
      if (!response.ok && zipRegex.test(input)) {
        console.warn("ZIP lookup failed, trying geocoding fallback...");
        return await this.fetchWeatherByZip(input, countryCode);
      }

      if (!response.ok) {throw new Error("City not found");}

      const data = await response.json();
      this.displayWeather(data);
    } catch (err) {
      console.error("Error fetching weather:", err);
      alert("Could not fetch weather. Try a different city or ZIP code.");
    }
  },

  // Fallback: use the geocoding API to resolve ZIP → lat/lon
  fetchWeatherByZip: async function (zip, countryCode) {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},${countryCode}&appid=${this.apiKey}`;
    const geoRes = await fetch(geoUrl);

    if (!geoRes.ok) throw new Error("ZIP not found");

    const geoData = await geoRes.json();
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${geoData.lat}&lon=${geoData.lon}&units=metric&appid=${this.apiKey}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    this.displayWeather(weatherData);
  },

  displayWeather: function (data) {
    const { name, timezone } = data;
    updateBackground(name);
    const { icon, description } = data.weather[0];
    let { temp, humidity, feels_like, temp_min, temp_max } = data.main;
    temp = Math.ceil(temp * 10) / 10;
    feels_like = Math.ceil(feels_like * 10) / 10;
    temp_min = Math.ceil(temp_min * 10) / 10;
    temp_max = Math.ceil(temp_max * 10) / 10;
    let { speed } = data.wind;
    speed = Math.ceil(speed * 10) / 10;
    const { all } = data.clouds;
    

    document.querySelector(".city").innerText = name;
    document.querySelector(".icon").src =
      "https://openweathermap.org/img/wn/" + icon + ".png";
    document.querySelector(".description").innerText = description;
    document.querySelector(".temp").innerText = temp + "°C";
    document.querySelector(".temp-min").innerHTML = `
  <div class="stat-container">
    <span class="stat">14°C</span>
    <span class="stat-description">Low</span>
  </div>`;

document.querySelector(".temp-max").innerHTML = `
  <div class="stat-container">
    <span class="stat">22°C</span>
    <span class="stat-description">High</span>
  </div>`;

document.querySelector(".feeling").innerHTML = `
  <div class="stat-container">
    <span class="stat">20°C</span>
    <span class="stat-description">Feels Like</span>
  </div>`;

document.querySelector(".humidity").innerHTML = `
  <div class="stat-container">
    <span class="stat">68%</span>
    <span class="stat-description">Humidity</span>
  </div>`;

document.querySelector(".wind").innerHTML = `
  <div class="stat-container">
    <span class="stat">15 km/h</span>
    <span class="stat-description">Wind Speed</span>
  </div>`;

document.querySelector(".clouds").innerHTML = `
  <div class="stat-container">
    <span class="stat">40%</span>
    <span class="stat-description">Cloudiness</span>
  </div>`;
    document.querySelector(".timezone").innerText = "Time now: " + getLocalTime(timezone);
    document.querySelector(".weather").classList.remove("loading");
  },

  search: function () {
    this.fetchWeather(document.querySelector(".search-bar").value.trim());
    if (!zipRegex.test(input.value)) {
    countrySelect.value = ""; 
  }
  },
};

// Event listeners for search
document.querySelector(".search-btn").addEventListener("click", () => {
  weather.search();
});

document.querySelector(".search-bar").addEventListener("keyup", function (event) {
  if (event.key === "Enter") {
    weather.search();
  }
});

// Default example
weather.fetchWeather("Vilnius");

function populateCountries() {
  const countrySelect = document.getElementById("country");
  if (countrySelect.options.length > 1) return;

  fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
    .then((res) => res.json())
    .then((data) => {
      data
        .sort((a, b) => a.name.common.localeCompare(b.name.common))
        .forEach((country) => {
          const option = document.createElement("option");
          option.value = country.cca2.toLowerCase();
          option.textContent = country.name.common;
          countrySelect.appendChild(option);
        });
    })
    .catch((err) => console.error("Failed to load countries:", err));
}

async function fetchCityImage(city) {
  // Try Unsplash first — pick random photo from results
  try {
    const unsplashRes = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(city)}&orientation=landscape&per_page=10&client_id=${UNSPLASH_KEY}`
    );
    const unsplashData = await unsplashRes.json();
    if (unsplashData.results?.length > 0) {
      const randomIndex = Math.floor(Math.random() * unsplashData.results.length);
      console.log(`Unsplash: random image #${randomIndex + 1} of ${unsplashData.results.length}`);
      return unsplashData.results[randomIndex].urls.regular;
    }
  } catch (e) {
    console.warn("Unsplash lookup failed:", e);
  }

  //Try Pexels — pick random photo from results
  try {
    const pexelsRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(city)}&orientation=landscape&per_page=10`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    const pexelsData = await pexelsRes.json();
    if (pexelsData.photos?.length > 0) {
      const randomIndex = Math.floor(Math.random() * pexelsData.photos.length);
      console.log(`Pexels: random image #${randomIndex + 1} of ${pexelsData.photos.length}`);
      return pexelsData.photos[randomIndex].src.landscape;
    }
  } catch (e) {
    console.warn("Pexels lookup failed:", e);
  }

  // Try Openverse — pick random photo from results
  try {
    const openverseRes = await fetch(
      `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(city)}&license_type=commercial&format=json&page_size=10`
    );
    const openverseData = await openverseRes.json();
    if (openverseData.results?.length > 0) {
      const randomIndex = Math.floor(Math.random() * openverseData.results.length);
      console.log(`📸 Openverse: random image #${randomIndex + 1} of ${openverseData.results.length}`);
      return openverseData.results[randomIndex].url;
    }
  } catch (e) {
    console.warn("Openverse lookup failed:", e);
  }

  // Fallback — random generic city image from Unsplash
  try {
    console.log("Using random fallback city image");
    const randomRes = await fetch(
      `https://api.unsplash.com/photos/random?query=cityscape&orientation=landscape&client_id=${UNSPLASH_KEY}`
    );
    const randomData = await randomRes.json();
    return randomData.urls.regular;
  } catch (e) {
    console.error("All image sources failed:", e);
  }
}

async function updateBackground(city) {
  const imageUrl = await fetchCityImage(city);
  document.body.style.backgroundImage = `url('${imageUrl}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
}

function getLocalTime(timezone) {
  const utcTime = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
  const localTime = new Date(utcTime + timezone * 1000);
  return localTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
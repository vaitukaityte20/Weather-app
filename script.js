// @ts-nocheck
const zipRegex = /^\d+$/;
window.addEventListener("load", populateCountries);
const UNSPLASH_KEY = "qSqSpxwdV5UPjneY8ac3m9RFyWYChdpGkW5OuO-lGgM";
const PEXELS_KEY = "5vHM3wVI0NO81NzLcdqyNoatULUJ6rHE4nB2cKZftz22FKHMIZKXT7kH";
let weather = {
  apiKey: "00fd322a4038191a9b93e201caf62103",

  
  fetchWeather: async function(input) {
  const countryCode = document.getElementById("country").value || "us";
  let apiUrl = "";
  let apiHourlyUrl = "";

  try {
    // Determine API URLs
    if (zipRegex.test(input)) {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${input},${countryCode}&units=metric&appid=${this.apiKey}`;
      apiHourlyUrl = `https://api.openweathermap.org/data/2.5/forecast?zip=${input},${countryCode}&units=metric&appid=${this.apiKey}`;
    } else {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${input}&units=metric&appid=${this.apiKey}`;
      apiHourlyUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${input}&units=metric&appid=${this.apiKey}`;
    }

    // Fetch current weather
    const response = await fetch(apiUrl);
    if (!response.ok && zipRegex.test(input)) {
      console.warn("ZIP lookup failed, trying geocoding fallback...");
      return await this.fetchWeatherByZip(input, countryCode);
    }
    if (!response.ok) throw new Error("City not found");
    const data = await response.json();
    this.displayWeather(data);

    // Fetch 3-hour forecast
    const hourlyResponse = await fetch(apiHourlyUrl);
    if (!hourlyResponse.ok && zipRegex.test(input)) {
      console.warn("ZIP lookup failed, trying geocoding fallback...");
      return await this.fetchWeatherByZip(input, countryCode);
    }
    if (!hourlyResponse.ok) throw new Error("Hourly forecast not found");
    const hourlyData = await hourlyResponse.json();
    this.displayHourly(hourlyData);

    this.displayDaily(hourlyData);

  } catch (err) {
    console.error("Error fetching weather:", err);
    alert("Could not fetch weather. Try a different city or ZIP code.");
  }

  },

  // Fallback: use the geocoding API to resolve ZIP → lat/lon
  fetchWeatherByZip: async function (zip, countryCode) {
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},${countryCode}&appid=${this.apiKey}`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error("ZIP not found");
    const geoData = await geoRes.json();

    const { lat, lon } = geoData;

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();
    this.displayWeather(weatherData);

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
    const forecastRes = await fetch(forecastUrl);
    if (forecastRes.ok) {
      const forecastData = await forecastRes.json();
      this.displayHourly(forecastData);
      this.displayDaily(forecastData);
    }
  } catch (err) {
    console.error("Error fetching weather:", err.message);
  }
},

  displayWeather: function(data) {
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
    document.querySelector(".temp-min .stat").innerText = temp_min + "°C";
    document.querySelector(".temp-max .stat").innerText = temp_max + "°C";
    document.querySelector(".feeling .stat").innerText = feels_like + "°C";
    document.querySelector(".humidity .stat").innerText = humidity + "%";
    document.querySelector(".wind .stat").innerText = speed + "m/s";
    document.querySelector(".clouds .stat").innerText = all + "%";
    document.querySelector(".timezone").innerText = "Time now: " + getLocalTime(timezone);
    document.querySelector(".weather").classList.remove("loading");
  },

displayHourly: function(data) {
    const targetHours = [3, 6, 9, 12, 15, 18, 21];
    const cards = document.querySelectorAll(".hourly-cards .card");
    const timezoneOffset = data.city.timezone; // in seconds

    // Clone forecasts and calculate localTime for each
    const availableForecasts = data.list.map(f => ({
        ...f,
        localTime: new Date((f.dt + timezoneOffset) * 1000)
    }));

    targetHours.forEach((targetHour, index) => {
        let closestIndex = -1;
        let minDiff = Infinity;

        availableForecasts.forEach((item, i) => {
            const localHour = item.localTime.getUTCHours();
            const diff = Math.abs(localHour - targetHour);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        });

        if (closestIndex === -1) {
            console.log(`No forecast found for ${targetHour}:00`);
            return;
        }

        const closest = availableForecasts.splice(closestIndex, 1)[0]; // remove used forecast
        const card = cards[index];
        const temp = Math.round(closest.main.temp);
        const icon = closest.weather[0].icon;
        const description = closest.weather[0].description;

        card.querySelector(".card-icon").src = `https://openweathermap.org/img/wn/${icon}.png?${closest.dt}`;
card.querySelector(".card-icon").alt = description;
card.querySelector(".card-temp").innerText = `${temp}°C`;
    });
},

  displayDaily: function(data) {
  const cards = document.querySelectorAll(".daily-cards .daily-card");
  const timezoneOffset = data.city.timezone; 

  const dailyMap = {};

  data.list.forEach(item => {
    const localDate = new Date((item.dt + timezoneOffset) * 1000);
    const dayKey = localDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const hour = localDate.getUTCHours();

    if (!dailyMap[dayKey]) { // if day is not in the list, add.
      dailyMap[dayKey] = {
        min: item.main.temp,
        max: item.main.temp,
        windSum: item.wind.speed,
        rainSum: item.rain?.["3h"] || 0,
        count: 1,
        middayEntry: item, // initialize with first entry
        closestHourDiff: Math.abs(hour - 12) // difference from 12:00
      };
    } else { // if day is in the list, find max, min, add wind and rain.
      dailyMap[dayKey].min = Math.min(dailyMap[dayKey].min, item.main.temp);
      dailyMap[dayKey].max = Math.max(dailyMap[dayKey].max, item.main.temp);
      dailyMap[dayKey].windSum += item.wind.speed;
      dailyMap[dayKey].rainSum += item.rain?.["3h"] || 0;
      dailyMap[dayKey].count++;

      // Check if this entry is closer to 12:00
      const hourDiff = Math.abs(hour - 12);
      if (hourDiff < dailyMap[dayKey].closestHourDiff) {
        dailyMap[dayKey].middayEntry = item;
        dailyMap[dayKey].closestHourDiff = hourDiff;
      }
    }
  });
    // convert map to array, take first 5 days and take the needed values.
    const dailyList = Object.entries(dailyMap).slice(0, 5).map(([date, values]) => ({ 
    dt: new Date(date).getTime() / 1000,
    temp: { min: values.min, max: values.max },
    speed: values.windSum / values.count,
    rain: values.rainSum,
    weather: [values.middayEntry.weather[0]] // midday icon
  }));

    dailyList.forEach((item, i) => {
    const date = new Date((item.dt + timezoneOffset) * 1000);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayMonth = `${date.getDate()}/${date.getMonth() + 1}`;

    const min = Math.round(item.temp.min);
    const max = Math.round(item.temp.max);
    const speed = Math.round(item.speed);
    const rain = Math.round(item.rain);
    const icon = item.weather[0].icon;

    const card = cards[i];
    if (!card) return;

    card.querySelector(".day").textContent = day;
    card.querySelector(".date").textContent = dayMonth;
    card.querySelector(".lowest-temp").textContent = `${min}°C`;
    card.querySelector(".highest-temp").textContent = `${max}°C`;
    card.querySelector(".wind-speed").textContent = `${speed}m/s`;
    card.querySelector(".rain").textContent = `${rain}mm`;
    card.querySelector(".daily-card-icon").src = `https://openweathermap.org/img/wn/${icon}.png`;
    card.querySelector(".daily-card-icon").alt = item.weather[0].description;
  });
},

  search: function () {
     const inputValue = document.querySelector(".search-bar").value.trim();
    this.fetchWeather(inputValue);
    if (!zipRegex.test(inputValue)) {
    const countrySelect = document.getElementById("country");
    countrySelect.value = ""; 
  }

  }
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
      console.log(`Openverse: random image #${randomIndex + 1} of ${openverseData.results.length}`);
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
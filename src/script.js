let inputBox = document.getElementById("cityInput");
let searchBtn = document.getElementById("searchbtn");
let cityNameDiv = document.getElementById("city_name");
let weatherCurrentDiv = document.getElementById("current_weather");
let weatherCardsDiv = document.getElementById("weather_cards");
let hourlyForecastDiv = document.getElementById("hourly_forecast");

const recentContainer = document.getElementById("recentContainer");
const recentList = document.getElementById("recentList");
const currentLocationBtn = document.getElementById("current");


const API_KEY = "3aeed3c94f66a7983b46e538309f5ff1";
// Function to Get Weather Using Current Location
const getWeatherByLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Reverse Geocoding to get City Name (Optional)
                const reverseGeoApi = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
                
                fetch(reverseGeoApi)
                    .then(res => res.json())
                    .then(data => {
                        if (data.length > 0) {
                            const cityName = data[0].name;
                            getWeatherDetails(cityName, lat, lon);
                        } else {
                            alert("City not found!");
                        }
                    })
                    .catch(() => {
                        alert("Error fetching city name.");
                    });
            },
            (error) => {
                alert("Location access denied. Please enable location services.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
};

// Event Listener for "Current Location" Button
currentLocationBtn.addEventListener("click", getWeatherByLocation);

// Function to Create Weather Cards
const createWeatherCard = (title, value, icon) => {
    return `<div class="bg-white p-6 shadow-lg rounded-lg text-center border border-gray-300">
                <p class="text-lg font-semibold">${icon} ${title}</p>
                <p class="text-xl font-bold text-blue-600">${value}</p>
            </div>`;
};

// Function to Create Forecast Cards
const createForecastCard = (weatherItem) => {
    return `<div class="bg-white p-6 shadow-lg rounded-lg text-center border border-gray-300">
                <p class="text-md font-semibold">${new Date(weatherItem.dt_txt).toLocaleDateString()}</p>
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon" class="w-16 h-16 mx-auto">
                <p class="text-lg font-bold text-blue-600">${(weatherItem.main.temp - 273.15).toFixed(2)}°C</p>
                <p class="text-md text-gray-600 capitalize">${weatherItem.weather[0].description}</p>
                <p class="text-md">💨 Wind: ${weatherItem.wind.speed} M/S</p>
                <p class="text-md">💧 Humidity: ${weatherItem.main.humidity}%</p>
            </div>`;
};

// Function to Create Hourly Forecast Cards
const createHourlyCard = (weatherItem) => {
    return `<div class="bg-white p-4 shadow-lg rounded-lg text-center border border-gray-300 min-w-[120px]">
                <p class="text-sm font-semibold text-gray-700">${new Date(weatherItem.dt_txt).toLocaleDateString()} ${new Date(weatherItem.dt_txt).toLocaleTimeString()}</p>
                <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon" class="w-12 h-12 mx-auto">
                <p class="text-lg font-bold text-blue-600">${(weatherItem.main.temp - 273.15).toFixed(2)}°C</p>
                <p class="text-md text-gray-600 capitalize">${weatherItem.weather[0].description}</p>
            </div>`;
};

// Function to Fetch Weather Details
const getWeatherDetails = (cityName, lat, lon) => {
    const Weather_Api = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    fetch(Weather_Api)
        .then(res => res.json())
        .then(data => {
            cityNameDiv.innerHTML = `${cityName}`;
            const weatherDescription = data.list[0].weather[0].description;

            // Update Current Weather Grid
            weatherCurrentDiv.innerHTML = `
                
                    <div>${createWeatherCard("Temperature", `${(data.list[0].main.temp - 273.15).toFixed(2)}°C`, "🌡️")}</div>
                    <div>${createWeatherCard("Wind", `${data.list[0].wind.speed} M/S`, "💨")}</div>
                    <div>${createWeatherCard("Humidity", `${data.list[0].main.humidity}%`, "💧")}</div>
                    <div>${createWeatherCard("Description", `${weatherDescription}`, "☁️")}</div>
                
            `;

            // 5-Day Forecast
            const uniqueForecastDays = [];
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate) && uniqueForecastDays.length < 5) {
                    return uniqueForecastDays.push(forecastDate);
                }
            });

            weatherCardsDiv.innerHTML = fiveDaysForecast.map(item => createForecastCard(item)).join('');
            hourlyForecastDiv.innerHTML = data.list.slice(0, 7).map(item => createHourlyCard(item)).join('');

            saveSearch(cityName); // Save city to recent searches
        })
        .catch(() => {
            alert("An error occurred while fetching the weather forecast");
        });
};

// Function to Get City Coordinates
const getCityCoordinates = () => {
    const cityName = inputBox.value.trim();
    if (!cityName) return;

    const Geo_Api = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    fetch(Geo_Api)
        .then(res => res.json())
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${cityName}.Please enter a valid city.`);
            const { name, lat, lon } = data[0];
            getWeatherDetails(name, lat, lon);
        })
        .catch(() => {
            alert("An error occurred while fetching the coordinates");
        });
};

// Function to Save Search in Local Storage
const saveSearch = (city) => {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];

    if (!cities.includes(city)) {
        cities.unshift(city);
        if (cities.length > 5) cities.pop();
    }

    localStorage.setItem("recentCities", JSON.stringify(cities));
    updateRecentDropdown();
};

// Function to Update Dropdown List
const updateRecentDropdown = () => {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
    recentList.innerHTML = "";

    if (cities.length === 0) {
        recentContainer.classList.add("hidden"); // Hide dropdown if empty
    } else {
        recentContainer.classList.remove("hidden"); // Show dropdown
    }

    cities.forEach(city => {
        let li = document.createElement("li");
        li.className = "p-2 hover:bg-gray-100 cursor-pointer";
        li.textContent = city;
        li.addEventListener("click", () => {
            inputBox.value = city;
            getCityCoordinates();
            recentList.classList.add("hidden"); // Hide dropdown after selection
        });
        recentList.appendChild(li);
    });
};

// Show Dropdown When Clicking on Input Box (Only If Cities Exist)
inputBox.addEventListener("focus", () => {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
    if (cities.length > 0) {
        recentList.classList.remove("hidden");
    }
});

// Hide Dropdown When Clicking Outside
document.addEventListener("click", (event) => {
    if (!recentContainer.contains(event.target) && event.target !== inputBox) {
        recentList.classList.add("hidden");
    }
});

// Load Recent Searches on Page Load
updateRecentDropdown();

// Search Button Click Event
searchBtn.addEventListener("click", getCityCoordinates);
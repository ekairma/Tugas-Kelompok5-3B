// Kunci API OpenWeatherMap Anda
const API_KEY = "ddec4165e0ba2c82ad4f4ee850be504f"; 

const searchButton = document.getElementById('search-button');
const cityInput = document.getElementById('city-input');
const weatherResultDiv = document.getElementById('weather-result');
const messageDiv = document.getElementById('message');
const toggleUnitBtn = document.getElementById('toggle-unit-btn');
const quickCityButtons = document.querySelectorAll('.quick-city');
const historyContainer = document.getElementById('history');
const historyList = document.getElementById('history-list');

// Menyimpan data terakhir dan satuan yang sedang ditampilkan
let lastWeatherData = null;
let currentUnit = 'C'; // 'C' atau 'F'
let searchHistory = [];

/**
 * Fungsi asinkron untuk mengambil data cuaca dari OpenWeatherMap API.
 * @param {string} city - Nama kota yang akan dicari.
 */
async function fetchWeather(city) {

    // URL API Endpoint. Menggunakan unit 'metric' (Celcius) dan bahasa 'id' (Indonesia)
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=id`;

    try {
        // 1. Tampilkan pesan loading
        showMessage('Mengambil data cuaca...', 'alert-info');
        weatherResultDiv.style.display = 'none';

        // 2. Melakukan Permintaan (FETCH)
        const response = await fetch(url);

        // 3. Menangani Error HTTP (misalnya 404 Not Found)
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Kota "${city}" tidak ditemukan. Coba lagi.`);
            }
            throw new Error(`Terjadi kesalahan jaringan: ${response.status}`);
        }

        // 4. Mengambil Data JSON
        const data = await response.json();

        // Simpan data terakhir untuk keperluan toggle satuan dan info tambahan
        lastWeatherData = data;

        // Tambahkan ke riwayat pencarian
        addToHistory(data.name);

        // 5. Menampilkan Data ke Antarmuka Pengguna
        displayWeather(data);

    } catch (error) {
        // 6. Menangani Error dan Menampilkan Pesan
        console.error('Error saat mengambil data:', error);
        showMessage(`Gagal: ${error.message}`, 'alert-danger');
    }
}

/**
 * Fungsi untuk menampilkan hasil cuaca di elemen HTML.
 * @param {object} data - Objek data cuaca dari API.
 */
function displayWeather(data) {

    // Sembunyikan pesan error/loading
    messageDiv.style.display = 'none';
    
    // Ambil elemen HTML
    const cityNameEl = document.getElementById('city-name');
    const temperatureEl = document.getElementById('temperature');
    const descriptionEl = document.getElementById('description');
    const iconEl = document.getElementById('weather-icon');
    const humidityEl = document.getElementById('humidity');
    const windSpeedEl = document.getElementById('wind-speed');
    const pressureEl = document.getElementById('pressure');
    const localTimeEl = document.getElementById('local-time');
    const sunriseEl = document.getElementById('sunrise-time');
    const sunsetEl = document.getElementById('sunset-time');

    // Isi elemen dengan data dari API
    cityNameEl.textContent = `${data.name}, ${data.sys.country}`;

    // Suhu dasar dalam Celcius (dari API units=metric)
    const tempC = data.main.temp;
    updateTemperatureDisplay(tempC);

    // Mengambil deskripsi cuaca dan mengubahnya menjadi huruf kapital
    descriptionEl.textContent = data.weather[0].description.toUpperCase(); 
    
    // URL untuk ikon cuaca
    const iconCode = data.weather[0].icon;
    iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    humidityEl.textContent = `${data.main.humidity}%`;
    windSpeedEl.textContent = `${data.wind.speed} m/s`; 
    pressureEl.textContent = `${data.main.pressure} hPa`; 

    // Data.timezone (offset dari UTC dalam detik, misalnya 25200 untuk WIB)
const timezoneOffset = data.timezone; 

// data.dt, data.sys.sunrise, data.sys.sunset (timestamp UTC dalam detik)

const toLocalTime = (unixTimestamp) => {
    // 1. Tambahkan offset zona waktu ke timestamp UTC
    const offsetInMs = timezoneOffset * 1000;
    const localTimestampInMs = (unixTimestamp * 1000) + offsetInMs;

    // 2. Buat objek Date dari timestamp lokal yang sudah dihitung
    // Penting: Gunakan UTC time-methods untuk mengambil jam/menit dari objek Date
    // Ini mengabaikan zona waktu komputer pengguna
    const date = new Date(localTimestampInMs);

    // Ambil jam dan menit menggunakan metode UTC
    // (Karena timestamp-nya sudah di offset, kita perlakukan sebagai UTC)
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();

    // Format jam dan menit menjadi dua digit
    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');

    return `${hours}:${minutes}`;
};

// Penggunaan tetap sama, tetapi sekarang akan menampilkan waktu yang benar
localTimeEl.textContent = toLocalTime(data.dt);
sunriseEl.textContent = toLocalTime(data.sys.sunrise);
sunsetEl.textContent = toLocalTime(data.sys.sunset);

weatherResultDiv.style.display = 'block';
    // Tampilkan div hasil
    weatherResultDiv.style.display = 'block';
}

// Mengupdate tampilan suhu berdasarkan satuan yang dipilih
function updateTemperatureDisplay(tempC) {
    const temperatureEl = document.getElementById('temperature');
    if (currentUnit === 'C') {
        temperatureEl.innerHTML = `${Math.round(tempC)}&deg;C`;
        if (toggleUnitBtn) toggleUnitBtn.textContent = 'Tampilkan °F';
    } else {
        const tempF = (tempC * 9) / 5 + 32;
        temperatureEl.innerHTML = `${Math.round(tempF)}&deg;F`;
        if (toggleUnitBtn) toggleUnitBtn.textContent = 'Tampilkan °C';
    }
}

/**
 * Fungsi utilitas untuk menampilkan pesan (loading/error/warning).
 * @param {string} msg - Isi pesan.
 * @param {string} typeClass - Kelas Bootstrap untuk styling (e.g., 'alert-info', 'alert-danger').
 */
function showMessage(msg, typeClass) {

    messageDiv.className = `alert ${typeClass} mt-3 text-center`;
    messageDiv.textContent = msg;
    messageDiv.style.display = 'block';
    weatherResultDiv.style.display = 'none';
}

// Event listener untuk tombol 'Cari Cuaca'

searchButton.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    } else {
        showMessage('Harap masukkan nama kota!', 'alert-warning');
    }
});

// Event listener untuk tombol ENTER di input

cityInput.addEventListener('keypress', (e) => {

    if (e.key === 'Enter') {
        e.preventDefault(); // Mencegah form submit default jika ada
        searchButton.click();
    }
});

// Event listener untuk tombol toggle satuan

if (toggleUnitBtn) {
    toggleUnitBtn.addEventListener('click', () => {
        if (!lastWeatherData) return;
        currentUnit = currentUnit === 'C' ? 'F' : 'C';
        updateTemperatureDisplay(lastWeatherData.main.temp);
    });
}

// Event listener untuk tombol kota cepat

quickCityButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        const city = btn.getAttribute('data-city');
        cityInput.value = city;
        fetchWeather(city);
    });
});

// Fitur riwayat pencarian

function addToHistory(cityName) {
    if (!cityName) return;
    const normalized = cityName.trim();
    if (!normalized) return;

    // Hindari duplikat sederhana
    if (!searchHistory.includes(normalized)) {
        searchHistory.unshift(normalized);
        // Batasi riwayat maksimal 6 item
        searchHistory = searchHistory.slice(0, 6);
    }

    // Simpan ke localStorage agar bisa digunakan laman lain (riwayat.html)
    try {
        localStorage.setItem('weatherHistory', JSON.stringify(searchHistory));
    } catch (e) {
        console.warn('Gagal menyimpan riwayat ke localStorage:', e);
    }

    renderHistory();
}

function renderHistory() {
    if (!historyContainer || !historyList) return;
    historyList.innerHTML = '';

    if (searchHistory.length === 0) {
        historyContainer.style.display = 'none';
        return;
    }

    searchHistory.forEach((city) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline-secondary btn-sm me-2 mb-2';
        btn.textContent = city;
        btn.addEventListener('click', () => {
            cityInput.value = city;
            fetchWeather(city);
        });
        historyList.appendChild(btn);
    });

    historyContainer.style.display = 'block';
}

// Inisialisasi: muat riwayat dari localStorage jika ada
try {
    const saved = localStorage.getItem('weatherHistory');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
            searchHistory = parsed;
            renderHistory();
        }
    }
} catch (e) {
    console.warn('Gagal memuat riwayat dari localStorage:', e);
}

// Jalankan pencarian default saat pertama kali dimuat

fetchWeather('Malang');
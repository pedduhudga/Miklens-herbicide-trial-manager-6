export async function fetchWeather(lat, lon, date = null, getAppState) {
    let url = '';
    try {
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        if (!lat || !lon || isNaN(latNum) || isNaN(lonNum)) {
            console.error("fetchWeather: Invalid coordinates:", lat, lon);
            return null;
        }
        // Validate date format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!date || typeof date !== 'string' || !dateRegex.test(date)) {
            console.error("fetchWeather: Invalid date format:", date);
            return null;
        }

        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            console.error("fetchWeather: Invalid Date object:", date);
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate age of date in days
        const diffTime = today - targetDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const dateStr = date; // YYYY-MM-DD

        // 1. TRY PREMIUM: OpenWeatherMap (if key provided)
        if (getAppState().settings.openWeatherMapKey) {
            try {
                const unixTime = Math.floor(targetDate.getTime() / 1000);
                const owmUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${latNum}&lon=${lonNum}&dt=${unixTime}&appid=${getAppState().settings.openWeatherMapKey}&units=metric`;
                const response = await fetchWithRetry(owmUrl);
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data[0]) {
                        const w = data.data[0];
                        return {
                            temp: w.temp,
                            humidity: w.humidity,
                            wind: w.wind_speed,
                            rain: w.rain ? (w.rain['1h'] || 0) : 0,
                            provider: 'OpenWeatherMap'
                        };
                    }
                }
            } catch (e) { console.warn('OpenWeatherMap failed, trying other providers...', e); }
        }

        // 1.5 TRY Visual Crossing (if key provided or selected)
        if (getAppState().settings.visualCrossingKey || (typeof document !== 'undefined' && document.getElementById('settings-soil-provider')?.value === 'visual-crossing')) {
            try {
                // If they selected it but no key in state, maybe they typed it in the input recently?
                const vcKey = getAppState().settings.visualCrossingKey || (typeof document !== 'undefined' ? document.getElementById('settings-vc-key')?.value : null);
                if (vcKey) {
                    const vcUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latNum},${lonNum}/${dateStr}?key=${vcKey}&unitGroup=metric&include=days`;
                    const response = await fetchWithRetry(vcUrl);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.days && data.days.length > 0) {
                            const w = data.days[0];
                            return {
                                temp: w.tempmax || w.temp,
                                humidity: w.humidity,
                                wind: w.windspeed,
                                rain: w.precip || 0,
                                provider: 'Visual Crossing'
                            };
                        }
                    }
                }
            } catch (e) { console.warn('Visual Crossing failed...', e); }
        }

        // 1.7 TRY Tomorrow.io (if key provided or selected)
        if (getAppState().settings.tomorrowKey || (typeof document !== 'undefined' && document.getElementById('settings-soil-provider')?.value === 'tomorrow-io')) {
            try {
                const tmKey = getAppState().settings.tomorrowKey || (typeof document !== 'undefined' ? document.getElementById('settings-tomorrow-key')?.value : null);
                if (tmKey) {
                    const tmUrl = `https://api.tomorrow.io/v4/weather/history/recent?location=${latNum},${lonNum}&apikey=${tmKey}`;
                    const response = await fetchWithRetry(tmUrl);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.timelines && data.timelines.daily && data.timelines.daily.length > 0) {
                            const w = data.timelines.daily[0].values;
                            return {
                                temp: w.temperatureMax,
                                humidity: w.humidityAvg,
                                wind: w.windSpeedMax,
                                rain: w.precipitationAccumulation || 0,
                                provider: 'Tomorrow.io'
                            };
                        }
                    }
                }
            } catch (e) { console.warn('Tomorrow.io failed...', e); }
        }

        // 2. PRIMARY: Open-Meteo
        const isOldArchive = diffDays > 14;
        if (isOldArchive) {
            url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,relative_humidity_2m_mean,wind_speed_10m_max,rain_sum&timezone=auto`;
        } else {
            url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,relative_humidity_2m_mean,wind_speed_10m_max,rain_sum&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;
        }

        const res = await fetchWithRetry(url);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error('Weather API Error Detail:', errData);
            throw new Error(`Weather API Error: ${res.status}${errData.reason ? ' - ' + errData.reason : ''}`);
        }
        const data = await res.json();

        if (data.daily && data.daily.time && data.daily.time.length > 0) {
            console.log('Weather API Response Dates:', data.daily.time, 'Looking for:', dateStr);

            // Find the index that matches our requested date
            const index = data.daily.time.findIndex(t => t === dateStr);
            const safeIndex = index !== -1 ? index : 0;

            if (index === -1) {
                console.warn('Weather date mismatch! API returned:', data.daily.time[0], 'Expected:', dateStr);
            }

            // Sanity check: if returned date is not what we asked for, and we are in strict mode
            if (index === -1 && data.daily.time[0] !== dateStr) {
                // If the mismatch is significant, return null.
                if (Math.abs(new Date(data.daily.time[0]) - targetDate) > 86400000) {
                    console.error('Weather date mismatch too large. Aborting.');
                    return null;
                }
            }

            return {
                temp: data.daily.temperature_2m_max[safeIndex],
                humidity: data.daily.relative_humidity_2m_mean[safeIndex],
                wind: data.daily.wind_speed_10m_max[safeIndex],
                rain: data.daily.rain_sum[safeIndex],
                provider: 'Open-Meteo'
            };
        }
        return null;
    } catch (e) {
        console.error("Weather fetch failed:", e);
        console.error("Failed URL:", url);
        if (typeof showToast === 'function') {
            showToast('Could not fetch weather data.', 'error');
        }
        return null;
    }
}
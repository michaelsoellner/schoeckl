async function loadData(uri) {
    var proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(uri);

    try {
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        return data; // Return the data
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Rethrow the error so it can be caught by the caller
    }
}

function formatDate(inputDate) {
    const date = new Date(inputDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function formatWindDirection(degrees) {
    const directions = [
        "N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ];

    const index = Math.round((degrees % 360) / 22.5);
    return directions[index];
}

async function loadCurrent() {
    const apiUrl = 'https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?parameters=FFAM,FFX,DD,DDX&station_ids=11241&output_format=geojson';
    try {
        var data = await loadData(apiUrl);

        var time = data.timestamps[0];
        document.querySelector('#subHeader').innerHTML = `Letzte Aktualisierung: ${formatDate(time)}`;

        var wind_avg = Math.round(data.features[0].properties.parameters.FFAM.data[0] * 3.6 * 10) / 10;
        var wind_max =  Math.round(data.features[0].properties.parameters.FFX.data[0] * 3.6 * 10) / 10;
        var dir_avg = data.features[0].properties.parameters.DD.data[0];
        var dir_max = data.features[0].properties.parameters.DDX.data[0];

        document.querySelector('#wind_avg').innerHTML = `${wind_avg} km/h`;
        document.querySelector('#wind_max').innerHTML = `${wind_max} km/h`;
        document.querySelector('#dir_avg').innerHTML = `${formatWindDirection(dir_avg)} (${dir_avg}°)`;
        document.querySelector('#dir_max').innerHTML = `${formatWindDirection(dir_max)} (${dir_max}°)`;

    } catch (error) {
        console.log(error);
    }

}

async function loadPast() {
    // Calculate the start time for the last 24 hours
    const endDate = new Date();
    const startDate = new Date(endDate - 24 * 60 * 60 * 1000); // 24 hours in milliseconds

    // Format start and end times in ISO 8601 format
    const startTimeISO = startDate.toISOString();
    const endTimeISO = endDate.toISOString();

    const apiUrl = `https://dataset.api.hub.geosphere.at/v1/station/historical/tawes-v1-10min?parameters=FFX,FFAM,DD,DDX&station_ids=11241&output_format=geojson&start=${startTimeISO}&end=${endTimeISO}`;
    try {
        var data = await loadData(apiUrl);

        // Extract relevant data from the response
        const timestamps = data.timestamps;
        const ffamData = data.features[0].properties.parameters.FFAM.data.map(x => x * 3.6);
        const ffxData = data.features[0].properties.parameters.FFX.data.map(x => x * 3.6);

        var len = timestamps.length - 1;

        if (ffamData[len] == 0 && ffxData[len] == 0){
            timestamps.pop();
            ffamData.pop();
            ffxData.pop();
        }

        // Create a chart using Chart.js
        const ctx = document.getElementById('chart24h').getContext('2d');

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [
                    {
                        label: 'Wind (km/h)',
                        data: ffamData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        fill: false,
                    },
                    {
                        label: 'Windspitzen (km/h)',
                        data: ffxData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        fill: false,
                    },
                ],
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                hour: 'HH:mm',
                            },
                        },
                    },
                    y: {
                        beginAtZero: true,
                    },
                },
                pointRadius: 1
            },
        });


    } catch (error) {
        console.log(error);
    }

}
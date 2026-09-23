const locationElement = document.getElementById("location");

function updateClock() {
    const now = new Date();

    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    document.getElementById("digitalClock").textContent =
        `${hour}:${minute}:${second}`;

    document.getElementById("date").textContent = now.toDateString();

    drawClock(now);
}

setInterval(updateClock, 1000);
updateClock();

// Automatically detect the user's current location.
// Works on localhost/HTTPS when the browser allows location access.
function detectCurrentLocation() {
    if (!navigator.geolocation) {
        locationElement.textContent = "📍 Location not supported by this browser";
        return;
    }

    locationElement.textContent = "📍 Detecting current location...";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                // Free reverse-geocoding service: coordinates -> place name.
                const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
                const response = await fetch(url);

                if (!response.ok) throw new Error("Location lookup failed");

                const data = await response.json();

                const locality = data.locality || data.city || data.principalSubdivision || "Current Location";
                const state = data.principalSubdivision || "";
                const country = data.countryName || "";

                let place = locality;
                if (state && state !== locality) place += `, ${state}`;
                if (!state && country) place += `, ${country}`;

                locationElement.textContent = `📍 ${place}`;
            } catch (error) {
                locationElement.textContent = `📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            }
        },
        (error) => {
            if (error.code === error.PERMISSION_DENIED) {
                locationElement.textContent = "📍 Location permission denied";
            } else {
                locationElement.textContent = "📍 Unable to detect current location";
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

detectCurrentLocation();

function drawClock(now) {
    const canvas = document.getElementById("clock");
    const ctx = canvas.getContext("2d");
    const radius = 100;

    ctx.clearRect(0, 0, 220, 220);
    ctx.save();
    ctx.translate(110, 110);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let i = 1; i <= 12; i++) {
        const angle = (i * Math.PI / 6) - Math.PI / 2;
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText(i, Math.cos(angle) * 80 - 6, Math.sin(angle) * 80 + 6);
    }

    const sec = now.getSeconds();
    const min = now.getMinutes();
    const hr = now.getHours() % 12;

    drawHand((hr * Math.PI / 6) + (min * Math.PI / 360), 55, 6, "white");
    drawHand((min * Math.PI / 30), 75, 4, "white");
    drawHand((sec * Math.PI / 30), 90, 2, "red");

    ctx.restore();

    function drawHand(pos, length, width, color) {
        ctx.save();
        ctx.rotate(pos - Math.PI / 2);
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.moveTo(0, 0);
        ctx.lineTo(length, 0);
        ctx.stroke();
        ctx.restore();
    }
}

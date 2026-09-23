/* =========================================================
   TIMENOW - SCRIPT.JS
   Digital Clock + Analog Clock + Real-Time Location
   Mobile Responsive Version
   ========================================================= */


/* =========================================================
   GET HTML ELEMENTS
   ========================================================= */

const digitalClock = document.getElementById("digitalClock");
const locationElement = document.getElementById("location");
const dateElement = document.getElementById("date");
const retryButton = document.getElementById("locationRetry");
const canvas = document.getElementById("clock");

const ctx = canvas.getContext("2d");


/* =========================================================
   DIGITAL CLOCK
   ========================================================= */

function updateClock() {

    const now = new Date();

    // Get current hours
    const hours = String(now.getHours()).padStart(2, "0");

    // Get current minutes
    const minutes = String(now.getMinutes()).padStart(2, "0");

    // Get current seconds
    const seconds = String(now.getSeconds()).padStart(2, "0");


    // Display digital time
    digitalClock.textContent =
        `${hours}:${minutes}:${seconds}`;


    // Display current date
    dateElement.textContent =
        now.toDateString();


    // Draw analog clock
    drawAnalogClock(now);
}


/* =========================================================
   START DIGITAL CLOCK
   ========================================================= */

updateClock();

setInterval(updateClock, 1000);


/* =========================================================
   LOCATION DETECTION
   ========================================================= */

function detectLocation() {

    // Show loading message
    locationElement.textContent =
        "📍 Detecting current location...";

    // Hide retry button
    retryButton.classList.add("hidden");


    /*
     * Check browser location support
     */

    if (!navigator.geolocation) {

        console.log(
            "Geolocation is not supported by this browser."
        );

        getApproximateLocation();

        return;
    }


    /*
     * Request current location
     */

    navigator.geolocation.getCurrentPosition(

        // SUCCESS
        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            console.log(
                "Latitude:",
                latitude
            );

            console.log(
                "Longitude:",
                longitude
            );


            // Convert coordinates to readable location
            getReadableLocation(
                latitude,
                longitude
            );
        },


        // ERROR
        function (error) {

            console.log(
                "Location error:",
                error.message
            );


            /*
             * If mobile GPS fails,
             * use approximate IP location.
             */

            getApproximateLocation();
        },


        // OPTIONS
        {
            enableHighAccuracy: false,

            timeout: 15000,

            maximumAge: 600000
        }
    );
}


/* =========================================================
   REVERSE GEOCODING
   Latitude + Longitude
   -> City / State / Country
   ========================================================= */

async function getReadableLocation(
    latitude,
    longitude
) {

    try {

        const apiUrl =
            "https://api.bigdatacloud.net/data/" +
            "reverse-geocode-client" +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            "&localityLanguage=en";


        const response =
            await fetch(apiUrl);


        if (!response.ok) {

            throw new Error(
                "Reverse geocoding API failed."
            );
        }


        const data =
            await response.json();


        console.log(
            "Location API response:",
            data
        );


        /*
         * Try different location fields
         * because API response can vary.
         */

        const city =
            data.city ||
            data.locality ||
            data.principalSubdivision ||
            "Current Location";


        const state =
            data.principalSubdivision || "";


        const country =
            data.countryName || "";


        /*
         * Build readable location
         */

        let locationText = city;


        if (
            state &&
            state !== city
        ) {

            locationText +=
                `, ${state}`;
        }


        if (
            country &&
            !locationText.includes(country)
        ) {

            locationText +=
                `, ${country}`;
        }


        /*
         * Display location
         */

        locationElement.textContent =
            `📍 ${locationText}`;


        console.log(
            "Detected Location:",
            locationText
        );
    }

    catch (error) {

        console.error(
            "Reverse geocoding error:",
            error
        );


        /*
         * If readable location fails,
         * show coordinates.
         */

        locationElement.textContent =
            `📍 ${latitude.toFixed(4)}, ` +
            `${longitude.toFixed(4)}`;
    }
}


/* =========================================================
   APPROXIMATE LOCATION
   =========================================================
   Used when GPS permission is denied,
   unavailable or times out.
   ========================================================= */

async function getApproximateLocation() {

    locationElement.textContent =
        "📍 Finding approximate location...";


    try {

        const response =
            await fetch(
                "https://ipapi.co/json/",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "IP location API failed."
            );
        }


        const data =
            await response.json();


        console.log(
            "Approximate location:",
            data
        );


        const city =
            data.city || "";


        const region =
            data.region || "";


        const country =
            data.country_name || "";


        /*
         * Create location string
         */

        const parts = [
            city,
            region,
            country
        ].filter(Boolean);


        if (parts.length > 0) {

            locationElement.textContent =
                `📍 ${parts.join(", ")}`;

            retryButton.classList.add("hidden");

        } else {

            throw new Error(
                "Location information unavailable."
            );
        }

    }

    catch (error) {

        console.error(
            "Approximate location error:",
            error
        );


        locationElement.textContent =
            "📍 Location unavailable";


        /*
         * Show retry button
         */

        retryButton.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   RETRY LOCATION
   ========================================================= */

retryButton.addEventListener(
    "click",
    function () {

        detectLocation();

    }
);


/* =========================================================
   ANALOG CLOCK
   ========================================================= */

function drawAnalogClock(now) {

    /*
     * Get actual displayed canvas size.
     * This makes the clock responsive
     * on mobile and desktop.
     */

    const displayedSize =
        Math.min(
            canvas.clientWidth || 220,
            canvas.clientHeight || 220
        );


    /*
     * Device Pixel Ratio
     * improves canvas sharpness
     * on mobile screens.
     */

    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        displayedSize * dpr;

    canvas.height =
        displayedSize * dpr;


    /*
     * Reset canvas transformation
     */

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    /*
     * Center and radius
     */

    const center =
        displayedSize / 2;


    const radius =
        displayedSize * 0.43;


    /*
     * Clear canvas
     */

    ctx.clearRect(
        0,
        0,
        displayedSize,
        displayedSize
    );


    /*
     * Move origin to center
     */

    ctx.save();

    ctx.translate(
        center,
        center
    );


    /* =====================================================
       OUTER CLOCK CIRCLE
       ===================================================== */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        radius,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle = "white";

    ctx.lineWidth =
        Math.max(
            2,
            displayedSize * 0.018
        );


    ctx.stroke();


    /* =====================================================
       CLOCK NUMBERS
       ===================================================== */

    for (
        let number = 1;
        number <= 12;
        number++
    ) {

        /*
         * Calculate number angle
         */

        const angle =
            number *
            Math.PI /
            6 -
            Math.PI / 2;


        /*
         * Number position
         */

        const numberRadius =
            radius * 0.78;


        const x =
            Math.cos(angle) *
            numberRadius;


        const y =
            Math.sin(angle) *
            numberRadius;


        /*
         * Number style
         */

        ctx.fillStyle =
            "white";


        ctx.font =
            `${Math.max(
                12,
                displayedSize * 0.08
            )}px Arial`;


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        /*
         * Draw number
         */

        ctx.fillText(
            number,
            x,
            y
        );
    }


    /* =====================================================
       GET CURRENT TIME
       ===================================================== */

    const seconds =
        now.getSeconds();


    const minutes =
        now.getMinutes();


    const hours =
        now.getHours() % 12;


    /* =====================================================
       HOUR HAND
       ===================================================== */

    const hourAngle =
        hours *
        Math.PI /
        6 +
        minutes *
        Math.PI /
        360;


    drawHand(
        hourAngle,
        radius * 0.52,
        Math.max(
            4,
            displayedSize * 0.027
        ),
        "white"
    );


    /* =====================================================
       MINUTE HAND
       ===================================================== */

    const minuteAngle =
        minutes *
        Math.PI /
        30;


    drawHand(
        minuteAngle,
        radius * 0.70,
        Math.max(
            3,
            displayedSize * 0.018
        ),
        "white"
    );


    /* =====================================================
       SECOND HAND
       ===================================================== */

    const secondAngle =
        seconds *
        Math.PI /
        30;


    drawHand(
        secondAngle,
        radius * 0.82,
        Math.max(
            2,
            displayedSize * 0.010
        ),
        "red"
    );


    /* =====================================================
       CENTER DOT
       ===================================================== */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        Math.max(
            3,
            displayedSize * 0.025
        ),
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "white";


    ctx.fill();


    /*
     * Restore canvas
     */

    ctx.restore();
}


/* =========================================================
   DRAW CLOCK HAND
   ========================================================= */

function drawHand(
    angle,
    length,
    width,
    color
) {

    ctx.save();


    /*
     * Rotate hand
     */

    ctx.rotate(
        angle - Math.PI / 2
    );


    /*
     * Hand settings
     */

    ctx.beginPath();

    ctx.lineWidth =
        width;

    ctx.lineCap =
        "round";

    ctx.strokeStyle =
        color;


    /*
     * Start from center
     */

    ctx.moveTo(
        0,
        0
    );


    /*
     * Draw hand
     */

    ctx.lineTo(
        length,
        0
    );


    ctx.stroke();


    ctx.restore();
}


/* =========================================================
   WINDOW RESIZE
   =========================================================
   Redraw analog clock when mobile orientation
   changes from portrait to landscape.
   ========================================================= */

window.addEventListener(
    "resize",
    function () {

        drawAnalogClock(
            new Date()
        );

    }
);


/* =========================================================
   PAGE VISIBILITY
   =========================================================
   When user returns to the browser tab,
   immediately refresh the clock.
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.visibilityState ===
            "visible"
        ) {

            updateClock();
        }

    }
);


/* =========================================================
   START LOCATION DETECTION
   ========================================================= */

detectLocation();

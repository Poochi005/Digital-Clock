/* =========================================================
   TIMENOW - SCRIPT.JS
   Digital Clock + Analog Clock + Real-Time Location
   GPS High Accuracy Version
   Mobile + Desktop Responsive
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

    // Current hours
    const hours = String(now.getHours()).padStart(2, "0");

    // Current minutes
    const minutes = String(now.getMinutes()).padStart(2, "0");

    // Current seconds
    const seconds = String(now.getSeconds()).padStart(2, "0");


    // Display digital time
    digitalClock.textContent =
        `${hours}:${minutes}:${seconds}`;


    // Display current browser date
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
   =========================================================
   IMPORTANT:

   1. Use browser GPS/location
   2. High accuracy enabled
   3. Do NOT use old cached location
   4. Do NOT automatically use IP location
   5. If GPS fails -> show retry button
   ========================================================= */

function detectLocation() {

    // Show loading message
    locationElement.textContent =
        "📍 Detecting current location...";

    // Hide retry button while detecting
    retryButton.classList.add("hidden");


    /* =====================================================
       CHECK GEOLOCATION SUPPORT
       ===================================================== */

    if (!navigator.geolocation) {

        console.error(
            "Geolocation is not supported by this browser."
        );

        locationElement.textContent =
            "📍 Location is not supported";

        retryButton.classList.remove("hidden");

        return;
    }


    /* =====================================================
       REQUEST FRESH HIGH-ACCURACY LOCATION
       ===================================================== */

    navigator.geolocation.getCurrentPosition(

        /* =================================================
           SUCCESS
           ================================================= */

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            console.log(
                "================================="
            );

            console.log(
                "GPS LOCATION SUCCESS"
            );

            console.log(
                "Latitude:",
                latitude
            );

            console.log(
                "Longitude:",
                longitude
            );

            console.log(
                "Accuracy:",
                accuracy + " meters"
            );

            console.log(
                "================================="
            );


            // Convert coordinates into readable location
            getReadableLocation(
                latitude,
                longitude
            );
        },


        /* =================================================
           ERROR
           ================================================= */

        function(error) {

            console.error(
                "GPS Location Error:",
                error
            );


            let message =
                "📍 Unable to detect location";


            /* =============================================
               PERMISSION DENIED
               ============================================= */

            if (error.code === 1) {

                message =
                    "📍 Location permission denied";
            }


            /* =============================================
               POSITION UNAVAILABLE
               ============================================= */

            else if (error.code === 2) {

                message =
                    "📍 Current location unavailable";
            }


            /* =============================================
               TIMEOUT
               ============================================= */

            else if (error.code === 3) {

                message =
                    "📍 Location request timed out";
            }


            locationElement.textContent =
                message;


            // Show retry button
            retryButton.classList.remove(
                "hidden"
            );
        },


        /* =================================================
           GEOLOCATION OPTIONS
           ================================================= */

        {
            /*
             * IMPORTANT:
             * Request high accuracy.
             */

            enableHighAccuracy: true,

            /*
             * Wait up to 30 seconds
             * for a fresh location.
             */

            timeout: 30000,

            /*
             * IMPORTANT:
             * Do not use old cached location.
             */

            maximumAge: 0
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

        /*
         * BigDataCloud reverse geocoding API
         */

        const apiUrl =
            "https://api.bigdatacloud.net/data/" +
            "reverse-geocode-client" +
            `?latitude=${encodeURIComponent(latitude)}` +
            `&longitude=${encodeURIComponent(longitude)}` +
            "&localityLanguage=en";


        console.log(
            "Reverse Geocoding..."
        );


        const response =
            await fetch(
                apiUrl,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Reverse geocoding API failed."
            );
        }


        const data =
            await response.json();


        console.log(
            "Reverse Geocoding Response:",
            data
        );


        /* =================================================
           FIND CITY
           ================================================= */

        const city =
            data.city ||
            data.locality ||
            data.localityInfo?.administrative
                ?.find(
                    item =>
                        item.adminLevel === 8
                )
                ?.name ||
            data.principalSubdivision ||
            "Current Location";


        /* =================================================
           FIND STATE
           ================================================= */

        const state =
            data.principalSubdivision ||
            "";


        /* =================================================
           FIND COUNTRY
           ================================================= */

        const country =
            data.countryName ||
            "";


        /* =================================================
           BUILD LOCATION TEXT
           ================================================= */

        const parts = [];


        if (city) {

            parts.push(city);
        }


        if (
            state &&
            state !== city
        ) {

            parts.push(state);
        }


        if (
            country &&
            !parts.includes(country)
        ) {

            parts.push(country);
        }


        const locationText =
            parts.join(", ");


        /* =================================================
           DISPLAY LOCATION
           ================================================= */

        if (locationText) {

            locationElement.textContent =
                `📍 ${locationText}`;

            retryButton.classList.add(
                "hidden"
            );


            console.log(
                "Detected Location:",
                locationText
            );

        } else {

            throw new Error(
                "Readable location unavailable."
            );
        }

    } catch (error) {

        console.error(
            "Reverse geocoding error:",
            error
        );


        /*
         * If API fails, DO NOT use IP location.
         *
         * Instead show coordinates.
         * This prevents wrong city names.
         */

        locationElement.textContent =
            `📍 ${latitude.toFixed(4)}, ` +
            `${longitude.toFixed(4)}`;


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
    function() {

        detectLocation();
    }
);


/* =========================================================
   ANALOG CLOCK
   ========================================================= */

function drawAnalogClock(now) {

    /*
     * Get actual displayed canvas size.
     * This keeps the analog clock responsive.
     */

    const displayedSize =
        Math.min(
            canvas.clientWidth || 220,
            canvas.clientHeight || 220
        );


    /*
     * Device Pixel Ratio
     * improves sharpness on mobile.
     */

    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        Math.round(displayedSize * dpr);

    canvas.height =
        Math.round(displayedSize * dpr);


    /*
     * Reset canvas transformation.
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
     * Center and radius.
     */

    const center =
        displayedSize / 2;

    const radius =
        displayedSize * 0.43;


    /*
     * Clear canvas.
     */

    ctx.clearRect(
        0,
        0,
        displayedSize,
        displayedSize
    );


    /*
     * Move origin to center.
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


    ctx.strokeStyle =
        "white";

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
         * Calculate number angle.
         */

        const angle =
            number *
            Math.PI /
            6 -
            Math.PI / 2;


        /*
         * Number position.
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
         * Number style.
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
         * Draw number.
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
     * Restore canvas.
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
     * Rotate hand.
     */

    ctx.rotate(
        angle - Math.PI / 2
    );


    /*
     * Hand settings.
     */

    ctx.beginPath();

    ctx.lineWidth =
        width;

    ctx.lineCap =
        "round";

    ctx.strokeStyle =
        color;


    /*
     * Start from center.
     */

    ctx.moveTo(
        0,
        0
    );


    /*
     * Draw hand.
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
   ========================================================= */

window.addEventListener(
    "resize",
    function() {

        drawAnalogClock(
            new Date()
        );
    }
);


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.visibilityState ===
            "visible"
        ) {

            updateClock();

            /*
             * Refresh location when user
             * comes back to the page.
             */

            detectLocation();
        }
    }
);


/* =========================================================
   START LOCATION DETECTION
   ========================================================= */

detectLocation();

/* =========================================================
   TIMENOW - SCRIPT.JS
   Digital Clock + Analog Clock + Real-Time GPS Location
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

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    digitalClock.textContent =
        `${hours}:${minutes}:${seconds}`;

    dateElement.textContent =
        now.toDateString();

    drawAnalogClock(now);
}


/* =========================================================
   START DIGITAL CLOCK
   ========================================================= */

updateClock();

setInterval(updateClock, 1000);


/* =========================================================
   LIVE GPS LOCATION
   ========================================================= */

function detectLocation() {

    locationElement.textContent =
        "📍 Getting your live location...";

    retryButton.classList.add("hidden");


    /* Check browser GPS support */

    if (!navigator.geolocation) {

        locationElement.textContent =
            "📍 GPS is not supported by this browser.";

        retryButton.classList.remove("hidden");

        return;
    }


    /* Request fresh GPS location */

    navigator.geolocation.getCurrentPosition(

        /* =====================================================
           SUCCESS
           ===================================================== */

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                Math.round(position.coords.accuracy);


            console.log("=================================");
            console.log("LIVE GPS LOCATION");
            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);
            console.log("Accuracy:", accuracy + " meters");
            console.log("=================================");


            /*
             * Convert GPS coordinates
             * into village / locality / district / state / country
             */

            getReadableLocation(
                latitude,
                longitude
            );
        },


        /* =====================================================
           ERROR
           ===================================================== */

        function(error) {

            console.error(
                "GPS Error:",
                error
            );


            if (error.code === 1) {

                locationElement.textContent =
                    "📍 Location permission denied";

            }
            else if (error.code === 2) {

                locationElement.textContent =
                    "📍 GPS location unavailable";

            }
            else if (error.code === 3) {

                locationElement.textContent =
                    "📍 GPS timeout. Please retry";

            }
            else {

                locationElement.textContent =
                    "📍 Unable to get live location";
            }


            retryButton.classList.remove("hidden");
        },


        /* =====================================================
           GPS OPTIONS
           ===================================================== */

        {
            enableHighAccuracy: true,

            /*
             * Wait up to 30 seconds for GPS
             */

            timeout: 30000,

            /*
             * IMPORTANT:
             * 0 = don't use old cached location
             */

            maximumAge: 0
        }
    );
}


/* =========================================================
   REVERSE GEOCODING
   GPS Coordinates
   ↓
   Village / Locality
   ↓
   District
   ↓
   State
   ↓
   Country
   ========================================================= */

async function getReadableLocation(
    latitude,
    longitude
) {

    try {

        locationElement.textContent =
            "📍 Finding village / locality...";


        /*
         * BigDataCloud Reverse Geocoding API
         *
         * No Google Maps API key required.
         */

        const apiUrl =
            "https://api.bigdatacloud.net/data/" +
            "reverse-geocode-client" +
            "?latitude=" +
            encodeURIComponent(latitude) +
            "&longitude=" +
            encodeURIComponent(longitude) +
            "&localityLanguage=en";


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
                "Reverse geocoding API failed: " +
                response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "FULL LOCATION API RESPONSE:",
            data
        );


        /* =====================================================
           VILLAGE / LOCALITY
           ===================================================== */

        let locality = "";


        /*
         * First preference:
         * BigDataCloud locality
         */

        if (
            data.locality &&
            data.locality.trim() !== ""
        ) {

            locality =
                data.locality.trim();
        }


        /*
         * Second preference:
         * City
         */

        else if (
            data.city &&
            data.city.trim() !== ""
        ) {

            locality =
                data.city.trim();
        }


        /*
         * Third preference:
         * Administrative areas
         */

        else if (
            data.localityInfo &&
            Array.isArray(
                data.localityInfo.administrative
            )
        ) {

            const administrative =
                data.localityInfo.administrative;


            /*
             * Search from smallest area
             * towards larger area.
             */

            for (
                let i = administrative.length - 1;
                i >= 0;
                i--
            ) {

                const item =
                    administrative[i];


                if (
                    item &&
                    item.name &&
                    item.name.trim() !== ""
                ) {

                    locality =
                        item.name.trim();

                    break;
                }
            }
        }


        /* =====================================================
           DISTRICT
           ===================================================== */

        let district = "";


        /*
         * Search administrative data
         * for district.
         */

        if (
            data.localityInfo &&
            Array.isArray(
                data.localityInfo.administrative
            )
        ) {

            const administrative =
                data.localityInfo.administrative;


            for (
                let i = 0;
                i < administrative.length;
                i++
            ) {

                const item =
                    administrative[i];


                if (
                    !item ||
                    !item.name
                ) {

                    continue;
                }


                const itemName =
                    item.name.trim();


                /*
                 * Check known district indicators.
                 */

                const isDistrict =
                    item.description === "district" ||
                    item.nameType === "district" ||
                    item.adminLevel === 6;


                if (
                    isDistrict &&
                    itemName !== locality
                ) {

                    district =
                        itemName;

                    break;
                }
            }
        }


        /*
         * If district was not found,
         * use city only when it differs
         * from locality.
         */

        if (
            !district &&
            data.city &&
            data.city.trim() !== "" &&
            data.city.trim() !== locality
        ) {

            district =
                data.city.trim();
        }


        /* =====================================================
           STATE
           ===================================================== */

        const state =
            data.principalSubdivision
                ? data.principalSubdivision.trim()
                : "";


        /* =====================================================
           COUNTRY
           ===================================================== */

        const country =
            data.countryName
                ? data.countryName.trim()
                : "";


        /* =====================================================
           BUILD FINAL LOCATION
           ===================================================== */

        const locationParts = [];


        /*
         * Add Village / Locality
         */

        if (
            locality &&
            !locationParts.includes(locality)
        ) {

            locationParts.push(locality);
        }


        /*
         * Add District
         */

        if (
            district &&
            !locationParts.includes(district)
        ) {

            locationParts.push(district);
        }


        /*
         * Add State
         */

        if (
            state &&
            !locationParts.includes(state)
        ) {

            locationParts.push(state);
        }


        /*
         * Add Country
         */

        if (
            country &&
            !locationParts.includes(country)
        ) {

            locationParts.push(country);
        }


        /* =====================================================
           DISPLAY LOCATION
           ===================================================== */

        if (
            locationParts.length > 0
        ) {

            locationElement.textContent =
                "📍 " +
                locationParts.join(", ");


            console.log(
                "FINAL LOCATION:",
                locationParts.join(", ")
            );
        }


        /*
         * If API didn't return any address,
         * show GPS coordinates.
         */

        else {

            locationElement.textContent =
                "📍 " +
                latitude.toFixed(5) +
                ", " +
                longitude.toFixed(5);
        }

    }
    catch (error) {

        console.error(
            "Reverse geocoding error:",
            error
        );


        /*
         * Don't use IP location here.
         *
         * GPS coordinates are more reliable
         * than IP-based city detection.
         */

        locationElement.textContent =
            "📍 " +
            latitude.toFixed(5) +
            ", " +
            longitude.toFixed(5);


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
     * Makes analog clock responsive.
     */

    const displayedSize =
        Math.min(
            canvas.clientWidth || 220,
            canvas.clientHeight || 220
        );


    /*
     * Device Pixel Ratio
     * improves mobile sharpness.
     */

    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        displayedSize * dpr;

    canvas.height =
        displayedSize * dpr;


    /*
     * Reset transformation
     */

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


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

        const angle =
            number *
            Math.PI /
            6 -
            Math.PI / 2;


        const numberRadius =
            radius * 0.78;


        const x =
            Math.cos(angle) *
            numberRadius;


        const y =
            Math.sin(angle) *
            numberRadius;


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


        ctx.fillText(
            number,
            x,
            y
        );
    }


    /* =====================================================
       CURRENT TIME
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


    ctx.beginPath();

    ctx.lineWidth =
        width;

    ctx.lineCap =
        "round";

    ctx.strokeStyle =
        color;


    ctx.moveTo(
        0,
        0
    );


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
             * Refresh GPS when user returns
             * to the page.
             */

            detectLocation();
        }

    }
);


/* =========================================================
   START LOCATION DETECTION
   ========================================================= */

detectLocation();

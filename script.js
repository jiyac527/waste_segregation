// ============================
// AI Waste Segregation System
// Part 1
// ============================

const MODEL_URL = "./model/";

let model;
let maxPredictions;
let stream = null;

// HTML Elements
const uploadTab = document.getElementById("uploadTab");
const cameraTab = document.getElementById("cameraTab");

const uploadSection = document.getElementById("uploadSection");
const cameraSection = document.getElementById("cameraSection");

const imageUpload = document.getElementById("imageUpload");
const preview = document.getElementById("preview");

const webcam = document.getElementById("webcam");

const startCameraBtn = document.getElementById("startCamera");
const stopCameraBtn = document.getElementById("stopCamera");

const predictBtn = document.getElementById("predictBtn");

const loading = document.getElementById("loading");

// Keeps track of prediction source
let currentMode = "upload";


// ============================
// Load Teachable Machine Model
// ============================

async function loadModel(){

    loading.style.display = "block";
    loading.innerHTML = "Loading AI Model...";

    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);

    maxPredictions = model.getTotalClasses();

    loading.style.display = "none";

}

loadModel();


// ============================
// Upload Image
// ============================

imageUpload.addEventListener("change", function(){

    const file = this.files[0];

    if(!file) return;

    preview.src = URL.createObjectURL(file);

    preview.style.display = "block";

    currentMode = "upload";

});


// ============================
// Upload Tab
// ============================

uploadTab.addEventListener("click", ()=>{

    currentMode = "upload";

    uploadSection.style.display = "block";
    cameraSection.style.display = "none";

    uploadTab.classList.add("active");
    cameraTab.classList.remove("active");

});


// ============================
// Camera Tab
// ============================

cameraTab.addEventListener("click", ()=>{

    currentMode = "camera";

    uploadSection.style.display = "none";
    cameraSection.style.display = "block";

    cameraTab.classList.add("active");
    uploadTab.classList.remove("active");

});


// ============================
// Start Camera
// ============================

startCameraBtn.addEventListener("click", startCamera);

async function startCamera(){

    try{

        stream = await navigator.mediaDevices.getUserMedia({

            video:true,
            audio:false

        });

        webcam.srcObject = stream;

    }

    catch(err){

        alert("Unable to access camera.");

        console.error(err);

    }

}


// ============================
// Stop Camera
// ============================

stopCameraBtn.addEventListener("click", stopCamera);

function stopCamera(){

    if(stream){

        stream.getTracks().forEach(track=>track.stop());

        webcam.srcObject = null;

    }

}
// ============================
// Part 2
// Prediction + Confidence Bars
// ============================

predictBtn.addEventListener("click", predict);

async function predict(){

    if(!model){

        alert("Model is still loading.");
        return;

    }

    loading.style.display = "block";
    loading.innerHTML = "Predicting...";

    let prediction;

    // -----------------------
    // Upload Image Prediction
    // -----------------------

    if(currentMode === "upload"){

        if(preview.src === ""){

            loading.style.display = "none";

            alert("Please upload an image.");

            return;

        }

        prediction = await model.predict(preview);

    }

    // -----------------------
    // Webcam Prediction
    // -----------------------

    else{

        if(!webcam.srcObject){

            loading.style.display = "none";

            alert("Please start the camera.");

            return;

        }

        prediction = await model.predict(webcam);

    }

    loading.style.display = "none";

    // Sort by confidence
    prediction.sort((a,b)=>b.probability-a.probability);

    // Highest prediction
    const best = prediction[0];

    const percent = (best.probability*100).toFixed(2);

    document.getElementById("prediction").innerHTML =

    `
        <h2>${best.className}</h2>

        <h4>${percent}% Confidence</h4>
    `;

    // -----------------------
    // Confidence Bars
    // -----------------------

    let html = "";

    prediction.forEach(item=>{

        const p = (item.probability*100).toFixed(1);

        html +=

        `
        <div class="progress">

            <label>

                <span>${item.className}</span>

                <span>${p}%</span>

            </label>

            <div class="progressBar">

                <div class="progressFill"

                     style="width:${p}%">

                </div>

            </div>

        </div>

        `;

    });

    document.getElementById("confidence").innerHTML = html;
    showRecommendation(best);

}
// =================================
// Display Prediction
// =================================

function displayPrediction(prediction){

    const bestPrediction = prediction[0];

    const confidence = (bestPrediction.probability*100).toFixed(1);

    document.getElementById("prediction").innerHTML = `

        <h2>${bestPrediction.className}</h2>

        <p>${confidence}% Confidence</p>

    `;

    let html="";

    prediction.forEach(item=>{

        const percent=(item.probability*100).toFixed(1);

        html+=`

        <div class="progress">

            <label>

                <span>${item.className}</span>

                <span>${percent}%</span>

            </label>

            <div class="progressBar">

                <div class="progressFill"

                style="width:${percent}%">

                </div>

            </div>

        </div>

        `;

    });

    document.getElementById("confidence").innerHTML=html;

    showRecommendation(bestPrediction);

}
// =================================
// Waste Bin Recommendation
// =================================

function showRecommendation(bestPrediction){

    const waste = bestPrediction.className;

    let icon = "";
    let bin = "";
    let color = "";

    switch(waste){

        case "Plastic":

            icon = "♻️";
            bin = "Plastic Recycling Bin";
            color = "#00C853";

            break;

        case "Paper":

            icon = "📄";
            bin = "Paper Recycling Bin";
            color = "#42A5F5";

            break;

        case "Cardboard":

            icon = "📦";
            bin = "Paper / Cardboard Recycling Bin";
            color = "#8D6E63";

            break;

        case "Metal":

            icon = "🥫";
            bin = "Metal Recycling Bin";
            color = "#78909C";

            break;

        case "Organic":

            icon = "🌿";
            bin = "Organic Compost Bin";
            color = "#43A047";

            break;

        default:

            icon = "❓";
            bin = "Unknown Waste";
            color = "#616161";

    }

    document.getElementById("binRecommendation").innerHTML = `

        <div style="
            background:${color};
            color:white;
            padding:18px;
            border-radius:15px;
            margin-top:20px;
            text-align:center;
            box-shadow:0 10px 25px rgba(0,0,0,0.2);
        ">

            <h2>${icon} ${waste}</h2>

            <h3 style="margin-top:10px;">
                Recommended Bin
            </h3>

            <p style="
                font-size:22px;
                font-weight:bold;
                margin-top:8px;
            ">
                ${bin}
            </p>

        </div>

    `;

    speakPrediction(waste);

}
// =================================
// Voice Output
// =================================

function speakPrediction(waste){

    // Check browser support
    if(!('speechSynthesis' in window)){
        return;
    }

    // Stop any previous speech
    window.speechSynthesis.cancel();

    let message = "";

    switch(waste){

        case "Plastic":
            message = "The detected waste is Plastic. Dispose it in the Plastic Recycling Bin.";
            break;

        case "Paper":
            message = "The detected waste is Paper. Dispose it in the Paper Recycling Bin.";
            break;

        case "Cardboard":
            message = "The detected waste is Cardboard. Dispose it in the Paper and Cardboard Recycling Bin.";
            break;

        case "Metal":
            message = "The detected waste is Metal. Dispose it in the Metal Recycling Bin.";
            break;

        case "Organic":
            message = "The detected waste is Organic. Dispose it in the Organic Compost Bin.";
            break;

        default:
            message = "Unable to identify the waste.";
    }

    const speech = new SpeechSynthesisUtterance(message);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);

}
// ======================================
// Part 6
// Loading + Reset + Camera Cleanup
// ======================================

// Hide loading initially
loading.style.display = "none";

// ----------------------------
// Reset Application
// ----------------------------

function resetPrediction(){

    document.getElementById("prediction").innerHTML =
    "Waiting for prediction...";

    document.getElementById("confidence").innerHTML = "";

    document.getElementById("binRecommendation").innerHTML = "";

}

// ----------------------------
// Reset when new image selected
// ----------------------------

imageUpload.addEventListener("change", resetPrediction);

// ----------------------------
// Reset when switching tabs
// ----------------------------

uploadTab.addEventListener("click", resetPrediction);

cameraTab.addEventListener("click", resetPrediction);

// ----------------------------
// Stop camera on page refresh
// ----------------------------

window.addEventListener("beforeunload", ()=>{

    if(stream){

        stream.getTracks().forEach(track=>track.stop());

    }

});

// ----------------------------
// Better Loading Effect
// ----------------------------

const originalPredict = predict;

predict = async function(){

    loading.style.display="block";

    loading.innerHTML="🤖 AI is analysing image...";

    predictBtn.disabled=true;

    predictBtn.innerHTML="Predicting...";

    try{

        await originalPredict();

    }

    catch(err){

        console.error(err);

        alert("Prediction failed.");

    }

    loading.style.display="none";

    predictBtn.disabled=false;

    predictBtn.innerHTML="🔍 Predict Waste";

};

// Reconnect button with new predict function
predictBtn.removeEventListener("click", originalPredict);
predictBtn.addEventListener("click", predict);
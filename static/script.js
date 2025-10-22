// static/script.js

// Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const predictBtn = document.getElementById('predictBtn');
const preview = document.getElementById('preview');
const fileName = document.getElementById('fileName');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const analyzeAnother = document.getElementById('analyzeAnother');

let selectedFile = null;

// Click to upload
uploadArea.addEventListener('click', () => fileInput.click());

// File selection
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        fileName.textContent = file.name;
        preview.classList.remove('hidden');
        predictBtn.disabled = false;
    }
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        selectedFile = file;
        fileName.textContent = file.name;
        preview.classList.remove('hidden');
        predictBtn.disabled = false;
    }
});

// Predict button
predictBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    // Hide previous results
    results.classList.add('hidden');
    preview.classList.add('hidden');
    
    // Show loading
    loading.classList.remove('hidden');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        // Send request
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        // Hide loading
        loading.classList.add('hidden');
        
        if (data.success) {
            displayResults(data);
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        loading.classList.add('hidden');
        alert(`Error: ${error.message}`);
    }
});

// Display results
function displayResults(data) {
    const resultCard = document.getElementById('resultCard');
    const resultIcon = document.getElementById('resultIcon');
    const predictionText = document.getElementById('predictionText');
    const confidenceText = document.getElementById('confidenceText');
    const fireProb = document.getElementById('fireProb');
    const safeProb = document.getElementById('safeProb');
    const fireBar = document.getElementById('fireBar');
    const safeBar = document.getElementById('safeBar');
    const alertMessage = document.getElementById('alertMessage');
    
    // Set prediction
    predictionText.textContent = data.prediction;
    confidenceText.textContent = `${(data.confidence * 100).toFixed(2)}%`;
    
    // Set probabilities
    const firePercent = (data.probabilities.fire * 100).toFixed(2);
    const safePercent = (data.probabilities.safe * 100).toFixed(2);
    
    fireProb.textContent = `${firePercent}%`;
    safeProb.textContent = `${safePercent}%`;
    
    fireBar.style.width = `${firePercent}%`;
    safeBar.style.width = `${safePercent}%`;
    
    // Style based on prediction
    if (data.alert) {
        resultCard.className = 'result-card result-fire';
        resultIcon.textContent = '🚨';
        alertMessage.className = 'alert-message alert-fire';
        alertMessage.textContent = data.message;
        alertMessage.classList.remove('hidden');
    } else {
        resultCard.className = 'result-card result-safe';
        resultIcon.textContent = '✅';
        alertMessage.className = 'alert-message alert-safe';
        alertMessage.textContent = data.message;
        alertMessage.classList.remove('hidden');
    }
    
    // Show results
    results.classList.remove('hidden');
}

// Analyze another
analyzeAnother.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    preview.classList.add('hidden');
    results.classList.add('hidden');
    predictBtn.disabled = true;
});

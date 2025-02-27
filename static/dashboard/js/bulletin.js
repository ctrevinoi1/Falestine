// js/bulletin.js

document.getElementById("generate-button").addEventListener("click", function() {
  const button = document.getElementById("generate-button");
  button.disabled = true;
  button.textContent = "Generating...";

  fetch('/dashboard/generate_bulletin', {
    method: 'POST'
  })
  .then(response => response.json())
  .then(data => {
    const bulletin = data.bulletin;
    document.getElementById("bulletin-output").innerHTML = marked.parse(bulletin);
    button.disabled = false;
    button.textContent = "Generate Bulletin";
  })
  .catch(err => {
    console.error("Error generating bulletin:", err);
    document.getElementById("bulletin-output").innerHTML = "<div class='error-message'>Error generating bulletin. Check console for details.</div>";
    button.disabled = false;
    button.textContent = "Generate Bulletin";
  });
});

// Optional: Function to generate bulletin on initial load if desired
// generateBulletin(); // Call this function if you want to load a bulletin on page load

function generateBulletin() {
  fetch('/dashboard/generate_bulletin', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
      const bulletin = data.bulletin;
      document.getElementById('bulletin-output').innerHTML = marked.parse(bulletin);
    })
    .catch(error => {
      console.error('Error generating bulletin:', error);
      document.getElementById("bulletin-output").innerHTML = "<div class='error-message'>Error loading initial bulletin.</div>";
    });
}
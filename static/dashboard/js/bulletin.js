// js/bulletin.js

document.getElementById("generate-button").addEventListener("click", function() {
    const button = document.getElementById("generate-button");
    button.disabled = true;
    button.textContent = "Generating...";
    
    // Call the backend endpoint to generate the bulletin
    fetch('/dashboard/generate_bulletin', {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      // Display the generated bulletin in markdown (or as plain text)
      const bulletin = data.bulletin;
      // Use Marked to parse Markdown
      document.getElementById("bulletin-output").innerHTML = marked.parse(bulletin);
      button.disabled = false;
      button.textContent = "Generate Bulletin";
    })
    .catch(err => {
      console.error("Error generating bulletin:", err);
      document.getElementById("bulletin-output").innerHTML = "Error generating bulletin. Check console for details.";
      button.disabled = false;
      button.textContent = "Generate Bulletin";
    });
});

function generateBulletin() {
  fetch('/dashboard/generate_bulletin', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
      const bulletin = data.bulletin;
      // Use Marked to parse Markdown
      document.getElementById('bulletin-output').innerHTML = marked.parse(bulletin);
    })
    .catch(error => {
      console.error('Error generating bulletin:', error);
    });
}
// js/news.js

// Store articles globally so we can filter them without refetching.
let allArticles = [];

// Called when the "Fetch News" button is pressed
async function fetchNews() {
  const response = await fetch('/dashboard/scrape_news', { method: 'POST' });
  if (!response.ok) {
    console.error('Error fetching news');
    return;
  }
  const data = await response.json();
  
  // Store articles in global variable
  allArticles = data.articles || [];
  renderArticles(allArticles);
}

// New filtering function
function filterArticles(category) {
  if (category === 'all') {
    // Show all
    renderArticles(allArticles);
    return;
  }
  
  // Filter the global articles by the passed category
  const filtered = allArticles.filter(article => 
    article.classification.includes(category)
  );
  renderArticles(filtered);
}

// Renders articles in #news-articles section
function renderArticles(articles) {
  const container = document.getElementById('news-articles');
  container.innerHTML = '';
  
  articles.forEach(article => {
    const classificationEmojis = article.classification.map(category => {
      switch (category) {
        case 'pro-palestinian/human rights':
          return '🇵🇸';   // Palestinian flag
        case 'neutral':
          return '⚪';    // white circle
        case 'pro-israeli':
          return '🇮🇱';   // Israeli flag
        case 'genocidal':
          return '💀';    // skull
        default:
          return '❓';
      }
    }).join(' ');

    const dateString = new Date(article.publish_date).toLocaleString();
    const articleDiv = document.createElement('div');
    articleDiv.className = 'news-article';
    articleDiv.innerHTML = `
      <h3>${article.title}</h3>
      <p><strong>Published:</strong> ${dateString}</p>
      <p><strong>URL:</strong> <a href="${article.url}" target="_blank">${article.url}</a></p>
      <p><strong>Classification:</strong> ${classificationEmojis}</p>
      <p>${article.content}</p>
      <hr/>
    `;
    container.appendChild(articleDiv);
  });
}

// On page load, set up event listener
document.addEventListener('DOMContentLoaded', () => {
  const fetchNewsBtn = document.getElementById('fetch-news');
  if (fetchNewsBtn) {
    fetchNewsBtn.addEventListener('click', fetchNews);
  }

  // Add filter button listeners
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      filterArticles(category);
    });
  });
});

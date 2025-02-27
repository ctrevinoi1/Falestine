// js/news.js

let allArticles = [];

async function fetchNews() {
  const fetchNewsBtn = document.getElementById('fetch-news');
  fetchNewsBtn.disabled = true;
  fetchNewsBtn.textContent = "Fetching News...";

  const response = await fetch('/dashboard/scrape_news', { method: 'POST' });
  if (!response.ok) {
    console.error('Error fetching news');
    fetchNewsBtn.disabled = false;
    fetchNewsBtn.textContent = "Fetch News";
    return;
  }
  const data = await response.json();

  allArticles = data.articles || [];
  renderArticles(allArticles);

  fetchNewsBtn.disabled = false;
  fetchNewsBtn.textContent = "Fetch News";
}

function filterArticles(category) {
  if (category === 'all') {
    renderArticles(allArticles);
    return;
  }

  const filtered = allArticles.filter(article =>
    article.classification.includes(category)
  );
  renderArticles(filtered);
}

function renderArticles(articles) {
  const container = document.getElementById('news-articles');
  container.innerHTML = '';

  if (articles.length === 0) {
    container.innerHTML = "<p class='no-articles'>No articles found for this filter.</p>";
    return;
  }

  articles.forEach(article => {
    const classificationEmojis = article.classification.map(category => {
      switch (category) {
        case 'pro-palestinian/human rights':
          return '🇵🇸';
        case 'neutral':
          return '⚪';
        case 'pro-israeli':
          return '🇮🇱';
        case 'genocidal':
          return '💀';
        default:
          return '❓';
      }
    }).join(' ');

    const dateString = new Date(article.publish_date).toLocaleString();
    const articleDiv = document.createElement('div');
    articleDiv.className = 'news-article';
    articleDiv.innerHTML = `
      <h3>${article.title}</h3>
      <p class="article-meta"><strong>Published:</strong> ${dateString} | <strong>Classification:</strong> ${classificationEmojis}</p>
      <p><a href="${article.url}" target="_blank" rel="noopener noreferrer">Read more</a></p>
      <hr/>
    `;
    container.appendChild(articleDiv);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const fetchNewsBtn = document.getElementById('fetch-news');
  if (fetchNewsBtn) {
    fetchNewsBtn.addEventListener('click', fetchNews);
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      filterArticles(category);
    });
  });
});
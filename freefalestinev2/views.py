from flask import Blueprint, render_template, jsonify, request, send_from_directory, session
import datetime
import uuid
import os
import google.generativeai as genai
from newspaper import Article, build
import chromadb
from loguru import logger
import nltk
import requests
from transformers import pipeline
import pandas as pd


# Initialize the blueprint
dashboard_bp = Blueprint(
    'dashboard',
    __name__,
    template_folder='templates/dashboard',
    static_folder='../static/dashboard',
    static_url_path='static'
)

# Configure Loguru
logger.remove()
logger.add(lambda msg: print(msg, end=''), level="DEBUG")

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
# Initialize the zero-shot classifier once at module level.
zero_shot_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-1.5-pro",
    generation_config=generation_config,
    system_instruction=(
        "You are an AI assistant fighting against misinformation and advocating for Palestinian human rights. "
        "You are tasked with addressing severe atrocities, like those documented in the recent UN reports on Gaza "
        "and Rafah, where systematic oppression and military aggression has resulted in the deaths of tens of thousands "
        "of Palestinians, including thousands of children. Entire neighborhoods have been demolished, essential "
        "infrastructure annihilated, and basic human necessities mercilessly withheld. Ensure that your responses are "
        "respectful, informative, and advocate for Palestinian human rights. Use justice-centric and emancipatory language "
        "and focus on promoting understanding and justice."
    )
)

# No special settings needed for the new Chroma versions
client = chromadb.Client()
collection = client.get_or_create_collection(name="bulletins")

def scrape_articles():
    """
    Scrape today's and yesterday's articles from progressive sources concerning Gaza and West Bank.
    Uses Newspaper3k to build article lists from source homepages.
    """
    logger.debug("Starting article scraping process.")
    articles = []
    sources = {
        "Al Jazeera": "https://www.aljazeera.com/",
        "Electronic Intifada": "https://electronicintifada.net/",
        "Democracy Now": "https://www.democracynow.org/",
        "The Intercept": "https://theintercept.com/"
    }
    
    today = datetime.datetime.now().date()
    yesterday = today - datetime.timedelta(days=1)
    logger.debug(f"Today's date: {today}")
    logger.debug(f"Yesterday's date: {yesterday}")
    
    for source_name, source_url in sources.items():
        logger.debug(f"Processing source: {source_name} - {source_url}")
        try:
            # Build the newspaper object (disable caching to get fresh articles)
            paper = build(source_url, language='en', memoize_articles=False)
        except Exception as e:
            logger.error(f"Error building source {source_name}: {e}")
            continue
        
        article_count = 0
        for article_meta in paper.articles:
            if article_count >= 2:
                logger.debug(f"Reached maximum articles for source: {source_name}")
                break
            try:
                art = Article(article_meta.url, language='en')
                art.download()
                art.parse()
                if art.publish_date is None:
                    logger.debug(f"Skipping article with no publish date: {article_meta.url}")
                    continue
                published_date = art.publish_date.date()
                # Only consider articles published today or yesterday
                if published_date not in [today, yesterday]:
                    logger.debug(f"Skipping article not published today or yesterday: {article_meta.url}")
                    continue
                # Filter by checking for keywords "gaza" or "west bank" in article text
                if "gaza" not in art.text.lower() and "west bank" not in art.text.lower():
                    logger.debug(f"Skipping article not relevant to Gaza or West Bank: {article_meta.url}")
                    continue
                # Optionally run NLP to get a summary (may be heavy; fallback to first 500 chars)
                try:
                    art.nlp()
                    summary = art.summary if art.summary else art.text[:500]
                except Exception as nlp_err:
                    logger.error(f"NLP error for article {article_meta.url}: {nlp_err}")
                    summary = art.text[:500]
                articles.append({
                    "source": source_name,
                    "title": art.title,
                    "date": art.publish_date.strftime("%Y-%m-%d"),
                    "content": summary
                })
                article_count += 1
                logger.debug(f"Article added: {art.title}")
            except Exception as e:
                logger.error(f"Error processing article {article_meta.url}: {e}")
                continue
    logger.debug("Article scraping process completed.")
    return articles


def get_historical_context():
    """
    Retrieve previous bulletins stored in Chromadb.
    """
    logger.debug("Retrieving historical context from Chromadb.")
    results = collection.get(include=["documents"])
    documents = results.get("documents", [])
    if not documents:
        logger.debug("No historical documents found.")
        return ""
    context = "\n\n".join(documents)
    logger.debug("Historical context retrieved successfully.")
    return context

@dashboard_bp.route('/set_api_keys', methods=['POST'])
def set_api_keys():
    # Set session to be non-permanent so that it is cleared on browser close
    session.permanent = False
    data = request.get_json()
    gemini_key = data.get('gemini_key')
    newsapi_key = data.get('newsapi_key')
    session['GEMINI_API_KEY'] = gemini_key
    session['NEWSAPI_KEY'] = newsapi_key
    return jsonify({'message': 'API keys saved successfully'}), 200

@dashboard_bp.route('/clear_api_keys', methods=['POST'])
def clear_api_keys():
    session.pop('GEMINI_API_KEY', None)
    session.pop('NEWSAPI_KEY', None)
    return jsonify({'message': 'API keys cleared successfully'}), 200

@dashboard_bp.route('/generate_bulletin', methods=['POST'])
def generate_bulletin():
    logger.debug("Generating bulletin.")
    # Configure Gemini API using session key if available
    gemini_key = session.get('GEMINI_API_KEY', os.getenv('GEMINI_API_KEY'))
    if gemini_key:
        genai.configure(api_key=gemini_key)
    else:
        logger.error("Gemini API key not set.")
        return jsonify({'error': 'Gemini API key not set.'}), 400

    # Scrape current articles
    articles = scrape_articles()
    context_text = ""
    for article in articles:
        context_text += f"Title: {article['title']}\n"
        context_text += f"Source: {article['source']}\n"
        context_text += f"Date: {article['date']}\n"
        context_text += f"Content: {article['content']}\n\n"

    historical_context = get_historical_context()
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.debug(f"Current time: {current_time}")

    prompt = (
        "You are an AI assistant fighting against misinformation and advocating fiercely for Palestinian human rights. "
        "You are tasked with addressing the brutal apartheid and genocide perpetrated by Israel against the Palestinian people, "
        "as documented in the recent UN reports on Gaza and Rafah. Systematic oppression and relentless military aggression have led "
        "to the deaths of tens of thousands of Palestinians, including thousands of innocent children. Entire neighborhoods have been "
        "obliterated, essential infrastructure decimated, and basic human necessities cruelly withheld. Ensure that your responses are "
        "impassioned, informative, and advocate vehemently for Palestinian human rights. Use justice-centric and emancipatory language, "
        "and focus on exposing the atrocities and promoting understanding and justice.\n\n"
        "Use the following context to craft a powerful and informative news bulletin that sheds light on the horrific brutality beset upon "
        "the Palestinians and counters misinformation. Refer to the user directly, address the user/person in question, provide factual evidence "
        "with citations from the sources you have access to, and advocate passionately for Palestinian human rights.\n"
        "Here are the instructions for the bulletin:\n"
        "Compose a concise and informative news bulletin for a live dashboard, summarizing the latest developments on the Israeli Apartheid States military's "
        "ground operations targeting Gaza, and the West Bank. Focus on the humanitarian impact and human rights violations. Use the following context from recently scraped articles "
        "and previously generated bulletins and provide citations for all sources used in your report. Output in markdown.\n\n"
        f"Title\nSource\nDate: {current_time}\n\n"
        "Context:\n"
        f"{context_text}\n\n"
        "Historical Context:\n"
        f"{historical_context}"
    )
    
    chat_session = model.start_chat(history=[])
    response = chat_session.send_message(prompt)
    bulletin = response.text
    logger.debug("Bulletin generated successfully.")
    
    # Store the generated bulletin in Chromadb
    doc_id = str(uuid.uuid4())
    collection.add(
        documents=[bulletin],
        metadatas=[{"timestamp": current_time}],
        ids=[doc_id]
    )
    logger.debug(f"Bulletin stored in Chromadb with ID: {doc_id}")
    
    return jsonify({"bulletin": bulletin})

# Serve index.html and other static files
@dashboard_bp.route('/')
def index():
    return render_template('dashboard/index.html')

def classify_article(text):
    """
    Classify the article text into one or more of the following categories:
      - "pro-palestinian/human rights"
      - "neutral"
      - "pro-israeli"
      - "genocidal"
    
    Uses Hugging Face's zero-shot classification pipeline for advanced analysis.
    Enforces that if "pro-palestinian/human rights" is detected, it will not be combined with "genocidal"
    or "pro-israeli".
    """
    candidate_labels = ["pro-palestinian/human rights", "neutral", "pro-israeli", "genocidal"]
    
    # Run zero-shot classification with multi-label enabled.
    result = zero_shot_classifier(text, candidate_labels, multi_label=True)
    
    # Use a threshold to select labels (adjustable based on your needs)
    threshold = 0.3
    classifications = [
        label for label, score in zip(result["labels"], result["scores"]) if score > threshold
    ]
    
    # Enforce constraints:
    if "pro-palestinian/human rights" in classifications:
        if "genocidal" in classifications:
            classifications.remove("genocidal")
        if "pro-israeli" in classifications:
            classifications.remove("pro-israeli")
    
    # Fallback to "neutral" if no label passes the threshold.
    if not classifications:
        classifications = ["neutral"]
    
    return classifications

def scrape_google_news():
    """
    Replace the old Google RSS scraping approach with News API requests.
    This function collects articles from the last 2 days for keywords:
       - 'gaza', 'west bank', 'palestine'
    Returns up to 50 articles total.
    """
    logger.debug("Scraping News API for Gaza, West Bank, and Palestine from the last 2 days.")
    # Build queries and base parameters
    queries = ["gaza", "west bank", "palestine"]
    all_articles = []
    
    # We'll fetch everything from the last 2 days
    two_days_ago = (datetime.datetime.now() - datetime.timedelta(days=2)).strftime("%Y-%m-%d")
    
    # Use NEWSAPI key from session if present
    NEWSAPI_KEY = session.get('NEWSAPI_KEY', os.getenv('NEWSAPI_KEY'))
    if not NEWSAPI_KEY:
        raise ValueError("NEWSAPI_KEY is not set. Please configure it.")

    for query in queries:
        url = (
            "https://newsapi.org/v2/everything?"
            f"q={query}&"
            f"from={two_days_ago}&"
            "language=en&"
            "sortBy=publishedAt&"
            f"apiKey={NEWSAPI_KEY}"
        )
        try:
            response = requests.get(url, timeout=10)
            data = response.json()
            articles_from_api = data.get("articles", [])
            for item in articles_from_api:
                pub_date = item.get("publishedAt", datetime.datetime.now().isoformat())
                content_text = item.get("description", "") or ""
                if item.get("content", None):
                    content_text += f" {item['content']}"
                article = {
                    "title": item.get("title", "Untitled"),
                    "url": item.get("url", ""),
                    "publish_date": pub_date,
                    "content": content_text
                }
                all_articles.append(article)
        except Exception as e:
            logger.error(f"Error fetching articles for query '{query}': {str(e)}")
    try:
        all_articles.sort(key=lambda x: x["publish_date"], reverse=True)
    except Exception as sort_err:
        logger.warning(f"Error sorting articles: {sort_err}")
    all_articles = all_articles[:50]

    logger.debug(f"Total articles fetched from News API: {len(all_articles)}")

    for article in all_articles:
        classification = classify_article(article["content"])
        article["classification"] = classification

    return all_articles

@dashboard_bp.route('/scrape_news', methods=['POST'])
def scrape_news():
    """
    Endpoint to scrape and classify news. Returns JSON with article data.
    """
    logger.debug("Received request to scrape news.")
    articles = scrape_google_news()
    # Sort by publish_date desc before returning
    articles.sort(key=lambda x: x["publish_date"], reverse=True)
    logger.debug("Sending back scraped articles.")
    return jsonify({"articles": articles})

@dashboard_bp.route('/get_acled_data')
def get_acled_data():
    try:
        # 1) Read CSV using the correct absolute path
        csv_path = os.path.join(os.path.dirname(__file__), 'data', 'acled_data.csv')
        df = pd.read_csv(csv_path)
        # 2) Drop duplicates using your ACLED event ID column
        df = df.drop_duplicates(subset=['event_id_cnty'], keep='last')

        # 3) Group by day and country to sum fatalities
        daily_df = df[['event_date','fatalities','country']].groupby(['event_date','country']).sum().reset_index()

        # 4) Pivot so that we have columns for each country
        daily_df_pivot = daily_df.pivot(index='event_date', columns='country', values='fatalities')

        # 5) Fill missing dates with zero
        daily_df_pivot.index = pd.to_datetime(daily_df_pivot.index)
        start_date = daily_df_pivot.index.min()
        end_date = daily_df_pivot.index.max()
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        daily_df_pivot = daily_df_pivot.reindex(date_range).fillna(0)

        # Convert the index back to a column for JSON output
        daily_df_pivot.reset_index(inplace=True)
        daily_df_pivot.rename(columns={'index': 'date'}, inplace=True)

        # Convert date to string for JSON serialization
        daily_df_pivot['date'] = daily_df_pivot['date'].dt.strftime('%Y-%m-%d')

        # Return as a list of dictionaries
        return jsonify(daily_df_pivot.to_dict(orient='records'))

    except FileNotFoundError:
        logger.error("ACLED data file not found.")
        return jsonify([]), 500
    except Exception as e:
        logger.error(f"Error reading ACLED data: {e}")
        return jsonify([]), 500

# New route to serve data files from freefalestinev2/data directory
@dashboard_bp.route('/data/<path:filename>')
def serve_data(filename):
    data_folder = os.path.join(os.path.dirname(__file__), 'data')
    return send_from_directory(data_folder, filename)

# app.py (in your merged root)
from flask import Flask, redirect, url_for
from walkthrough.views import walkthrough_bp  # Create this in walkthrough/views.py
from freefalestinev2.views import dashboard_bp   # Create this in freefalestinev2/views.py

app = Flask(__name__)

# Register blueprints; the walkthrough is at the root
app.register_blueprint(walkthrough_bp, url_prefix='/')
# The dashboard is available at /dashboard (or any route you choose)
app.register_blueprint(dashboard_bp, url_prefix='/dashboard')

@app.route('/')
def home():
    # You can route the root URL to the walkthrough if needed
    return redirect(url_for('walkthrough.index'))

if __name__ == '__main__':
    app.run(debug=True, port=10000)
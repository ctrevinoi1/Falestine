from flask import Blueprint, render_template, send_from_directory

# Update static_folder to point to ../static/walkthrough, since this file is in the walkthrough folder
walkthrough_bp = Blueprint('walkthrough', __name__, template_folder='templates', static_folder='../static/walkthrough')

@walkthrough_bp.route('/')
def index():
    return render_template('walkthrough/index.html')

@walkthrough_bp.route('/data/<path:filename>')
def serve_data(filename):
    # Serve GeoJSON files from the "data" folder relative to this blueprint
    return send_from_directory('data', filename)

@walkthrough_bp.route('/img/<path:filename>')
def serve_img(filename):
    # Serve image files from the "img" folder
    return send_from_directory('img', filename)

@walkthrough_bp.route('/js/<path:filename>')
def serve_js(filename):
    # Serve JavaScript files from the "js" folder
    return send_from_directory('js', filename)

@walkthrough_bp.route('/css/<path:filename>')
def serve_css(filename):
    # Serve CSS files from the "css" folder
    return send_from_directory('css', filename)

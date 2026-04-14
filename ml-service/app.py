from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
import re
import numpy as np
from analyzer import ReviewAnalyzer

app = Flask(__name__)
CORS(app)

analyzer = ReviewAnalyzer()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": analyzer.model_name})

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    reviews = data.get('reviews', [])
    if not reviews:
        return jsonify({"error": "No reviews provided"}), 400

    results = analyzer.analyze_batch(reviews)
    return jsonify(results)

@app.route('/analyze/single', methods=['POST'])
def analyze_single():
    data = request.get_json()
    review = data.get('review', '')
    if not review:
        return jsonify({"error": "No review provided"}), 400

    result = analyzer.analyze_single(review)
    return jsonify(result)

@app.route('/train', methods=['POST'])
def train():
    """Retrain the model with new data"""
    data = request.get_json()
    reviews = data.get('reviews', [])
    labels = data.get('labels', [])
    if len(reviews) != len(labels):
        return jsonify({"error": "Mismatch between reviews and labels"}), 400

    result = analyzer.train(reviews, labels)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

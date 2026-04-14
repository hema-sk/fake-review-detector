#!/usr/bin/env python3
"""
Run this once before starting the Flask server to pre-train and verify the model.
Usage: python train_model.py
"""
from analyzer import ReviewAnalyzer

if __name__ == '__main__':
    print("=" * 50)
    print("ReviewGuard AI — Model Training")
    print("=" * 50)
    analyzer = ReviewAnalyzer()
    print(f"\n✅ Model ready: {analyzer.model_name}")
    print("You can now start the Flask server with: python app.py")

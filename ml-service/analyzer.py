import re
import numpy as np
import pickle
import os
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# Download NLTK data on first run
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')

# ─── Fake review heuristic patterns ─────────────────────────────────────────
FAKE_PATTERNS = [
    r'\b(best|greatest|amazing|perfect|excellent|wonderful|fantastic|incredible|outstanding|superb)\b',
    r'\b(must buy|must have|highly recommend|5 stars|five stars)\b',
    r'(!!!|😍|❤️|🔥|⭐){2,}',
    r'\b(buy now|order now|click here|limited time|discount|coupon|promo)\b',
    r'\b(verified purchase|i was given|received (this|the) product (for|in exchange))\b',
]

GENUINE_PATTERNS = [
    r'\b(however|although|but|unfortunately|downside|con|negative|issue|problem|disappointing)\b',
    r'\b(compared to|previously used|replaced my|switched from)\b',
    r'\b(after \d+ (days|weeks|months|years))\b',
    r'\b(my (daughter|son|husband|wife|friend|family|dog|cat))\b',
]


class ReviewAnalyzer:
    def __init__(self):
        self.model_name = "Naive Bayes + TF-IDF"
        self.stemmer = PorterStemmer()
        try:
            self.stop_words = set(stopwords.words('english'))
        except Exception:
            self.stop_words = set()
        self.pipeline = None
        self._load_or_train()

    # ─── Text Preprocessing ────────────────────────────────────────────────
    def preprocess(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r'http\S+|www\S+', '', text)
        text = re.sub(r'[^a-z\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        tokens = text.split()
        tokens = [self.stemmer.stem(t) for t in tokens if t not in self.stop_words and len(t) > 2]
        return ' '.join(tokens)

    # ─── Feature engineering ───────────────────────────────────────────────
    def extract_features(self, text: str) -> dict:
        text_lower = text.lower()
        fake_score = sum(1 for p in FAKE_PATTERNS if re.search(p, text_lower, re.IGNORECASE))
        genuine_score = sum(1 for p in GENUINE_PATTERNS if re.search(p, text_lower, re.IGNORECASE))

        words = text.split()
        caps_ratio = sum(1 for w in words if w.isupper()) / max(len(words), 1)
        exclamation_count = text.count('!')
        avg_word_len = np.mean([len(w) for w in words]) if words else 0
        review_length = len(words)
        unique_ratio = len(set(words)) / max(len(words), 1)

        return {
            "fake_pattern_hits": fake_score,
            "genuine_pattern_hits": genuine_score,
            "caps_ratio": round(caps_ratio, 3),
            "exclamation_count": exclamation_count,
            "avg_word_length": round(avg_word_len, 2),
            "review_length": review_length,
            "unique_word_ratio": round(unique_ratio, 3),
        }

    # ─── Build synthetic training data ────────────────────────────────────
    def _get_training_data(self):
        fake_reviews = [
            "This is the best product I have ever purchased in my entire life! Absolutely amazing! Must buy!!!",
            "WOW! Perfect product! Amazing quality! Five stars! Highly recommend to everyone!!!",
            "Best purchase ever! Incredible value! Love it so much! Buy now!",
            "Greatest item! Perfect in every way! Outstanding! Superb quality! Order now!",
            "This product is fantastic! Wonderful experience! Excellent! Cannot recommend enough!",
            "Amazing product amazing quality amazing price amazing seller 5 stars!",
            "BEST PRODUCT EVER!!!! SO HAPPY WITH IT!!!! BUY IT NOW!!!!",
            "Perfect! Incredible! Outstanding! Superb! Greatest purchase of my life!!!",
            "Love love love this product! Amazing amazing amazing! Must have!",
            "Excellent quality! Best value! Perfect item! Highly recommend! 5 stars!",
            "This is just perfect! No complaints at all! 100% recommend! Wonderful!",
            "Great product great quality great seller fast shipping five stars!",
            "Absolutely love it! Perfect purchase! Amazing deal! Buy now everyone!",
            "Best thing I ever bought! So amazing! So perfect! Highly recommend!!!",
            "Outstanding product! Incredible quality! Must buy! Best seller! Amazing!",
            "I received this product for free in exchange for my honest review. It is amazing!",
            "Was given this item to test. Absolutely fantastic! Best product ever!",
            "Received as gift for review. Perfect! Outstanding! Highly recommend!",
        ]

        genuine_reviews = [
            "I've been using this for about 3 months now. The build quality is decent but the battery life could be better. However, for the price point it's good value.",
            "Bought this to replace my old one. Works well overall, although the instructions were a bit confusing at first. My husband loves it though.",
            "After 2 weeks of use, I noticed some wear on the edges. Not a dealbreaker, but worth mentioning. Customer service was responsive when I had questions.",
            "Compared to the previous model I owned, this version has improved battery life but the screen is slightly smaller. Decent trade-off.",
            "My daughter uses this for school. It works fine for basic tasks but struggles with multiple apps open simultaneously. Acceptable for the price.",
            "It took me a while to figure out the settings but once configured it works great. The downside is the setup process isn't intuitive at all.",
            "Good product but the color was slightly different from the pictures online. Otherwise it matches the description and does what it says.",
            "Purchased this after reading several reviews. It arrived on time and works as described. One minor issue: the zipper feels a bit flimsy.",
            "I've tried similar products before and this one is somewhere in the middle in terms of quality. Not the best but certainly not the worst.",
            "Used this for a camping trip last month. Held up well in the rain but the straps were a bit uncomfortable after long hours. Would still buy again.",
            "Solid product. Had a small defect on arrival but the company replaced it quickly. Now it works perfectly. Minus one star for initial quality control.",
            "The size runs a bit small so order one size up. Otherwise the material is comfortable and it looks exactly like the photos.",
            "After switching from a competitor brand I can say this performs similarly but costs less. A few features I miss but overall happy with the switch.",
            "Works as advertised. Not the most exciting product but it does the job reliably. Setup took about 20 minutes which was a bit long.",
            "My cat knocked it off the counter twice and it still works fine. Sturdy build. However the buttons feel a little cheap.",
            "Decent product but I wish the packaging was less wasteful. The item itself functions well though I've only had it for a week.",
            "Good value for money. Some assembly required which wasn't mentioned clearly. Once assembled it's sturdy and looks nice.",
            "Had some issues initially but after a firmware update everything works smoothly. The design is clean and minimalist which I like.",
        ]

        reviews = fake_reviews + genuine_reviews
        labels = [1] * len(fake_reviews) + [0] * len(genuine_reviews)
        return reviews, labels

    # ─── Train / Load model ────────────────────────────────────────────────
    def _load_or_train(self):
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                self.pipeline = pickle.load(f)
            print(f"[ML] Model loaded from {MODEL_PATH}")
        else:
            reviews, labels = self._get_training_data()
            self.train(reviews, labels)

    def train(self, reviews: list, labels: list) -> dict:
        processed = [self.preprocess(r) for r in reviews]
        X_train, X_test, y_train, y_test = train_test_split(
            processed, labels, test_size=0.2, random_state=42
        )
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
            ('clf', MultinomialNB(alpha=0.5))
        ])
        self.pipeline.fit(X_train, y_train)
        y_pred = self.pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(self.pipeline, f)

        print(f"[ML] Model trained. Accuracy: {accuracy:.2%}")
        return {"status": "trained", "accuracy": round(accuracy, 4), "samples": len(reviews)}

    # ─── Prediction ────────────────────────────────────────────────────────
    def _predict(self, text: str):
        processed = self.preprocess(text)
        proba = self.pipeline.predict_proba([processed])[0]
        label = int(np.argmax(proba))
        features = self.extract_features(text)

        # Heuristic boost: adjust confidence using pattern hits
        fake_prob = proba[1]
        genuine_prob = proba[0]

        if features['fake_pattern_hits'] >= 2 and fake_prob < 0.6:
            fake_prob = min(fake_prob + 0.15, 0.95)
            genuine_prob = 1 - fake_prob
        if features['genuine_pattern_hits'] >= 2 and genuine_prob < 0.6:
            genuine_prob = min(genuine_prob + 0.15, 0.95)
            fake_prob = 1 - genuine_prob

        label = 1 if fake_prob > genuine_prob else 0
        confidence = max(fake_prob, genuine_prob)

        return {
            "label": label,
            "classification": "FAKE" if label == 1 else "GENUINE",
            "confidence": round(float(confidence), 4),
            "fake_probability": round(float(fake_prob), 4),
            "genuine_probability": round(float(genuine_prob), 4),
            "features": features,
        }

    def analyze_single(self, review: str) -> dict:
        result = self._predict(review)
        result["review"] = review[:200] + "..." if len(review) > 200 else review
        return result

    def analyze_batch(self, reviews: list) -> dict:
        results = []
        for i, r in enumerate(reviews):
            res = self._predict(r)
            res["id"] = i + 1
            res["review"] = r[:200] + "..." if len(r) > 200 else r
            results.append(res)

        fake_count = sum(1 for r in results if r['label'] == 1)
        genuine_count = len(results) - fake_count
        avg_confidence = np.mean([r['confidence'] for r in results])

        return {
            "total": len(results),
            "fake_count": fake_count,
            "genuine_count": genuine_count,
            "fake_percentage": round(fake_count / len(results) * 100, 1),
            "genuine_percentage": round(genuine_count / len(results) * 100, 1),
            "avg_confidence": round(float(avg_confidence), 4),
            "results": results,
        }

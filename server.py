from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from os import PathLike


APP_NAME = "SEARCHING"

# --- FIX: Updated for Render Deployment ---
# Changed default to 0.0.0.0 so Render can detect the port
HOST = os.environ.get("HOST", "0.0.0.0") 
PORT = int(os.environ.get("PORT", "8080"))
# ------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
GOOGLE_TRENDS_RSS = "https://trends.google.com/trending/rss"
GEO = "US"
REFRESH_SECONDS = 300
MAX_TRENDS = 24

# Updated User Agent to match the deployment host
USER_AGENT = f"Searching/1.0 (+http://{HOST})"


CATEGORY_MAP = {
    "autos and vehicles": "Autos and Vehicles",
    "beauty and fashion": "Beauty and Fashion",
    "business and finance": "Business and Finance",
    "climate": "Climate",
    "entertainment": "Entertainment",
    "food and drink": "Food and Drink",
    "games": "Games",
    "health": "Health",
    "hobbies and leisure": "Hobbies and Leisure",
    "jobs and education": "Jobs and Education",
    "law and government": "Law and Government",
    "other": "Other",
    "pets and animals": "Pets and Animals",
    "politics": "Politics",
    "science": "Science",
    "shopping": "Shopping",
    "sports": "Sports",
    "technology": "Technology",
    "travel and transportation": "Travel and Transportation",
}

# ... [Taxonomy and helper functions remain the same as your previous version] ...

TAXONOMY = [
    {
        "category": "Autos and Vehicles",
        "rss_terms": ("autos and vehicles", "automotive"),
        "keywords": ("car", "truck", "suv", "ev", "tesla", "ford", "toyota", "honda", "bmw", "uber", "lyft"),
        "subcategories": [
            {"name": "Motorsports", "keywords": ("f1", "formula 1", "nascar", "indycar", "motogp", "grand prix", "qualifying")},
            {"name": "Electric Vehicles", "keywords": ("ev", "electric vehicle", "tesla", "rivian", "lucid", "charging")},
            {"name": "Car Brands", "keywords": ("ford", "toyota", "honda", "bmw", "mercedes", "audi", "nissan", "kia", "hyundai")},
        ],
    },
    {
        "category": "Beauty and Fashion",
        "rss_terms": ("beauty and fashion", "style"),
        "keywords": ("fashion", "makeup", "beauty", "runway", "nails", "skincare", "perfume", "hair", "outfit", "dress"),
        "subcategories": [
            {"name": "Fashion", "keywords": ("fashion", "runway", "outfit", "dress", "designer", "collection")},
            {"name": "Beauty", "keywords": ("makeup", "beauty", "skincare", "hair", "perfume", "cosmetics", "sephora")},
        ],
    },
    {
        "category": "Business and Finance",
        "rss_terms": ("business and finance", "business", "finance"),
        "keywords": ("stock", "market", "earnings", "dow", "nasdaq", "s&p", "ipo", "fed", "economy", "crypto", "bitcoin", "tariff"),
        "subcategories": [
            {"name": "Markets", "keywords": ("stock", "market", "dow", "nasdaq", "s&p", "futures", "wall street")},
            {"name": "Crypto", "keywords": ("bitcoin", "ethereum", "crypto", "dogecoin", "solana")},
            {"name": "Companies", "keywords": ("earnings", "ipo", "layoffs", "revenue", "ceo", "shareholder")},
        ],
    },
    {
        "category": "Climate",
        "rss_terms": ("climate", "weather"),
        "keywords": ("storm", "flood", "hurricane", "wildfire", "tornado", "rain", "earthquake", "snow", "heat", "forecast", "watch", "warning"),
        "subcategories": [
            {"name": "Severe Weather", "keywords": ("hurricane", "tornado", "storm", "flood", "wildfire", "watch", "warning")},
            {"name": "Forecasts", "keywords": ("forecast", "radar", "weather", "snow", "rain", "heat", "temperature")},
            {"name": "Earth & Climate", "keywords": ("earthquake", "climate", "drought", "el nino", "la nina")},
        ],
    },
    {
        "category": "Entertainment",
        "rss_terms": ("entertainment", "arts and entertainment"),
        "keywords": ("movie", "tv", "show", "series", "album", "song", "actor", "actress", "celebrity", "netflix", "hbo", "oscar", "grammy"),
        "subcategories": [
            {"name": "Film & TV", "keywords": ("movie", "film", "tv", "series", "show", "netflix", "hbo", "trailer", "episode")},
            {"name": "Music", "keywords": ("album", "song", "tour", "grammy", "spotify", "concert", "single")},
            {"name": "Celebrity", "keywords": ("celebrity", "actor", "actress", "dating", "wedding", "red carpet")},
        ],
    },
    {
        "category": "Food and Drink",
        "rss_terms": ("food and drink",),
        "keywords": ("recipe", "restaurant", "coffee", "burger", "pizza", "drink", "cocktail", "wine", "beer", "menu"),
        "subcategories": [
            {"name": "Restaurants", "keywords": ("restaurant", "menu", "reservation", "michelin", "opening")},
            {"name": "Recipes", "keywords": ("recipe", "bake", "cooking", "cookbook")},
            {"name": "Beverages", "keywords": ("coffee", "drink", "cocktail", "wine", "beer", "tea")},
        ],
    },
    {
        "category": "Games",
        "rss_terms": ("games", "gaming"),
        "keywords": ("game", "gaming", "xbox", "playstation", "nintendo", "steam", "fortnite", "minecraft", "mario", "zelda"),
        "subcategories": [
            {"name": "Console", "keywords": ("xbox", "playstation", "nintendo", "switch", "ps5")},
            {"name": "PC Gaming", "keywords": ("steam", "valorant", "counter-strike", "league of legends", "dota", "pc")},
            {"name": "Franchises", "keywords": ("fortnite", "minecraft", "mario", "zelda", "roblox", "pokemon")},
        ],
    },
    {
        "category": "Health",
        "rss_terms": ("health",),
        "keywords": ("health", "flu", "covid", "virus", "disease", "vaccine", "hospital", "mental health", "doctor", "medicare"),
        "subcategories": [
            {"name": "Public Health", "keywords": ("flu", "covid", "virus", "vaccine", "outbreak", "cdc")},
            {"name": "Care & Policy", "keywords": ("hospital", "doctor", "insurance", "medicare", "medicaid", "clinic")},
            {"name": "Wellness", "keywords": ("mental health", "fitness", "nutrition", "sleep", "wellness")},
        ],
    },
    {
        "category": "Hobbies and Leisure",
        "rss_terms": ("hobbies and leisure",),
        "keywords": ("horoscope", "crossword", "festival", "craft", "garden", "gardening", "book club", "festival", "camping"),
        "subcategories": [
            {"name": "Events", "keywords": ("festival", "fair", "parade", "expo", "comic con")},
            {"name": "Home Hobbies", "keywords": ("craft", "garden", "gardening", "diy", "sewing")},
            {"name": "Puzzles & Play", "keywords": ("crossword", "sudoku", "horoscope", "puzzle", "lottery")},
        ],
    },
    {
        "category": "Jobs and Education",
        "rss_terms": ("jobs and education", "education"),
        "keywords": ("school", "college", "university", "student", "teacher", "exam", "admissions", "job", "career", "hiring"),
        "subcategories": [
            {"name": "Education", "keywords": ("school", "college", "university", "student", "teacher", "exam", "sat", "act")},
            {"name": "Jobs", "keywords": ("job", "career", "hiring", "resume", "internship", "recruiting")},
        ],
    },
    {
        "category": "Law and Government",
        "rss_terms": ("law and government",),
        "keywords": ("court", "judge", "supreme court", "lawsuit", "legal", "senate", "house", "agency", "fbi", "irs", "policy"),
        "subcategories": [
            {"name": "Courts", "keywords": ("court", "judge", "lawsuit", "legal", "supreme court", "appeals")},
            {"name": "Federal Agencies", "keywords": ("fbi", "irs", "department", "agency", "sec", "epa", "doj")},
            {"name": "Legislation", "keywords": ("senate", "house", "bill", "policy", "hearing", "committee")},
        ],
    },
    {
        "category": "Pets and Animals",
        "rss_terms": ("pets and animals", "animals"),
        "keywords": ("dog", "cat", "puppy", "kitten", "pet", "zoo", "wildlife", "horse", "bird"),
        "subcategories": [
            {"name": "Pets", "keywords": ("dog", "cat", "puppy", "kitten", "pet")},
            {"name": "Wildlife", "keywords": ("wildlife", "zoo", "bird", "horse", "marine", "bear")},
        ],
    },
    {
        "category": "Politics",
        "rss_terms": ("politics",),
        "keywords": ("election", "president", "campaign", "poll", "debate", "white house", "governor", "mayor", "trump", "biden"),
        "subcategories": [
            {"name": "Elections", "keywords": ("election", "poll", "campaign", "primary", "ballot", "debate")},
            {"name": "White House", "keywords": ("white house", "president", "trump", "biden", "administration")},
            {"name": "State Politics", "keywords": ("governor", "mayor", "state senate", "city council")},
        ],
    },
    {
        "category": "Science",
        "rss_terms": ("science",),
        "keywords": ("space", "nasa", "rocket", "eclipse", "research", "study", "physics", "biology", "astronomy", "mission"),
        "subcategories": [
            {"name": "Space", "keywords": ("space", "nasa", "rocket", "astronaut", "launch", "mission", "spacex")},
            {"name": "Research", "keywords": ("study", "research", "scientists", "discovery", "physics", "biology")},
            {"name": "Sky Events", "keywords": ("eclipse", "meteor", "aurora", "comet", "moon")},
        ],
    },
    {
        "category": "Shopping",
        "rss_terms": ("shopping",),
        "keywords": ("sale", "deal", "amazon", "target", "walmart", "coupon", "shopping", "discount", "black friday"),
        "subcategories": [
            {"name": "Retail", "keywords": ("amazon", "target", "walmart", "store", "retail")},
            {"name": "Deals", "keywords": ("sale", "deal", "discount", "coupon", "clearance", "black friday")},
        ],
    },
    {
        "category": "Sports",
        "rss_terms": ("sports",),
        "keywords": (
            "game", "match", "vs", "playoffs", "final", "finals", "goal", "nba", "nfl", "mlb", "nhl", "wnba", "soccer",
            "football", "basketball", "baseball", "hockey", "tennis", "golf", "ufc", "mma", "fifa", "champions league",
            "arsenal", "real madrid", "maple leafs", "yankees", "lakers", "celtics", "chiefs", "eagles"
        ),
        "subcategories": [
            {"name": "Soccer", "keywords": ("soccer", "fifa", "champions league", "premier league", "arsenal", "real madrid", "barcelona", "manchester")},
            {"name": "Basketball", "keywords": ("nba", "wnba", "basketball", "lakers", "celtics", "knicks", "warriors")},
            {"name": "Football", "keywords": ("nfl", "football", "chiefs", "eagles", "cowboys", "touchdown")},
            {"name": "Baseball", "keywords": ("mlb", "baseball", "yankees", "dodgers", "mets", "home run")},
            {"name": "Hockey", "keywords": ("nhl", "hockey", "maple leafs", "stanley cup", "bruins", "rangers")},
            {"name": "Combat Sports", "keywords": ("ufc", "mma", "boxing", "wwe", "topuria", "gaethje")},
            {"name": "Tennis & Golf", "keywords": ("tennis", "golf", "pga", "masters", "wimbledon", "open")},
        ],
    },
    {
        "category": "Technology",
        "rss_terms": ("technology", "tech"),
        "keywords": ("ai", "openai", "chatgpt", "iphone", "android", "google", "apple", "microsoft", "software", "app", "chip", "startup"),
        "subcategories": [
            {"name": "AI", "keywords": ("ai", "openai", "chatgpt", "gemini", "anthropic", "llm")},
            {"name": "Consumer Tech", "keywords": ("iphone", "android", "apple", "google", "pixel", "samsung", "app")},
            {"name": "Enterprise & Chips", "keywords": ("microsoft", "nvidia", "chip", "semiconductor", "cloud", "startup", "software")},
        ],
    },
    {
        "category": "Travel and Transportation",
        "rss_terms": ("travel and transportation", "travel"),
        "keywords": ("flight", "airport", "airline", "travel", "tsa", "cruise", "train", "subway", "hotel", "destination"),
        "subcategories": [
            {"name": "Air Travel", "keywords": ("flight", "airport", "airline", "tsa", "delta", "united", "american airlines")},
            {"name": "Transit", "keywords": ("train", "subway", "metro", "bus", "amtrak")},
            {"name": "Trips & Stays", "keywords": ("travel", "hotel", "cruise", "destination", "vacation", "resort")},
        ],
    },
]

@dataclass
class SceneCache:
    payload: dict[str, Any] | None = None
    fetched_at: float = 0.0
    error: str | None = None

cache = SceneCache()

def stable_float(seed: str, salt: str) -> float:
    digest = hashlib.sha256(f"{seed}:{salt}".encode("utf-8")).hexdigest()
    return int(digest[:12], 16) / float(0xFFFFFFFFFFFF)

def stable_choice(seed: str, salt: str, values: tuple[str, ...]) -> str:
    index = int(stable_float(seed, salt) * len(values)) % len(values)
    return values[index]

def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))

def normalize_text(text: str) -> str:
    lowered = (text or "").lower()
    lowered = lowered.replace("&", " and ")
    lowered = re.sub(r"[^a-z0-9\s]+", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()

def parse_traffic_value(text: str) -> int:
    clean = (text or "").replace(",", "").replace("+", "").strip().upper()
    if not clean:
        return 500
    if clean.endswith("M"):
        return int(float(clean[:-1]) * 1_000_000)
    if clean.endswith("K"):
        return int(float(clean[:-1]) * 1_000)
    try:
        return int(float(clean))
    except ValueError:
        return 500

def score_keywords(haystack: str, keywords: tuple[str, ...]) -> int:
    score = 0
    for keyword in keywords:
        if keyword in haystack:
            score += 1 + keyword.count(" ")
    return score

def map_rss_categories(categories: list[str]) -> list[str]:
    mapped: list[str] = []
    for category in categories:
        normalized = normalize_text(category)
        for raw_key, pretty in CATEGORY_MAP.items():
            if raw_key in normalized or normalized in raw_key:
                if pretty not in mapped:
                    mapped.append(pretty)
    return mapped

def classify_trend(title: str, categories: list[str], news_items: list[dict[str, str]]) -> tuple[str, str, list[str], dict[str, Any]]:
    parts = [title]
    for news_item in news_items[:3]:
        parts.extend(
            (
                news_item.get("title", ""),
                news_item.get("source", ""),
            )
        )
    haystack = normalize_text(" ".join(parts))
    rss_matches = map_rss_categories(categories)

    best_rule: dict[str, Any] | None = None
    best_score = -1
    best_subcategory = "General"

    for rule in TAXONOMY:
        score = 0
        if rule["category"] in rss_matches:
            score += 5
        score += score_keywords(haystack, rule["keywords"])
        for rss_term in rule.get("rss_terms", ()):
            if rss_term in normalize_text(" ".join(categories)):
                score += 3

        chosen_subcategory = "General"
        sub_score_best = -1
        for sub in rule["subcategories"]:
            sub_score = score_keywords(haystack, sub["keywords"])
            if sub_score > sub_score_best:
                sub_score_best = sub_score
                chosen_subcategory = sub["name"]
        if sub_score_best > 0:
            score += sub_score_best * 2

        if score > best_score:
            best_rule = rule
            best_score = score
            best_subcategory = chosen_subcategory

    if not best_rule or best_score <= 0:
        category = rss_matches[0] if rss_matches else "Other"
        return category, "General", [category], {"score": best_score, "rssMatches": rss_matches}

    category = best_rule["category"]
    path = [category]
    if best_subcategory != "General":
        path.append(best_subcategory)
    return category, best_subcategory, path, {"score": best_score, "rssMatches": rss_matches}

def visual_dna(title: str, category: str, subcategory: str, traffic_value: int) -> dict[str, Any]:
    seed = f"{title.strip().lower()}::{category}::{subcategory}"
    prominence = clamp((traffic_value ** 0.5) / 1000, 0.18, 1.0)
    volume_scale = clamp(traffic_value / 300_000, 0.0, 1.0)
    return {
        "x": 0.1 + stable_float(seed, "x") * 0.8,
        "y": 0.18 + stable_float(seed, "y") * 0.64,
        "baseScale": 0.72 + stable_float(seed, "scale") * 0.76 + prominence * 0.24,
        "driftSpeed": 0.02 + stable_float(seed, "drift") * 0.04,
        "phase": stable_float(seed, "phase") * 6.283185307,
        "spin": -0.002 + stable_float(seed, "spin") * 0.004,
        "ringCount": 3 + int(volume_scale * 5) + int(stable_float(seed, "rings") * 2),
        "shards": 4 + int(stable_float(seed, "shards") * 8),
        "density": 0.35 + stable_float(seed, "density") * 0.5,
        "texture": stable_choice(seed, "texture", ("mist", "veil", "mesh", "dust")),
        "prominence": prominence,
    }

def text_of(element: ET.Element, tag: str) -> str:
    found = element.find(tag)
    return (found.text or "").strip() if found is not None else ""

def namespaced_text(element: ET.Element, local_name: str) -> str:
    for child in element:
        if child.tag.endswith(f"}}{local_name}") or child.tag == local_name:
            return (child.text or "").strip()
    return ""

def item_categories(item: ET.Element) -> list[str]:
    categories: list[str] = []
    for child in item.iter():
        local_name = child.tag.rsplit("}", 1)[-1]
        if local_name != "category":
            continue
        category = (child.text or "").strip()
        if category and category not in categories:
            categories.append(category)
    return categories or ["Other"]

def parse_rss(xml_bytes: bytes) -> dict[str, Any]:
    root = ET.fromstring(xml_bytes)
    channel = root.find("channel")
    if channel is None:
        raise ValueError("RSS channel missing")

    trends = []
    for index, item in enumerate(channel.findall("item")[:MAX_TRENDS]):
        title = text_of(item, "title") or "Untitled trend"
        link = text_of(item, "link")
        rss_categories = item_categories(item)
        news_items = []

        for news_item in item:
            if not news_item.tag.endswith("news_item"):
                continue
            news_items.append(
                {
                    "title": namespaced_text(news_item, "news_item_title"),
                    "url": namespaced_text(news_item, "news_item_url"),
                    "source": namespaced_text(news_item, "news_item_source"),
                }
            )

        category, subcategory, category_path, category_meta = classify_trend(title, rss_categories, news_items)
        traffic = namespaced_text(item, "approx_traffic")
        traffic_value = parse_traffic_value(traffic)
        dna = visual_dna(title, category, subcategory, traffic_value)

        trends.append(
            {
                "id": hashlib.sha1(title.encode("utf-8")).hexdigest()[:16],
                "index": index,
                "title": title,
                "category": category,
                "subCategory": subcategory,
                "categoryPath": category_path,
                "rssCategory": rss_categories[0] if rss_categories else "Other",
                "rssCategories": rss_categories,
                "link": link,
                "published": text_of(item, "pubDate"),
                "traffic": traffic,
                "trafficValue": traffic_value,
                "picture": namespaced_text(item, "picture"),
                "pictureSource": namespaced_text(item, "picture_source"),
                "news": news_items[:3],
                "dna": dna,
                "categoryMeta": category_meta,
            }
        )

    return {
        "app": APP_NAME,
        "sceneVersion": 2,
        "title": text_of(channel, "title") or "Google Trends RSS",
        "source": f"{GOOGLE_TRENDS_RSS}?geo={GEO}",
        "geo": GEO,
        "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(trends),
        "categoryUniverse": sorted({rule["category"] for rule in TAXONOMY}),
        "trends": trends,
    }

def fetch_scene(force: bool = False) -> dict[str, Any]:
    now = time.time()
    if not force and cache.payload and now - cache.fetched_at < REFRESH_SECONDS:
        return cache.payload

    url = f"{GOOGLE_TRENDS_RSS}?{urllib.parse.urlencode({'geo': GEO})}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            payload = parse_rss(response.read())
    except (urllib.error.URLError, TimeoutError, ET.ParseError, ValueError) as exc:
        cache.error = str(exc)
        if cache.payload:
            cached = dict(cache.payload)
            cached["stale"] = True
            cached["error"] = cache.error
            return cached
        raise

    cache.payload = payload
    cache.fetched_at = now
    cache.error = None
    return payload

class SearchingHandler(SimpleHTTPRequestHandler):
    server_version = "SearchingHTTP/1.0"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/scene":
            self.serve_scene(parsed.query)
            return
        if parsed.path == "/":
            self.path = "/index.html"
        super().do_GET()

    def serve_scene(self, query: str) -> None:
        params = urllib.parse.parse_qs(query)
        force = params.get("refresh", ["0"])[0] in {"1", "true", "yes"}

        try:
            scene = fetch_scene(force=force)
            body = json.dumps(scene, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            self.send_response(HTTPStatus.OK)
        except Exception as exc:  # noqa: BLE001
            body = json.dumps(
                {
                    "error": "Unable to fetch Google Trends RSS",
                    "detail": str(exc),
                    "source": f"{GOOGLE_TRENDS_RSS}?geo={GEO}",
                    "trends": [],
                    "count": 0,
                },
                ensure_ascii=False,
            ).encode("utf-8")
            self.send_response(HTTPStatus.BAD_GATEWAY)

        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def guess_type(self, path: str | PathLike[str]) -> str:
        path_str = os.fspath(path)
        if path_str.endswith(".js"):
            return "text/javascript"
        if path_str.endswith(".css"):
            return "text/css"
        return mimetypes.guess_type(path_str)[0] or "application/octet-stream"

def main() -> None:
    # --- FIX: Added specific host/port print for Render ---
    server = ThreadingHTTPServer((HOST, PORT), SearchingHandler)
    print(f"{APP_NAME} live on http://{HOST}:{PORT}")
    # ------------------------------------------------------
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
    finally:
        server.server_close()

if __name__ == "__main__":
    main()

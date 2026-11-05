from flask import Flask, request, jsonify, send_file
from io import BytesIO
from itertools import product
from rembg import remove, new_session
import os
import colorsys
import math
import random
import traceback
import requests


app = Flask(__name__)

# =========================================================
# GLOBAL SETTINGS
# =========================================================

REMBG_SESSION = None


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "Aura Flask backend çalışıyor",
        "endpoints": [
            "/api/test",
            "/api/arka-plan-sil",
            "/vektor-cikar",
            "/api/kombin-uret",
            "/api/gorsel-arama"
        ]
    }), 200


@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({
        "success": True,
        "message": "Aura Flask çalışıyor"
    }), 200


def get_rembg_session():
    global REMBG_SESSION

    if REMBG_SESSION is None:
        print("🧠 rembg modeli yükleniyor...")
        REMBG_SESSION = new_session("u2net")
        print("✅ rembg modeli hazır.")

    return REMBG_SESSION


# =========================================================
# FEATURE POOL
# =========================================================

FEATURES = {
    "colors": [
        "siyah", "beyaz", "kirik beyaz", "mavi", "bebe mavisi",
        "kirmizi", "bordo", "yesil", "zumrut", "haki",
        "bej", "krem", "gri", "antrasit", "kahverengi",
        "taba", "lacivert", "pembe", "fusya", "mor", "lila",
        "turuncu", "sari", "gold", "gumus", "jean mavi",
        "leopar", "desenli", "cok renkli"
    ],

    "styles": [
        "spor", "klasik", "casual", "streetwear", "oversize",
        "sik", "elegant", "minimal", "gunluk", "abiye"
    ],

    "seasons": [
        "yazlik", "kislik", "baharlik", "mevsimlik"
    ],

    "materials": [
        "pamuk", "keten", "deri", "jean", "triko",
        "saten", "kumas", "sifon"
    ]
}


# =========================================================
# COLOR MAP
# =========================================================

COLOR_HEX = {
    "siyah": "#050505",
    "beyaz": "#FFFFFF",
    "kirik beyaz": "#F8F4EA",
    "gri": "#9CA3AF",
    "antrasit": "#374151",
    "lacivert": "#1E1B4B",
    "mavi": "#2563EB",
    "bebe mavisi": "#93C5FD",
    "kirmizi": "#DC2626",
    "bordo": "#7F1D1D",
    "pembe": "#EC4899",
    "fusya": "#C026D3",
    "mor": "#7C3AED",
    "lila": "#C4B5FD",
    "yesil": "#16A34A",
    "zumrut": "#047857",
    "haki": "#4D7C0F",
    "bej": "#E7D8BD",
    "krem": "#FFF7E6",
    "kahverengi": "#7C2D12",
    "taba": "#B45309",
    "turuncu": "#F97316",
    "sari": "#FACC15",
    "gold": "#D4AF37",
    "gumus": "#C0C0C0",
    "jean mavi": "#3B82F6",
    "leopar": "#A16207",
    "desenli": "#A78BFA",
    "cok renkli": "#A78BFA",
}


# =========================================================
# TEXT HELPERS
# =========================================================

def normalize_text(text):
    text = str(text or "").lower().strip()

    replacements = {
        "ı": "i",
        "ğ": "g",
        "ü": "u",
        "ş": "s",
        "ö": "o",
        "ç": "c",
        "İ": "i",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text


def safe_etiketler(parca):
    etiketler = parca.get("etiketler", {})
    return etiketler if isinstance(etiketler, dict) else {}


def get_item_color(parca):
    etiketler = safe_etiketler(parca)

    return (
        parca.get("renk")
        or etiketler.get("renk")
        or etiketler.get("aiRenkAnalizi")
        or ""
    )


def get_item_alt_type(parca):
    etiketler = safe_etiketler(parca)

    return (
        parca.get("altKategori")
        or parca.get("altTur")
        or etiketler.get("secilenAltTur")
        or etiketler.get("altTur")
        or ""
    )


def get_item_category(parca):
    return (
        parca.get("type")
        or parca.get("kategori")
        or parca.get("anaKategori")
        or parca.get("category")
        or ""
    )


def item_full_text(parca):
    etiketler = safe_etiketler(parca)

    return normalize_text(" ".join([
        str(parca.get("type", "")),
        str(parca.get("rol", "")),
        str(parca.get("kategori", "")),
        str(parca.get("anaKategori", "")),
        str(parca.get("category", "")),
        str(parca.get("altKategori", "")),
        str(parca.get("altTur", "")),
        str(parca.get("stil", "")),
        str(parca.get("style", "")),
        str(parca.get("mevsim", "")),
        str(parca.get("materyal", "")),
        str(etiketler.get("altTur", "")),
        str(etiketler.get("secilenAltTur", "")),
        str(etiketler.get("renk", "")),
        str(etiketler.get("materyal", "")),
        str(etiketler.get("desen", "")),
    ]))


def item_type(parca):
    return normalize_text(parca.get("type") or "")


def kayitli_kategori_key(parca):
    """
    Kategori belirlemede artık serbest kelime araması yapmıyoruz.
    Öncelik:
    1) Firestore type alanı
    2) anaKategori / kategori / category alanı
    3) kullanıcının seçtiği altKategori / secilenAltTur
    4) en son, eski kayıtlar için güvenli fallback
    """

    etiketler = safe_etiketler(parca)

    type_value = normalize_text(parca.get("type", ""))

    type_map = {
        "top": "top",
        "bottom": "bottom",
        "dress": "dress",
        "outerwear": "outerwear",
        "shoes": "shoes",
        "shoe": "shoes",
        "bag": "bag",
        "accessory": "accessory",
        "accessories": "accessory",
    }

    if type_value in type_map:
        return type_map[type_value]

    ana_kategori = normalize_text(
        parca.get("anaKategori")
        or parca.get("kategori")
        or parca.get("category")
        or ""
    )

    kategori_map = {
        "ust giyim": "top",
        "ust": "top",
        "top": "top",

        "alt giyim": "bottom",
        "alt": "bottom",
        "bottom": "bottom",

        "elbise / tulum": "dress",
        "elbise": "dress",
        "tulum": "dress",
        "dress": "dress",

        "dis giyim": "outerwear",
        "outerwear": "outerwear",

        "ayakkabi": "shoes",
        "ayakkabI": "shoes",
        "shoes": "shoes",
        "shoe": "shoes",

        "canta": "bag",
        "bag": "bag",

        "aksesuar": "accessory",
        "accessory": "accessory",
        "accessories": "accessory",
    }

    if ana_kategori in kategori_map:
        return kategori_map[ana_kategori]

    alt_kategori = normalize_text(
        parca.get("altKategori")
        or parca.get("altTur")
        or etiketler.get("secilenAltTur")
        or ""
    )

    alt_map = {
        # ÜST GİYİM
        "tisort": "top",
        "tshirt": "top",
        "t-shirt": "top",
        "gomlek": "top",
        "bluz": "top",
        "crop": "top",
        "kazak": "top",
        "sweatshirt": "top",
        "hirka": "top",
        "askili": "top",
        "body": "top",

        # ALT GİYİM
        "pantolon": "bottom",
        "kot pantolon": "bottom",
        "kumas pantolon": "bottom",
        "etek": "bottom",
        "kot etek": "bottom",
        "sort": "bottom",
        "esofman": "bottom",
        "tayt": "bottom",

        # ELBİSE / TULUM
        "gunluk elbise": "dress",
        "abiye elbise": "dress",
        "mini elbise": "dress",
        "midi elbise": "dress",
        "maxi elbise": "dress",
        "triko elbise": "dress",
        "tulum": "dress",

        # DIŞ GİYİM
        "ceket": "outerwear",
        "blazer": "outerwear",
        "mont": "outerwear",
        "kaban": "outerwear",
        "trenckot": "outerwear",
        "deri ceket": "outerwear",
        "yelek": "outerwear",

        # AYAKKABI
        "spor ayakkabi": "shoes",
        "sneaker": "shoes",
        "bot": "shoes",
        "cizme": "shoes",
        "topuklu": "shoes",
        "babet": "shoes",
        "loafer": "shoes",
        "sandalet": "shoes",
        "terlik": "shoes",

        # ÇANTA
        "omuz cantasi": "bag",
        "el cantasi": "bag",
        "sirt cantasi": "bag",
        "clutch": "bag",
        "tote canta": "bag",
        "mini canta": "bag",

        # AKSESUAR
        "sapka": "accessory",
        "gozluk": "accessory",
        "kemer": "accessory",
        "kolye": "accessory",
        "kupe": "accessory",
        "bileklik": "accessory",
        "saat": "accessory",
        "fular": "accessory",
        "atki": "accessory",
    }

    if alt_kategori in alt_map:
        return alt_map[alt_kategori]

    # En son eski AI etiketi fallback olarak denenir.
    # Burada sadece net tekil kelimeler kullanıyoruz; "kot" gibi belirsiz kelimeler yok.
    ai_alt = normalize_text(etiketler.get("altTur", ""))

    ai_map = {
        "shirt": "top",
        "t-shirt": "top",
        "blouse": "top",
        "sweater": "top",

        "skirt": "bottom",
        "trousers": "bottom",
        "pants": "bottom",
        "shorts": "bottom",

        "dress": "dress",
        "jumpsuit": "dress",

        "coat": "outerwear",
        "jacket": "outerwear",

        "shoe": "shoes",
        "shoes": "shoes",
        "sneaker": "shoes",
        "boot": "shoes",
        "boots": "shoes",

        "bag": "bag",
        "handbag": "bag",

        "hat": "accessory",
        "belt": "accessory",
        "watch": "accessory",
        "necklace": "accessory",
        "earring": "accessory",
    }

    if ai_alt in ai_map:
        return ai_map[ai_alt]

    return "other"


def is_top_item(parca):
    return kayitli_kategori_key(parca) == "top"


def is_bottom_item(parca):
    return kayitli_kategori_key(parca) == "bottom"


def is_dress_item(parca):
    return kayitli_kategori_key(parca) == "dress"


def is_outerwear_item(parca):
    return kayitli_kategori_key(parca) == "outerwear"


def is_shoes_item(parca):
    return kayitli_kategori_key(parca) == "shoes"


def is_bag_item(parca):
    return kayitli_kategori_key(parca) == "bag"


def is_accessory_item(parca):
    return kayitli_kategori_key(parca) == "accessory"


def role_for_item(parca):
    key = kayitli_kategori_key(parca)

    if key == "top":
        return "üst"

    if key == "bottom":
        return "alt"

    if key == "dress":
        return "elbise"

    if key == "outerwear":
        return "dış giyim"

    if key == "shoes":
        return "ayakkabı"

    if key == "bag":
        return "çanta"

    if key == "accessory":
        return "aksesuar"

    return "parça"


def color_to_hex(color_value):
    color_value = normalize_text(color_value)

    if color_value.startswith("#") and len(color_value) >= 7:
        return color_value[:7]

    return COLOR_HEX.get(color_value, "#808080")


def sample_list(items, limit):
    items = list(items or [])
    random.shuffle(items)
    return items[:limit]


# =========================================================
# VECTOR ENGINE
# =========================================================

def parca_vektorize(parca):
    vector = []

    meta = " ".join([
        normalize_text(get_item_color(parca)),
        normalize_text(get_item_category(parca)),
        normalize_text(get_item_alt_type(parca)),
        normalize_text(parca.get("stil", "")),
        normalize_text(parca.get("style", "")),
        normalize_text(parca.get("mevsim", "")),
        normalize_text(parca.get("materyal", "")),
    ])

    for category in FEATURES.values():
        for item in category:
            vector.append(1 if item in meta else 0)

    vector.append(float(parca.get("formalityLevel", 5) or 5))
    vector.append(float(parca.get("warmthScore", 5) or 5))
    vector.append(float(parca.get("versatilityScore", 5) or 5))

    return vector


def cosine_similarity(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))

    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))

    if norm_a == 0 or norm_b == 0:
        return 0

    return (dot / (norm_a * norm_b)) * 100


# =========================================================
# HSV COLOR ENGINE
# =========================================================

def hex_to_hsv(hex_color):
    try:
        hex_color = color_to_hex(hex_color).lstrip("#")

        r = int(hex_color[0:2], 16) / 255
        g = int(hex_color[2:4], 16) / 255
        b = int(hex_color[4:6], 16) / 255

        return colorsys.rgb_to_hsv(r, g, b)
    except Exception:
        return colorsys.rgb_to_hsv(0.5, 0.5, 0.5)


def hsv_distance(hsv1, hsv2):
    hue_distance = min(
        abs(hsv1[0] - hsv2[0]),
        1 - abs(hsv1[0] - hsv2[0])
    )

    return math.sqrt(
        hue_distance ** 2 +
        (hsv1[1] - hsv2[1]) ** 2 +
        (hsv1[2] - hsv2[2]) ** 2
    )


def color_harmony_score(color1, color2):
    hsv1 = hex_to_hsv(color1)
    hsv2 = hex_to_hsv(color2)

    distance = hsv_distance(hsv1, hsv2)
    score = max(0, 100 - (distance * 100))

    return round(score, 1)


# =========================================================
# SCORING ENGINE
# =========================================================

def role_pair_score(role1, role2):
    pair = set([role1, role2])

    if pair == set(["üst", "alt"]):
        return 95

    if pair == set(["elbise", "ayakkabı"]):
        return 92

    if pair == set(["üst", "dış giyim"]):
        return 90

    if pair == set(["elbise", "dış giyim"]):
        return 88

    if "ayakkabı" in pair and ("üst" in pair or "alt" in pair or "elbise" in pair):
        return 86

    if "çanta" in pair and ("üst" in pair or "alt" in pair or "elbise" in pair):
        return 82

    if "aksesuar" in pair and ("üst" in pair or "alt" in pair or "elbise" in pair):
        return 78

    if pair == set(["çanta", "ayakkabı"]):
        return 80

    if pair == set(["aksesuar", "çanta"]):
        return 75

    if role1 == role2:
        return 55

    return 70


def style_score(item1, item2):
    s1 = normalize_text(item1.get("stil") or item1.get("style"))
    s2 = normalize_text(item2.get("stil") or item2.get("style"))

    if not s1 or not s2:
        return 70

    if s1 == s2:
        return 95

    return 65


def calculate_pair_score(item1, item2):
    v1 = parca_vektorize(item1)
    v2 = parca_vektorize(item2)

    cosine_score = cosine_similarity(v1, v2)
    hsv_score = color_harmony_score(get_item_color(item1), get_item_color(item2))

    role1 = role_for_item(item1)
    role2 = role_for_item(item2)

    category_score = role_pair_score(role1, role2)
    sty_score = style_score(item1, item2)

    final_score = (
        cosine_score * 0.25 +
        hsv_score * 0.35 +
        category_score * 0.25 +
        sty_score * 0.15
    )

    return {
        "final": round(final_score, 1),
        "details": {
            "cosineSimilarity": round(cosine_score, 1),
            "colorHarmony": round(hsv_score, 1),
            "categoryCompatibility": round(category_score, 1),
            "styleCompatibility": round(sty_score, 1)
        }
    }


def calculate_outfit_score(parts):
    items = [part["item"] for part in parts if part.get("item")]

    if not items:
        return {
            "final": 0,
            "details": {}
        }

    if len(items) == 1:
        base_score = 78 if role_for_item(items[0]) == "elbise" else 65

        return {
            "final": base_score,
            "details": {
                "baseScore": base_score,
                "note": "Tek ana parça skoru"
            }
        }

    pair_scores = []

    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            pair_scores.append(calculate_pair_score(items[i], items[j])["final"])

    average_pair = sum(pair_scores) / len(pair_scores) if pair_scores else 70

    roles = [part["role"] for part in parts]

    bonus = 0

    if ("üst" in roles and "alt" in roles) or "elbise" in roles:
        bonus += 7

    if "ayakkabı" in roles:
        bonus += 4

    if "dış giyim" in roles:
        bonus += 3

    if "çanta" in roles:
        bonus += 2

    if "aksesuar" in roles:
        bonus += 2

    final_score = min(100, average_pair + bonus)

    return {
        "final": round(final_score, 1),
        "details": {
            "averagePairScore": round(average_pair, 1),
            "completenessBonus": bonus,
            "pieceCount": len(items)
        }
    }


# Eski OpenAI çağrısını kapattık.
# Kotası bitince terminalde 429 basmasın diye Aura matematiksel motoru kullanılacak.
def generate_ai_outfits(*args, **kwargs):
    return None


# =========================================================
# OUTFIT GENERATION ENGINE
# =========================================================

def outfit_key(parts):
    return "|".join([
        f"{part['role']}:{part['item'].get('id')}"
        for part in parts
        if part.get("item") and part["item"].get("id") is not None
    ])


def build_result(parts, request_id):
    score_data = calculate_outfit_score(parts)

    role_id_map = {
        part["role"]: part["item"].get("id")
        for part in parts
        if part.get("item")
    }

    parcalar = [
        {
            "rol": part["role"],
            "id": part["item"].get("id"),
            "kategori": part["item"].get("kategori") or part["item"].get("anaKategori") or "",
            "altKategori": get_item_alt_type(part["item"]),
            "renk": get_item_color(part["item"]),
        }
        for part in parts
        if part.get("item")
    ]

    roles = [part["role"] for part in parts]

    if "elbise" in roles:
        stil_adi = "Aura Elbise Kombini"
        aciklama = "Elbise/tulum ana parça alınarak ayakkabı, çanta ve aksesuar uyumuyla oluşturuldu."
    elif "dış giyim" in roles:
        stil_adi = "Aura Katmanlı Kombin"
        aciklama = "Üst, alt ve dış giyim katmanı renk ve stil uyumuna göre eşleştirildi."
    elif "ayakkabı" in roles or "çanta" in roles or "aksesuar" in roles:
        stil_adi = "Aura Tam Kombin"
        aciklama = "Kıyafet, ayakkabı ve tamamlayıcı parçalar birlikte analiz edildi."
    else:
        stil_adi = "Aura Uyum Analizi"
        aciklama = "Vektörel analiz, kategori uyumu ve HSV renk teorisi ile oluşturuldu."

    # Eski ekranlar bozulmasın diye legacy alanlar da döndürülüyor.
    legacy_primary = (
        role_id_map.get("üst")
        or role_id_map.get("elbise")
        or (parcalar[0]["id"] if parcalar else None)
    )

    legacy_secondary = (
        role_id_map.get("alt")
        or role_id_map.get("ayakkabı")
        or role_id_map.get("dış giyim")
        or role_id_map.get("çanta")
        or role_id_map.get("aksesuar")
        or (parcalar[1]["id"] if len(parcalar) > 1 else None)
    )

    return {
        "stilAdi": stil_adi,

        "ustId": role_id_map.get("üst") or legacy_primary,
        "altId": role_id_map.get("alt") or legacy_secondary,

        "elbiseId": role_id_map.get("elbise"),
        "disGiyimId": role_id_map.get("dış giyim"),
        "ayakkabiId": role_id_map.get("ayakkabı"),
        "cantaId": role_id_map.get("çanta"),
        "aksesuarId": role_id_map.get("aksesuar"),

        "parcalar": parcalar,

        "uyumOrani": score_data["final"],
        "skorDetayi": score_data["details"],
        "aciklama": aciklama,
        "analizId": request_id
    }


def generate_outfit_candidates(groups, request_id):
    candidates = []
    seen = set()

    tops = sample_list(groups["tops"], 8)
    bottoms = sample_list(groups["bottoms"], 8)
    dresses = sample_list(groups["dresses"], 8)
    outerwears = sample_list(groups["outerwears"], 5)
    shoes = sample_list(groups["shoes"], 6)
    bags = sample_list(groups["bags"], 5)
    accessories = sample_list(groups["accessories"], 5)

    optional_outerwears = [None] + outerwears
    optional_shoes = [None] + shoes
    optional_bags = [None] + bags
    optional_accessories = [None] + accessories

    base_sets = []

    # Üst + alt ana kombinleri
    for top, bottom in product(tops, bottoms):
        base_sets.append([
            {"role": "üst", "item": top},
            {"role": "alt", "item": bottom},
        ])

    # Elbise / tulum tek ana parça sayılır
    for dress in dresses:
        base_sets.append([
            {"role": "elbise", "item": dress},
        ])

    random.shuffle(base_sets)

    for base in base_sets:
        # Her ana kombin için birkaç farklı tamamlayıcı varyasyon üret.
        for _ in range(8):
            parts = list(base)

            outerwear = random.choice(optional_outerwears)
            shoe = random.choice(optional_shoes)
            bag = random.choice(optional_bags)
            accessory = random.choice(optional_accessories)

            if outerwear:
                parts.append({"role": "dış giyim", "item": outerwear})

            if shoe:
                parts.append({"role": "ayakkabı", "item": shoe})

            if bag:
                parts.append({"role": "çanta", "item": bag})

            if accessory:
                parts.append({"role": "aksesuar", "item": accessory})

            key = outfit_key(parts)

            if key in seen:
                continue

            seen.add(key)
            candidates.append(build_result(parts, request_id))

    # Eğer hiç tamamlayıcı yoksa ana kombinler yine dönsün.
    if not candidates:
        for base in base_sets:
            key = outfit_key(base)

            if key in seen:
                continue

            seen.add(key)
            candidates.append(build_result(base, request_id))

    return candidates


def unique_by_outfit(results):
    seen = set()
    unique = []

    for item in results:
        if item.get("parcalar"):
            key = "|".join([
                f"{p.get('rol')}:{p.get('id')}"
                for p in item.get("parcalar", [])
            ])
        else:
            key = f"{item.get('ustId')}--{item.get('altId')}"

        if key in seen:
            continue

        seen.add(key)
        unique.append(item)

    return unique


def secimli_karistir_ve_dondur(final_results, limit=3):
    if not final_results:
        return []

    final_results = unique_by_outfit(final_results)

    final_results = sorted(
        final_results,
        key=lambda x: x["uyumOrani"],
        reverse=True
    )

    # En iyi 18 adayın içinden rastgele 3 seçiyoruz.
    # Çok kötü kombin gelmez ama hep aynı 3 de dönmez.
    havuz_boyutu = min(len(final_results), 18)
    aday_havuzu = final_results[:havuz_boyutu]

    random.shuffle(aday_havuzu)

    secilenler = aday_havuzu[:limit]

    secilenler = sorted(
        secilenler,
        key=lambda x: x["uyumOrani"],
        reverse=True
    )

    return secilenler


# =========================================================
# API ROUTE - KOMBIN
# =========================================================

@app.route("/api/kombin-uret", methods=["POST", "OPTIONS"])
def kombin_uret():
    if request.method == "OPTIONS":
        return "", 204

    try:
        data = request.get_json(silent=True) or {}
        gardirop = data.get("gardiropVerileri") or data.get("items") or []
        request_id = data.get("requestId") or str(random.randint(100000, 999999))

        if not isinstance(gardirop, list) or len(gardirop) < 1:
            return jsonify([]), 200

        valid_items = [
            p for p in gardirop
            if isinstance(p, dict) and p.get("id") is not None
        ]

        if not valid_items:
            return jsonify([]), 200

        groups = {
            "tops": [p for p in valid_items if is_top_item(p)],
            "bottoms": [p for p in valid_items if is_bottom_item(p)],
            "dresses": [p for p in valid_items if is_dress_item(p)],
            "outerwears": [p for p in valid_items if is_outerwear_item(p)],
            "shoes": [p for p in valid_items if is_shoes_item(p)],
            "bags": [p for p in valid_items if is_bag_item(p)],
            "accessories": [p for p in valid_items if is_accessory_item(p)],
        }

        # Eski kayıtlar için fallback:
        # Eğer üst/alt/elbiseye hiç ayrılamadıysa gardırobu ikiye böl.
        if not groups["tops"] and not groups["bottoms"] and not groups["dresses"]:
            orta = max(1, len(valid_items) // 2)
            groups["tops"] = valid_items[:orta]
            groups["bottoms"] = valid_items[orta:]

        # Ana kıyafet yoksa sonuç üretme.
        ana_kombin_var = (
            (groups["tops"] and groups["bottoms"])
            or groups["dresses"]
        )

        if not ana_kombin_var:
            return jsonify([]), 200

        final_results = generate_outfit_candidates(groups, request_id)

        secilenler = secimli_karistir_ve_dondur(final_results, limit=3)

        print(
            f"🎲 Aura kombin analizi {request_id} | "
            f"dolap:{len(valid_items)} "
            f"üst:{len(groups['tops'])} alt:{len(groups['bottoms'])} "
            f"elbise:{len(groups['dresses'])} dış:{len(groups['outerwears'])} "
            f"ayakkabı:{len(groups['shoes'])} çanta:{len(groups['bags'])} "
            f"aksesuar:{len(groups['accessories'])} "
            f"aday:{len(final_results)} dönen:{len(secilenler)}"
        )

        return jsonify(secilenler), 200

    except Exception as e:
        print("\n❌ /api/kombin-uret HATASI")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =========================================================
# LENS ENGINE - GORSEL ARAMA
# =========================================================

@app.route("/api/gorsel-arama", methods=["POST", "OPTIONS"])
def gorsel_arama():
    if request.method == "OPTIONS":
        return "", 204

    try:
        data = request.get_json(silent=True) or {}
        image_url = data.get("imageUrl")
        tip = normalize_text(data.get("tip", "benzer"))

        if not image_url:
            return jsonify({"error": "Görsel URL eksik"}), 400

        serpapi_key = os.getenv("SERPAPI_KEY")

        if not serpapi_key:
            return jsonify({"error": "SERPAPI_KEY bulunamadı"}), 500

        lens_params = {
            "engine": "google_lens",
            "url": image_url,
            "api_key": serpapi_key
        }

        lens_response = requests.get(
            "https://serpapi.com/search",
            params=lens_params,
            timeout=20
        )

        if lens_response.status_code != 200:
            return jsonify({
                "error": "SerpApi Google Lens yanıt vermedi",
                "status": lens_response.status_code,
                "detail": lens_response.text
            }), 500

        lens_results = lens_response.json()
        visual_matches = lens_results.get("visual_matches", [])

        def temiz_kelime_uret(raw_text):
            text = str(raw_text or "").strip()

            if not text:
                return ""

            cop_kelimeler = [
                "|", "/", "-", "–", "—",
                "buy", "price", "sale", "discount", "shop",
                "trendyol", "zara", "mango", "bershka", "pull&bear",
                "hm", "h&m", "amazon", "shein"
            ]

            for cop in cop_kelimeler:
                text = text.replace(cop, " ")

            parcalar = text.split()
            parcalar = parcalar[:7]

            return " ".join(parcalar).strip()

        gelen_alt = data.get("altKategori") or data.get("altTur") or ""
        gelen_kategori = data.get("anaKategori") or data.get("kategori") or data.get("type") or ""

        anahtar_kelime = temiz_kelime_uret(gelen_alt or gelen_kategori)

        if not anahtar_kelime:
            for match in visual_matches:
                title = temiz_kelime_uret(match.get("title", ""))

                if title and len(title) > 2:
                    anahtar_kelime = title
                    break

        if not anahtar_kelime:
            anahtar_kelime = "fashion piece"

        anahtar_norm = normalize_text(" ".join([
            anahtar_kelime,
            gelen_alt,
            gelen_kategori
        ]))

        def parca_turu_bul(text):
            top_words = [
                "tisort", "tshirt", "t shirt", "shirt", "gomlek", "bluz",
                "blouse", "crop", "top", "kazak", "sweater", "sweatshirt",
                "hoodie", "hirka", "cardigan", "body"
            ]

            bottom_words = [
                "etek", "skirt", "kot etek", "pantolon", "pants", "trousers",
                "jeans", "kot", "shorts", "sort", "tayt", "leggings"
            ]

            dress_words = [
                "elbise", "dress", "tulum", "jumpsuit"
            ]

            outerwear_words = [
                "ceket", "jacket", "blazer", "mont", "coat", "kaban",
                "trenckot", "trench", "yelek", "vest"
            ]

            shoes_words = [
                "ayakkabi", "shoe", "shoes", "sneaker", "bot", "boots",
                "cizme", "topuklu", "heels", "babet", "loafer", "sandalet"
            ]

            bag_words = [
                "canta", "bag", "handbag", "clutch", "tote"
            ]

            accessory_words = [
                "aksesuar", "hat", "sapka", "belt", "kemer", "kolye",
                "necklace", "earring", "kupe", "watch", "saat"
            ]

            if any(word in text for word in dress_words):
                return "dress"
            if any(word in text for word in outerwear_words):
                return "outerwear"
            if any(word in text for word in shoes_words):
                return "shoes"
            if any(word in text for word in bag_words):
                return "bag"
            if any(word in text for word in accessory_words):
                return "accessory"
            if any(word in text for word in bottom_words):
                return "bottom"
            if any(word in text for word in top_words):
                return "top"

            return "unknown"

        parca_turu = parca_turu_bul(anahtar_norm)

        # =====================================================
        # MOD 1: NASIL KOMBİNLERİM?
        # Mantık: seçilen parça + başka parça.
        # =====================================================
        if tip == "ilham":
            if parca_turu == "top":
                kombin_query = (
                    f"{anahtar_kelime} with jeans skirt trousers outfit "
                    f"full body street style how to style"
                )
            elif parca_turu == "bottom":
                kombin_query = (
                    f"{anahtar_kelime} with blouse shirt sweater jacket outfit "
                    f"full body street style how to style"
                )
            elif parca_turu == "dress":
                kombin_query = (
                    f"{anahtar_kelime} with jacket boots sneakers bag outfit "
                    f"full body street style how to style"
                )
            elif parca_turu == "outerwear":
                kombin_query = (
                    f"{anahtar_kelime} with jeans dress skirt boots outfit "
                    f"full body street style how to style"
                )
            elif parca_turu == "shoes":
                kombin_query = (
                    f"{anahtar_kelime} with jeans dress skirt outfit "
                    f"full body street style how to style"
                )
            elif parca_turu == "bag":
                kombin_query = (
                    f"{anahtar_kelime} with dress jeans blazer outfit "
                    f"full body street style how to style"
                )
            elif parca_turu == "accessory":
                kombin_query = (
                    f"{anahtar_kelime} with outfit full body street style "
                    f"how to style fashion"
                )
            else:
                kombin_query = (
                    f"{anahtar_kelime} with other clothes outfit full body "
                    f"street style how to style"
                )

            image_params = {
                "engine": "google_images",
                "q": kombin_query,
                "api_key": serpapi_key
            }

            image_response = requests.get(
                "https://serpapi.com/search",
                params=image_params,
                timeout=20
            )

            if image_response.status_code != 200:
                return jsonify({
                    "error": "SerpApi Google Images yanıt vermedi",
                    "status": image_response.status_code,
                    "detail": image_response.text
                }), 500

            image_results = image_response.json()
            images = image_results.get("images_results", [])

            temiz_sonuclar = []

            for item in images:
                baslik = item.get("title", "Kombin Fikri")
                link = item.get("link") or item.get("source") or ""
                resim = item.get("thumbnail") or item.get("original") or ""
                kaynak = item.get("source", "")

                baslik_lower = normalize_text(baslik)
                link_lower = normalize_text(link)
                kaynak_lower = normalize_text(kaynak)

                platform = "kombin"
                skor = 0

                if "outfit" in baslik_lower:
                    skor += 90
                if "how to style" in baslik_lower:
                    skor += 80
                if "how to wear" in baslik_lower:
                    skor += 70
                if "street style" in baslik_lower:
                    skor += 70
                if "full body" in baslik_lower:
                    skor += 55
                if "look" in baslik_lower:
                    skor += 40
                if "kombin" in baslik_lower:
                    skor += 70
                if "style" in baslik_lower:
                    skor += 45

                baska_parca_sinyali = [
                    "jeans", "pants", "trousers", "skirt", "dress",
                    "blouse", "shirt", "sweater", "jacket", "blazer",
                    "coat", "boots", "sneakers", "heels", "bag"
                ]

                if any(word in baslik_lower for word in baska_parca_sinyali):
                    skor += 70

                if "pinterest" in link_lower or "pinterest" in kaynak_lower:
                    platform = "pinterest"
                    skor += 40
                elif "instagram" in link_lower or "instagram" in kaynak_lower:
                    platform = "instagram"
                    skor += 35
                elif "tiktok" in link_lower or "tiktok" in kaynak_lower:
                    platform = "tiktok"
                    skor += 25

                tek_urun_sinyali = [
                    "buy", "shop", "price", "sale", "discount",
                    "trendyol", "zara", "mango", "bershka",
                    "pullandbear", "hm.com", "amazon", "shein"
                ]

                if any(word in baslik_lower or word in link_lower for word in tek_urun_sinyali):
                    skor -= 120

                if not resim or not link:
                    continue

                temiz_sonuclar.append({
                    "baslik": baslik,
                    "link": link,
                    "resim": resim,
                    "kaynak": kaynak,
                    "platform": platform,
                    "_skor": skor
                })

            temiz_sonuclar = sorted(
                temiz_sonuclar,
                key=lambda x: x.get("_skor", 0),
                reverse=True
            )

            final_sonuclar = []

            for item in temiz_sonuclar[:12]:
                item.pop("_skor", None)
                final_sonuclar.append(item)

            print(
                f"👗 Aura ilham araması | parça:{anahtar_kelime} "
                f"tür:{parca_turu} sorgu:{kombin_query} sonuç:{len(final_sonuclar)}"
            )

            return jsonify(final_sonuclar), 200

        # =====================================================
        # MOD 2: BENZERLERİNİ GÖR
        # Sadece seçilen parçaya benzeyen ürünleri/görselleri getirir.
        # =====================================================
        temiz_sonuclar = []

        for match in visual_matches:
            baslik = match.get("title", "Benzer Ürün")
            link = match.get("link", "")
            resim = match.get("thumbnail", "")
            kaynak = match.get("source", "")

            kaynak_lower = normalize_text(kaynak)
            link_lower = normalize_text(link)
            baslik_lower = normalize_text(baslik)

            platform = "web"
            skor = 0

            if (
                "trendyol" in kaynak_lower
                or "trendyol" in link_lower
                or "zara" in kaynak_lower
                or "zara" in link_lower
                or "mango" in kaynak_lower
                or "mango" in link_lower
                or "bershka" in kaynak_lower
                or "bershka" in link_lower
                or "pullandbear" in kaynak_lower
                or "pullandbear" in link_lower
                or "hm" in kaynak_lower
                or "hm" in link_lower
            ):
                platform = "alışveriş"
                skor += 90
            elif "pinterest" in kaynak_lower or "pinterest" in link_lower:
                platform = "pinterest"
                skor -= 10
            elif "instagram" in kaynak_lower or "instagram" in link_lower:
                platform = "instagram"
                skor -= 10

            if (
                "shop" in baslik_lower
                or "buy" in baslik_lower
                or "price" in baslik_lower
                or "urun" in baslik_lower
                or "ürün" in baslik_lower
            ):
                skor += 40

            if not resim or not link:
                continue

            temiz_sonuclar.append({
                "baslik": baslik,
                "link": link,
                "resim": resim,
                "kaynak": kaynak,
                "platform": platform,
                "_skor": skor
            })

        temiz_sonuclar = sorted(
            temiz_sonuclar,
            key=lambda x: x.get("_skor", 0),
            reverse=True
        )

        final_sonuclar = []

        for item in temiz_sonuclar[:12]:
            item.pop("_skor", None)
            final_sonuclar.append(item)

        return jsonify(final_sonuclar), 200

    except Exception as e:
        print("Gorsel arama hatasi")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =========================================================
# REMBG ENGINE - ARKA PLAN SILME
# =========================================================

@app.route("/api/arka-plan-sil", methods=["POST", "OPTIONS"])
def arka_plan_sil():
    if request.method == "OPTIONS":
        return "", 204

    try:
        if "image_file" not in request.files:
            return jsonify({"error": "image_file bulunamadı"}), 400

        image_file = request.files["image_file"]
        input_bytes = image_file.read()

        if not input_bytes:
            return jsonify({"error": "Boş görsel gönderildi"}), 400

        session = get_rembg_session()
        output_bytes = remove(input_bytes, session=session)

        return send_file(
            BytesIO(output_bytes),
            mimetype="image/png",
            as_attachment=False,
            download_name="kiyafet_temiz.png"
        )

    except Exception as e:
        print("\n❌ /api/arka-plan-sil HATASI")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =========================================================
# VECTOR ENDPOINT
# =========================================================

@app.route("/vektor-cikar", methods=["POST", "OPTIONS"])
def vektor_cikar():
    if request.method == "OPTIONS":
        return "", 204

    try:
        data = request.get_json(silent=True) or {}
        image_url = data.get("imageUrl", "")

        if not image_url:
            return jsonify({
                "success": False,
                "embedding": [],
                "message": "imageUrl eksik"
            }), 200

        # Güvenli fallback embedding.
        # Gerçek görüntü modeli bağlanırsa burası değiştirilebilir.
        seed = sum(ord(ch) for ch in image_url) % 100000
        rng = random.Random(seed)
        embedding = [round(rng.random(), 6) for _ in range(128)]

        return jsonify({
            "success": True,
            "embedding": embedding
        }), 200

    except Exception as e:
        print("\n❌ /vektor-cikar HATASI")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "embedding": [],
            "error": str(e)
        }), 200


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":
    print("🚀 Aura Flask backend başlıyor...")
    print("📌 Bilgisayardan test: http://127.0.0.1:5000/api/test")
    print("📌 Telefondan test:   http://192.168.0.8:5000/api/test")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False
    )

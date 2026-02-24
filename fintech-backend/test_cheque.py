"""Quick validation of cheque extraction logic."""
import re

# ---- Copy core logic for isolated testing ----

WORD_TO_NUM = {
    "ZERO": 0, "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4,
    "FIVE": 5, "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9,
    "TEN": 10, "ELEVEN": 11, "TWELVE": 12, "THIRTEEN": 13,
    "FOURTEEN": 14, "FIFTEEN": 15, "SIXTEEN": 16,
    "SEVENTEEN": 17, "EIGHTEEN": 18, "NINETEEN": 19,
    "TWENTY": 20, "THIRTY": 30, "FORTY": 40,
    "FIFTY": 50, "SIXTY": 60, "SEVENTY": 70,
    "EIGHTY": 80, "NINETY": 90,
}

MULTIPLIERS = {
    "HUNDRED": 100, "THOUSAND": 1_000,
    "LAKH": 100_000, "LAKHS": 100_000, "LAC": 100_000, "LACS": 100_000,
    "CRORE": 10_000_000, "CRORES": 10_000_000,
}

_FUZZY_MAP = {
    "THUOSAND": "THOUSAND", "THOUSAN": "THOUSAND", "THOUSANO": "THOUSAND",
    "THOUSND": "THOUSAND", "THOUS": "THOUSAND", "THOUAND": "THOUSAND",
    "THOUSAMD": "THOUSAND",
    "HUNDERD": "HUNDRED", "HUNDERED": "HUNDRED", "HUNDRAD": "HUNDRED",
    "HUNDRE": "HUNDRED",
    "LACS": "LAKHS", "LAC": "LAKH", "LAKN": "LAKH", "LAKII": "LAKH",
    "FOURTY": "FORTY", "SEVEMTY": "SEVENTY", "NINTY": "NINETY",
    "IWO": "TWO", "TW0": "TWO", "IHREE": "THREE",
}

_ALL_NUM_WORDS = set(WORD_TO_NUM.keys()) | set(MULTIPLIERS.keys())


def _fuzzy_word(token):
    token = token.upper().strip()
    if token in WORD_TO_NUM or token in MULTIPLIERS:
        return token
    if token in _FUZZY_MAP:
        return _FUZZY_MAP[token]
    return token


def words_to_number(words):
    if not words:
        return None
    words = words.replace("RUPEES", "").replace("ONLY", "").replace("-", " ").strip()
    tokens = words.split()
    if not tokens:
        return None
    total = 0
    current = 0
    found_any = False
    for raw_token in tokens:
        token = _fuzzy_word(raw_token)
        if token in WORD_TO_NUM:
            current += WORD_TO_NUM[token]
            found_any = True
        elif token in MULTIPLIERS:
            if current == 0:
                current = 1
            current *= MULTIPLIERS[token]
            total += current
            current = 0
            found_any = True
        else:
            if len(raw_token) <= 2:
                continue
            if raw_token in {"THE", "AND", "OF", "FOR", "PAY", "SUM",
                             "AMOUNT", "TOTAL", "NET", "BEING", "RS"}:
                continue
            if found_any:
                break
            continue
    if not found_any:
        return None
    return total + current


def normalize_digits(digits):
    if not digits:
        return None
    try:
        cleaned = digits.replace(",", "").replace("/", "").replace("-", "").strip()
        cleaned = re.sub(r"[^\d]", "", cleaned)
        if not cleaned:
            return None
        return int(cleaned)
    except ValueError:
        return None


def _scan_number_word_sequence(text):
    words = re.findall(r"[A-Z]+", text)
    best_seq = []
    current_seq = []
    for w in words:
        corrected = _fuzzy_word(w)
        if corrected in _ALL_NUM_WORDS:
            current_seq.append(corrected)
        else:
            if len(current_seq) > len(best_seq):
                best_seq = current_seq[:]
            current_seq = []
    if len(current_seq) > len(best_seq):
        best_seq = current_seq
    if len(best_seq) >= 2:
        return " ".join(best_seq)
    return None


def extract_amount(text):
    text = text.upper()
    amount_words = None

    m = re.search(r"([A-Z\s]+RUPEES\s+ONLY)", text)
    if m:
        amount_words = m.group(1).strip()

    if not amount_words:
        m = re.search(r"RUPEES\s+([A-Z\s]+?)(?:\s*ONLY|\s*$|\n)", text)
        if m:
            amount_words = m.group(1).strip()

    if not amount_words:
        m = re.search(r"([A-Z\s]+?)\s+RUPEES", text)
        if m:
            candidate = m.group(1).strip()
            tokens = candidate.split()
            if any(t in _ALL_NUM_WORDS for t in tokens):
                amount_words = candidate

    if not amount_words:
        amount_words = _scan_number_word_sequence(text)

    digit_patterns = [
        r"₹\s*([\d,]+)\s*/?-?",
        r"RS\.?\s*([\d,]+)\s*/?-?",
        r"([\d,]+)\s*/-",
        r"([\d,]+)\s*/",
        r"\b(\d{1,3}(?:,\d{2,3})*)\b",
        r"\b(\d{4,})\b",
    ]

    amount_digits = None
    for pattern in digit_patterns:
        match = re.search(pattern, text)
        if match:
            raw = match.group(1).strip().rstrip("/-")
            if raw and any(c.isdigit() for c in raw):
                amount_digits = raw
                break

    return amount_digits, amount_words


# ================= TESTS =================

def test_words_to_number():
    # Printed cheque
    assert words_to_number("TEN THOUSAND RUPEES ONLY") == 10000
    print("  PASS: TEN THOUSAND RUPEES ONLY = 10000")

    # Handwritten cheque
    assert words_to_number("TWO LAKH SEVENTY THOUSAND") == 270000
    print("  PASS: TWO LAKH SEVENTY THOUSAND = 270000")

    # Fuzzy matching
    assert words_to_number("TWO LAKH SEVENTY THUOSAND") == 270000
    print("  PASS: TWO LAKH SEVENTY THUOSAND (fuzzy) = 270000")

    # With noise tokens
    assert words_to_number("TWO LAKH AND SEVENTY THOUSAND") == 270000
    print("  PASS: TWO LAKH AND SEVENTY THOUSAND (noise) = 270000")

    # Other amounts
    assert words_to_number("FIVE LAKH") == 500000
    print("  PASS: FIVE LAKH = 500000")

    assert words_to_number("ONE CRORE TWENTY LAKH") == 12000000
    print("  PASS: ONE CRORE TWENTY LAKH = 12000000")

    assert words_to_number("FIFTY THOUSAND") == 50000
    print("  PASS: FIFTY THOUSAND = 50000")

    assert words_to_number("THREE HUNDRED") == 300
    print("  PASS: THREE HUNDRED = 300")

    # None cases
    assert words_to_number(None) is None
    assert words_to_number("") is None
    print("  PASS: None/empty = None")


def test_normalize_digits():
    assert normalize_digits("2,70,000/-") == 270000
    print("  PASS: 2,70,000/- = 270000")

    assert normalize_digits("10,000/-") == 10000
    print("  PASS: 10,000/- = 10000")

    assert normalize_digits("10,000") == 10000
    print("  PASS: 10,000 = 10000")

    assert normalize_digits("270000") == 270000
    print("  PASS: 270000 = 270000")

    assert normalize_digits(None) is None
    print("  PASS: None = None")


def test_extract_amount():
    # Printed: "TEN THOUSAND RUPEES ONLY ... 10,000/-"
    d, w = extract_amount("TEN THOUSAND RUPEES ONLY ₹10,000/-")
    assert w == "TEN THOUSAND RUPEES ONLY"
    assert d == "10,000"
    print("  PASS: Printed cheque text parsed correctly")

    # Handwritten: "Two lakh Seventy Thousand ... 2,70,000/-"
    d2, w2 = extract_amount("TWO LAKH SEVENTY THOUSAND ₹2,70,000/-")
    assert w2 is not None  # should be found via sequence scan
    assert d2 == "2,70,000"
    print(f"  PASS: Handwritten parsed: words='{w2}', digits='{d2}'")

    # Word sequence without RUPEES
    _, w3 = extract_amount("PAY SELF TWO LAKH SEVENTY THOUSAND BLAH")
    assert w3 is not None
    assert words_to_number(w3) == 270000
    print(f"  PASS: No-RUPEES sequence: '{w3}' = {words_to_number(w3)}")


def test_scan_number_word_sequence():
    result = _scan_number_word_sequence("PAY SELF TWO LAKH SEVENTY THOUSAND BLAH BLAH")
    assert result == "TWO LAKH SEVENTY THOUSAND"
    print(f"  PASS: Sequence scan: '{result}'")

    result2 = _scan_number_word_sequence("SOMETHING FIVE CRORE TEN LAKH DONE")
    assert result2 == "FIVE CRORE TEN LAKH"
    print(f"  PASS: Sequence scan: '{result2}'")


if __name__ == "__main__":
    print("Testing words_to_number()...")
    test_words_to_number()
    print()

    print("Testing normalize_digits()...")
    test_normalize_digits()
    print()

    print("Testing extract_amount()...")
    test_extract_amount()
    print()

    print("Testing _scan_number_word_sequence()...")
    test_scan_number_word_sequence()
    print()

    print("=" * 40)
    print("ALL TESTS PASSED!")

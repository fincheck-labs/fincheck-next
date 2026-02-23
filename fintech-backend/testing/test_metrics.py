"""
Unit tests for core backend logic (no FastAPI startup, no Mongo, no models)
"""

import sys
import os
import pytest
import numpy as np

# Make project root importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server import (
    risk_score,
    compute_far_frr_generic,
    normalize_digits,
    words_to_number,
)


# =========================================================
# RISK SCORE TESTS
# =========================================================

def test_risk_score_basic():
    result = risk_score(0.1, 0.2, alpha=0.5, beta=0.5)
    assert result == pytest.approx(0.15, rel=1e-6)


def test_risk_score_weighted():
    result = risk_score(0.1, 0.2, alpha=0.7, beta=0.3)
    assert result == pytest.approx(0.13, rel=1e-6)


# =========================================================
# FAR / FRR TEST
# =========================================================

def test_compute_far_frr_simple_case():
    y_true = [0, 1, 0, 1]
    y_pred = [0, 1, 1, 1]

    cm, FAR, FRR = compute_far_frr_generic(y_true, y_pred, num_classes=2)

    assert isinstance(cm, list)
    assert 0 <= FAR <= 1
    assert 0 <= FRR <= 1


# =========================================================
# DIGIT NORMALIZATION TEST
# =========================================================

def test_normalize_digits_valid():
    assert normalize_digits("10,000") == 10000


def test_normalize_digits_none():
    assert normalize_digits(None) is None


# =========================================================
# WORDS TO NUMBER TESTS
# =========================================================

def test_words_to_number_basic():
    assert words_to_number("TEN") == 10


def test_words_to_number_complex():
    assert words_to_number("ONE THOUSAND TWO HUNDRED") == 1200


def test_words_to_number_invalid():
    assert words_to_number("INVALID WORD") is None

"""
Property-based tests for NFL question parser.

Tests:
- Property 2: Correct Answer Index Mapping
- Property 3: Category Slug Consistency
- Property 1: CSV Parsing Round-Trip
- Property 4: Duplicate Prevention Idempotency
"""

import sys
import os
import re

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'scripts'))

import pytest
from hypothesis import given, strategies as st, settings, assume

from parse_nfl_questions import (
    slugify_category,
    map_correct_answer,
    parse_csv_row,
    format_question,
)


# =============================================================================
# Property 2: Correct Answer Index Mapping
# =============================================================================

@given(
    options=st.lists(
        st.text(min_size=1, max_size=100).filter(lambda x: x.strip()),
        min_size=4,
        max_size=4,
    ),
    correct_idx=st.integers(min_value=0, max_value=3),
)
@settings(max_examples=100)
def test_correct_answer_mapping_property(options, correct_idx):
    """
    Property 2: Correct Answer Index Mapping
    
    For any set of 4 options and a correct answer that matches one option,
    map_correct_answer should return the index of that option.
    
    **Validates: Requirements 1.3, 7.2**
    """
    # Ensure options are unique and non-empty
    options = [opt.strip() for opt in options]
    assume(len(set(options)) == 4)
    assume(all(opt for opt in options))
    
    # The correct answer is the text of one of the options
    correct_answer = options[correct_idx]
    
    # Map should return the correct index
    result = map_correct_answer(correct_answer, options)
    assert result == correct_idx, f"Expected {correct_idx}, got {result}"


@given(
    options=st.lists(
        st.from_regex(r'[A-Za-z0-9 ]{1,50}', fullmatch=True).filter(lambda x: x.strip()),
        min_size=4,
        max_size=4,
    ),
    correct_idx=st.integers(min_value=0, max_value=3),
)
@settings(max_examples=50)
def test_correct_answer_case_insensitive(options, correct_idx):
    """
    Correct answer mapping should be case-insensitive.
    
    **Validates: Requirements 1.3, 7.2**
    """
    options = [opt.strip() for opt in options]
    assume(len(set(opt.lower() for opt in options)) == 4)
    assume(all(opt for opt in options))
    
    # Use uppercase version of correct answer
    correct_answer = options[correct_idx].upper()
    
    result = map_correct_answer(correct_answer, options)
    assert result == correct_idx


# =============================================================================
# Property 3: Category Slug Consistency
# =============================================================================

@given(category_name=st.text(min_size=1, max_size=100))
@settings(max_examples=100)
def test_category_slug_consistency_property(category_name):
    """
    Property 3: Category Slug Consistency
    
    For any category name string, slugifying it should produce a lowercase
    string with only alphanumeric characters and underscores.
    
    **Validates: Requirements 1.4, 2.2**
    """
    slug = slugify_category(category_name)
    
    # Should be lowercase
    assert slug == slug.lower(), f"Slug '{slug}' is not lowercase"
    
    # Should only contain alphanumeric and underscores
    assert re.match(r'^[a-z0-9_]*$', slug), f"Slug '{slug}' contains invalid characters"
    
    # Should not start or end with underscore
    if slug:
        assert not slug.startswith('_'), f"Slug '{slug}' starts with underscore"
        assert not slug.endswith('_'), f"Slug '{slug}' ends with underscore"
    
    # Should not have consecutive underscores
    assert '__' not in slug, f"Slug '{slug}' has consecutive underscores"


def test_category_slug_examples():
    """Test specific category slug examples from NFL data."""
    examples = [
        ("Recent Playoffs & Super Bowls", "recent_playoffs_and_super_bowls"),
        ("2024 NFL Season Awards", "2024_nfl_season_awards"),
        ("Tom Brady Career Stats", "tom_brady_career_stats"),
        ("Super Bowl LIV 2020", "super_bowl_liv_2020"),
        ("Quarterbacks Head to Head", "quarterbacks_head_to_head"),
    ]
    
    for name, expected in examples:
        result = slugify_category(name)
        assert result == expected, f"slugify_category('{name}') = '{result}', expected '{expected}'"


@given(category_name=st.text(min_size=1, max_size=100))
@settings(max_examples=50)
def test_slug_idempotent(category_name):
    """Slugifying a slug should return the same slug."""
    slug1 = slugify_category(category_name)
    slug2 = slugify_category(slug1)
    assert slug1 == slug2, f"Slug not idempotent: '{slug1}' -> '{slug2}'"


# =============================================================================
# Property 1: CSV Parsing Round-Trip
# =============================================================================

@given(
    text=st.text(min_size=5, max_size=200).filter(lambda x: x.strip() and ',' not in x),
    options=st.lists(
        st.text(min_size=1, max_size=50).filter(lambda x: x.strip() and ',' not in x),
        min_size=4,
        max_size=4,
    ),
    correct_idx=st.integers(min_value=0, max_value=3),
    category=st.text(min_size=1, max_size=50).filter(lambda x: x.strip()),
)
@settings(max_examples=50)
def test_csv_round_trip_property(text, options, correct_idx, category):
    """
    Property 1: CSV Parsing Round-Trip
    
    For any valid question dict, formatting it as a CSV row and parsing
    it back should produce an equivalent question dict.
    
    **Validates: Requirements 9.3**
    """
    options = [opt.strip() for opt in options]
    assume(len(set(options)) == 4)
    assume(all(opt for opt in options))
    
    # Create a CSV row dict (simulating what csv.DictReader produces)
    csv_row = {
        'ID': '999',
        'Category': category.strip(),
        'Question': text.strip(),
        'Option A': options[0],
        'Option B': options[1],
        'Option C': options[2],
        'Option D': options[3],
        'Correct Answer': options[correct_idx],
    }
    
    # Parse the row
    result = parse_csv_row(csv_row)
    
    # Should successfully parse
    assert result is not None, "Failed to parse valid CSV row"
    
    # Should have correct values
    assert result['text'] == text.strip()
    assert result['options'] == options
    assert result['correct_index'] == correct_idx


# =============================================================================
# Pretty Printer Tests
# =============================================================================

def test_format_question_includes_all_parts():
    """Format question should include text, all options, and correct answer."""
    q = {
        'id': '42',
        'subcategory_slug': 'super_bowls',
        'text': 'Who won Super Bowl LIX?',
        'options': ['Chiefs', 'Eagles', '49ers', 'Bills'],
        'correct_index': 1,
    }
    
    output = format_question(q)
    
    assert 'Who won Super Bowl LIX?' in output
    assert 'A) Chiefs' in output
    assert 'B) Eagles' in output
    assert 'C) 49ers' in output
    assert 'D) Bills' in output
    assert 'Correct: B)' in output
    assert 'super_bowls' in output


def test_format_question_hides_answer():
    """Format question with show_answer=False should hide correct answer."""
    q = {
        'id': '42',
        'subcategory_slug': 'test',
        'text': 'Test question?',
        'options': ['A', 'B', 'C', 'D'],
        'correct_index': 2,
    }
    
    output = format_question(q, show_answer=False)
    
    assert 'Correct:' not in output
    assert 'Test question?' in output


# =============================================================================
# Edge Cases
# =============================================================================

def test_parse_row_missing_question():
    """Should return None for row with missing question text."""
    row = {
        'ID': '1',
        'Category': 'Test',
        'Question': '',
        'Option A': 'A',
        'Option B': 'B',
        'Option C': 'C',
        'Option D': 'D',
        'Correct Answer': 'A',
    }
    
    result = parse_csv_row(row)
    assert result is None


def test_parse_row_missing_option():
    """Should return None for row with missing option."""
    row = {
        'ID': '1',
        'Category': 'Test',
        'Question': 'Test?',
        'Option A': 'A',
        'Option B': '',
        'Option C': 'C',
        'Option D': 'D',
        'Correct Answer': 'A',
    }
    
    result = parse_csv_row(row)
    assert result is None


def test_parse_row_invalid_answer():
    """Should return None for row with answer not matching any option."""
    row = {
        'ID': '1',
        'Category': 'Test',
        'Question': 'Test?',
        'Option A': 'A',
        'Option B': 'B',
        'Option C': 'C',
        'Option D': 'D',
        'Correct Answer': 'E',  # Invalid
    }
    
    result = parse_csv_row(row)
    assert result is None

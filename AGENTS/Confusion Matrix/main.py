"""
Studzee Blog Generation Pipeline — Evaluation Script
Metrics: ROUGE, BLEU, Schema Compliance, Quiz Confusion Matrix
"""

import json
import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
from rouge_score import rouge_scorer
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
import nltk

nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)

# ─────────────────────────────────────────────
# 1. LOAD GENERATED JSON
# ─────────────────────────────────────────────

def load_blog_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Unwrap array if needed
    if isinstance(data, list) and len(data) == 1:
        data = data[0]
    return data


# ─────────────────────────────────────────────
# 2. SCHEMA COMPLIANCE SCORE
# Checks if all required keys and sub-structures exist
# ─────────────────────────────────────────────

REQUIRED_KEYS        = ["title", "content", "quiz", "facts", "summary", "key_notes", "imageUrl", "pdfUrl"]
REQUIRED_CONTENT_KEYS = ["title", "content"]
REQUIRED_QUIZ_KEYS   = ["que", "ans", "options"]
MIN_SECTIONS         = 8
REQUIRED_KEY_NOTES   = 5
REQUIRED_QUIZ_QS     = 5

def evaluate_schema(blog: dict) -> dict:
    results = {}
    total, passed = 0, 0

    # Top-level keys
    for key in REQUIRED_KEYS:
        total += 1
        ok = key in blog
        results[f"has_key::{key}"] = ok
        if ok:
            passed += 1

    # Content sections count
    total += 1
    section_count = len(blog.get("content", []))
    ok = section_count >= MIN_SECTIONS
    results[f"sections >= {MIN_SECTIONS} (got {section_count})"] = ok
    if ok:
        passed += 1

    # Each section has title + content
    for i, section in enumerate(blog.get("content", [])):
        for k in REQUIRED_CONTENT_KEYS:
            total += 1
            ok = k in section
            results[f"section[{i}]::{k}"] = ok
            if ok:
                passed += 1

    # Quiz has 5 questions
    total += 1
    quiz = blog.get("quiz", {})
    quiz_count = len(quiz)
    ok = quiz_count == REQUIRED_QUIZ_QS
    results[f"quiz has {REQUIRED_QUIZ_QS} questions (got {quiz_count})"] = ok
    if ok:
        passed += 1

    # Each quiz question has required keys + 4 options
    for qid, q in quiz.items():
        for k in REQUIRED_QUIZ_KEYS:
            total += 1
            ok = k in q
            results[f"quiz[{qid}]::{k}"] = ok
            if ok:
                passed += 1
        total += 1
        ok = len(q.get("options", [])) == 4
        results[f"quiz[{qid}]::4 options (got {len(q.get('options', []))})"] = ok
        if ok:
            passed += 1

    # Key notes has 5 entries
    total += 1
    kn_count = len(blog.get("key_notes", {}))
    ok = kn_count == REQUIRED_KEY_NOTES
    results[f"key_notes has {REQUIRED_KEY_NOTES} entries (got {kn_count})"] = ok
    if ok:
        passed += 1

    schema_score = (passed / total) * 100 if total > 0 else 0
    return {"score": round(schema_score, 2), "passed": passed, "total": total, "details": results}


# ─────────────────────────────────────────────
# 3. ROUGE + BLEU SCORES
# Compares generated text vs reference text
# Reference = the original sample.json summary/facts
# ─────────────────────────────────────────────

def extract_all_text(blog: dict) -> str:
    """Flatten all text content from the blog into one string."""
    parts = []
    parts.append(blog.get("title", ""))
    parts.append(blog.get("summary", ""))
    parts.append(blog.get("facts", ""))
    for note in blog.get("key_notes", {}).values():
        parts.append(note)
    for section in blog.get("content", []):
        parts.append(section.get("title", ""))
        for block in section.get("content", []):
            if block.get("type") == "text":
                parts.append(block.get("value", ""))
            elif block.get("type") == "list":
                parts.extend(block.get("items", []))
    return " ".join(p for p in parts if p)


def evaluate_rouge(generated: dict, reference: dict) -> dict:
    scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
    gen_text = extract_all_text(generated)
    ref_text = extract_all_text(reference)
    scores   = scorer.score(ref_text, gen_text)
    return {
        "ROUGE-1": round(scores["rouge1"].fmeasure * 100, 2),
        "ROUGE-2": round(scores["rouge2"].fmeasure * 100, 2),
        "ROUGE-L": round(scores["rougeL"].fmeasure * 100, 2),
    }


def evaluate_bleu(generated: dict, reference: dict) -> dict:
    gen_text = extract_all_text(generated)
    ref_text = extract_all_text(reference)
    ref_tokens = [nltk.word_tokenize(ref_text.lower())]
    gen_tokens =  nltk.word_tokenize(gen_text.lower())
    smooth = SmoothingFunction().method1
    bleu1 = sentence_bleu(ref_tokens, gen_tokens, weights=(1, 0, 0, 0), smoothing_function=smooth)
    bleu2 = sentence_bleu(ref_tokens, gen_tokens, weights=(0.5, 0.5, 0, 0), smoothing_function=smooth)
    bleu4 = sentence_bleu(ref_tokens, gen_tokens, weights=(0.25, 0.25, 0.25, 0.25), smoothing_function=smooth)
    return {
        "BLEU-1": round(bleu1 * 100, 2),
        "BLEU-2": round(bleu2 * 100, 2),
        "BLEU-4": round(bleu4 * 100, 2),
    }


# ─────────────────────────────────────────────
# 4. QUIZ CONFUSION MATRIX
# Treats quiz as a 4-class classification task:
# Did the model place the correct answer at index 0?
# We simulate "predicted" vs "actual" across all questions.
# ─────────────────────────────────────────────

def evaluate_quiz(blog: dict) -> dict:
    quiz = blog.get("quiz", {})
    y_true, y_pred = [], []

    for qid, q in quiz.items():
        correct_ans = q.get("ans", "").strip().lower()
        options     = [o.strip().lower() for o in q.get("options", [])]

        # Ground truth: the correct answer's actual position in options
        actual_pos = options.index(correct_ans) if correct_ans in options else -1

        # Predicted: model is supposed to always place correct answer at index 0
        predicted_pos = 0  # model's "claim"

        if actual_pos == -1:
            continue  # skip malformed question

        y_true.append(actual_pos)   # where the correct answer actually is
        y_pred.append(predicted_pos)  # where model says it is (always 0)

    accuracy = accuracy_score(y_true, y_pred) * 100 if y_true else 0
    all_positions = list(range(4))
    cm = confusion_matrix(y_true, y_pred, labels=all_positions)

    return {
        "accuracy":     round(accuracy, 2),
        "y_true":       y_true,
        "y_pred":       y_pred,
        "confusion_matrix": cm,
        "report":       classification_report(
                            y_true, y_pred,
                            labels=all_positions,
                            target_names=["Pos-0","Pos-1","Pos-2","Pos-3"],
                            zero_division=0
                        )
    }


# ─────────────────────────────────────────────
# 5. CONTENT DEPTH SCORE
# Measures richness: avg words per text block,
# presence of code/table/formula blocks
# ─────────────────────────────────────────────

def evaluate_content_depth(blog: dict) -> dict:
    text_blocks, word_counts = 0, []
    code_blocks = formula_blocks = table_blocks = list_blocks = 0

    for section in blog.get("content", []):
        for block in section.get("content", []):
            t = block.get("type")
            if t == "text":
                text_blocks += 1
                word_counts.append(len(block.get("value", "").split()))
            elif t == "code":    code_blocks    += 1
            elif t == "formula": formula_blocks += 1
            elif t == "table":   table_blocks   += 1
            elif t == "list":    list_blocks    += 1

    avg_words = round(np.mean(word_counts), 1) if word_counts else 0
    depth_score = min(100, (
        (min(text_blocks, 15)    / 15) * 30 +
        (min(avg_words,  80)     / 80) * 30 +
        (min(code_blocks, 3)     / 3)  * 15 +
        (min(table_blocks, 3)    / 3)  * 15 +
        (min(formula_blocks, 2)  / 2)  * 10
    ) * 100)

    return {
        "depth_score":    round(depth_score, 2),
        "text_blocks":    text_blocks,
        "avg_words_per_block": avg_words,
        "code_blocks":    code_blocks,
        "table_blocks":   table_blocks,
        "formula_blocks": formula_blocks,
        "list_blocks":    list_blocks,
    }


# ─────────────────────────────────────────────
# 6. PLOTS
# ─────────────────────────────────────────────

def plot_all(schema, rouge, bleu, quiz_eval, depth, output_dir="."):
    os.makedirs(output_dir, exist_ok=True)
    fig, axes = plt.subplots(2, 3, figsize=(18, 11))
    fig.suptitle("Studzee Blog Generation Pipeline — Evaluation Report", fontsize=15, fontweight="bold", y=1.01)
    palette = ["#4f46e5", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b"]

    # --- Plot 1: Schema Compliance ---
    ax = axes[0][0]
    categories = ["Schema\nCompliance", "Content\nDepth"]
    values     = [schema["score"], depth["depth_score"]]
    bars = ax.bar(categories, values, color=palette[:2], width=0.4, zorder=3)
    ax.set_ylim(0, 110)
    ax.set_title("Compliance & Depth Scores", fontweight="bold")
    ax.set_ylabel("Score (%)")
    ax.axhline(y=80, color="red", linestyle="--", alpha=0.5, label="80% threshold")
    ax.legend(fontsize=8)
    ax.grid(axis="y", alpha=0.3, zorder=0)
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f"{val}%", ha="center", fontsize=11, fontweight="bold")

    # --- Plot 2: ROUGE Scores ---
    ax = axes[0][1]
    r_keys = list(rouge.keys())
    r_vals = list(rouge.values())
    bars = ax.bar(r_keys, r_vals, color=palette[2], zorder=3)
    ax.set_ylim(0, 110)
    ax.set_title("ROUGE Scores (vs Reference)", fontweight="bold")
    ax.set_ylabel("F1 Score (%)")
    ax.grid(axis="y", alpha=0.3, zorder=0)
    for bar, val in zip(bars, r_vals):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f"{val}%", ha="center", fontsize=11, fontweight="bold")

    # --- Plot 3: BLEU Scores ---
    ax = axes[0][2]
    b_keys = list(bleu.keys())
    b_vals = list(bleu.values())
    bars = ax.bar(b_keys, b_vals, color=palette[3], zorder=3)
    ax.set_ylim(0, 110)
    ax.set_title("BLEU Scores (vs Reference)", fontweight="bold")
    ax.set_ylabel("Score (%)")
    ax.grid(axis="y", alpha=0.3, zorder=0)
    for bar, val in zip(bars, b_vals):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f"{val}%", ha="center", fontsize=11, fontweight="bold")

    # --- Plot 4: Quiz Confusion Matrix ---
    ax = axes[1][0]
    cm = quiz_eval["confusion_matrix"]
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=ax,
                xticklabels=["Pos-0","Pos-1","Pos-2","Pos-3"],
                yticklabels=["Pos-0","Pos-1","Pos-2","Pos-3"],
                linewidths=0.5, cbar=False)
    ax.set_title(f"Quiz Confusion Matrix\n(Accuracy: {quiz_eval['accuracy']}%)", fontweight="bold")
    ax.set_xlabel("Predicted Position")
    ax.set_ylabel("Actual Position")

    # --- Plot 5: Content Block Distribution ---
    ax = axes[1][1]
    block_labels = ["Text", "Code", "Table", "Formula", "List"]
    block_vals   = [depth["text_blocks"], depth["code_blocks"], depth["table_blocks"],
                    depth["formula_blocks"], depth["list_blocks"]]
    wedges, texts, autotexts = ax.pie(
        block_vals, labels=block_labels, autopct="%1.1f%%",
        colors=palette, startangle=140,
        wedgeprops=dict(edgecolor="white", linewidth=1.5)
    )
    ax.set_title("Content Block Distribution", fontweight="bold")

    # --- Plot 6: Overall Score Radar ---
    ax = axes[1][2]
    metrics = ["Schema", "ROUGE-1", "ROUGE-L", "BLEU-1", "Depth", "Quiz Acc"]
    scores  = [schema["score"], rouge["ROUGE-1"], rouge["ROUGE-L"],
               bleu["BLEU-1"], depth["depth_score"], quiz_eval["accuracy"]]
    x = np.arange(len(metrics))
    colors_bar = [palette[i % len(palette)] for i in range(len(metrics))]
    bars = ax.bar(x, scores, color=colors_bar, zorder=3)
    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=8, rotation=15)
    ax.set_ylim(0, 115)
    ax.set_title("Overall Pipeline Score Summary", fontweight="bold")
    ax.set_ylabel("Score (%)")
    ax.grid(axis="y", alpha=0.3, zorder=0)
    for bar, val in zip(bars, scores):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f"{val}%", ha="center", fontsize=8, fontweight="bold")

    plt.tight_layout()
    out_path = os.path.join(output_dir, "evaluation_report.png")
    plt.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"\nPlot saved to: {out_path}")


# ─────────────────────────────────────────────
# 7. MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":
    # ── Paths ──────────────────────────────────
    # generated_path = path to your pipeline's output JSON
    # reference_path = path to sample.json (ground truth reference)
    GENERATED_PATH = "output.txt"
    REFERENCE_PATH = "sample.json"
    OUTPUT_DIR     = "."

    print("=" * 60)
    print("  Studzee Blog Generation Pipeline — Evaluator")
    print("=" * 60)

    # Load JSONs
    print(f"\nLoading generated output: {GENERATED_PATH}")
    generated = load_blog_json(GENERATED_PATH)

    print(f"Loading reference file  : {REFERENCE_PATH}")
    reference = load_blog_json(REFERENCE_PATH)

    # Run evaluations
    print("\nRunning evaluations...\n")

    schema = evaluate_schema(generated)
    rouge  = evaluate_rouge(generated, reference)
    bleu   = evaluate_bleu(generated, reference)
    quiz   = evaluate_quiz(generated)
    depth  = evaluate_content_depth(generated)

    # ── Print Results ──────────────────────────
    print("─" * 60)
    print(f"  1. SCHEMA COMPLIANCE    : {schema['score']}%  ({schema['passed']}/{schema['total']} checks passed)")
    print("─" * 60)
    print(f"  2. ROUGE-1 (Unigram)    : {rouge['ROUGE-1']}%")
    print(f"     ROUGE-2 (Bigram)     : {rouge['ROUGE-2']}%")
    print(f"     ROUGE-L (Longest)    : {rouge['ROUGE-L']}%")
    print("─" * 60)
    print(f"  3. BLEU-1               : {bleu['BLEU-1']}%")
    print(f"     BLEU-2               : {bleu['BLEU-2']}%")
    print(f"     BLEU-4               : {bleu['BLEU-4']}%")
    print("─" * 60)
    print(f"  4. QUIZ ACCURACY        : {quiz['accuracy']}%")
    print(f"\n     Classification Report:\n{quiz['report']}")
    print("─" * 60)
    print(f"  5. CONTENT DEPTH SCORE  : {depth['depth_score']}%")
    print(f"     Text blocks          : {depth['text_blocks']}")
    print(f"     Avg words/block      : {depth['avg_words_per_block']}")
    print(f"     Code blocks          : {depth['code_blocks']}")
    print(f"     Table blocks         : {depth['table_blocks']}")
    print(f"     Formula blocks       : {depth['formula_blocks']}")
    print("─" * 60)

    overall = round(np.mean([
        schema["score"], rouge["ROUGE-1"], rouge["ROUGE-L"],
        bleu["BLEU-1"], depth["depth_score"], quiz["accuracy"]
    ]), 2)
    print(f"\n  OVERALL PIPELINE SCORE : {overall}%\n")
    print("─" * 60)

    # Plot
    print("\nGenerating evaluation plots...")
    plot_all(schema, rouge, bleu, quiz, depth, output_dir=OUTPUT_DIR)

    print("\nEvaluation complete.")
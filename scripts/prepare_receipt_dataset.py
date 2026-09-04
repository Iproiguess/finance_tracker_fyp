"""Prepare the SROIE-style receipt data for OCR experimentation.

Creates a deterministic train/validation/test split, JSONL manifests, and
ordered ground-truth text files from data/{img,box,key}.

The source CSV contains word-level boxes. It is useful for document
understanding and preprocessing, but it is not character-level Tesseract box
training data.
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from pathlib import Path
from typing import Any

from PIL import Image


DEFAULT_SEED = 42
SPLITS = ("train", "validation", "test")


def read_box_rows(box_path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with box_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        for line_number, row in enumerate(reader, start=1):
            if len(row) < 9:
                raise ValueError(f"{box_path}:{line_number}: expected 9 columns")
            left, top, right, bottom = (int(value) for value in row[:8:2])
            text = ",".join(row[8:]).strip()
            if not text:
                continue
            rows.append({
                "text": text,
                "left": left,
                "top": top,
                "right": right,
                "bottom": bottom,
            })
    return rows


def build_record(data_root: Path, receipt_id: str) -> dict[str, Any]:
    image_path = data_root / "img" / f"{receipt_id}.jpg"
    box_path = data_root / "box" / f"{receipt_id}.csv"
    key_path = data_root / "key" / f"{receipt_id}.json"
    with Image.open(image_path) as image:
        width, height = image.size
    with key_path.open("r", encoding="utf-8") as handle:
        key_fields = json.load(handle)
    boxes = read_box_rows(box_path)
    return {
        "id": receipt_id,
        "image": str(image_path.as_posix()),
        "box": str(box_path.as_posix()),
        "key": str(key_path.as_posix()),
        "width": width,
        "height": height,
        "boxes": boxes,
        "key_fields": key_fields,
    }


def write_outputs(records: list[dict[str, Any]], output_root: Path) -> None:
    for split in SPLITS:
        (output_root / split).mkdir(parents=True, exist_ok=True)

    for record in records:
        split = record["split"]
        split_root = output_root / split
        manifest_record = {key: value for key, value in record.items() if key != "boxes"}
        with (split_root / "manifest.jsonl").open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(manifest_record, ensure_ascii=True) + "\n")

        ground_truth = split_root / f"{record['id']}.gt.txt"
        ordered_text = sorted(record["boxes"], key=lambda item: (item["top"], item["left"]))
        ground_truth.write_text(
            "\n".join(item["text"] for item in ordered_text) + "\n",
            encoding="utf-8",
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, default=Path("data"))
    parser.add_argument("--output-root", type=Path, default=Path("training/receipt_dataset"))
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    args = parser.parse_args()

    image_ids = sorted(path.stem for path in (args.data_root / "img").glob("*.jpg"))
    if not image_ids:
        raise SystemExit(f"No JPG images found in {args.data_root / 'img'}")

    required = {
        folder: {path.stem for path in (args.data_root / folder).glob(f"*.{'json' if folder == 'key' else 'csv'}")}
        for folder in ("key", "box")
    }
    missing = [receipt_id for receipt_id in image_ids if any(receipt_id not in ids for ids in required.values())]
    if missing:
        raise SystemExit(f"Missing annotations for: {', '.join(missing[:10])}")

    records = [build_record(args.data_root, receipt_id) for receipt_id in image_ids]
    random.Random(args.seed).shuffle(records)
    total = len(records)
    train_end = round(total * 0.8)
    validation_end = train_end + round(total * 0.1)
    for index, record in enumerate(records):
        record["split"] = "train" if index < train_end else "validation" if index < validation_end else "test"

    if args.output_root.exists():
        for manifest in args.output_root.glob("*/manifest.jsonl"):
            manifest.unlink()
    write_outputs(records, args.output_root)

    counts = {split: sum(record["split"] == split for record in records) for split in SPLITS}
    print(f"Prepared {total} receipts in {args.output_root}")
    print("Splits: " + ", ".join(f"{split}={count}" for split, count in counts.items()))
    print("Generated JSONL manifests and ordered .gt.txt files.")


if __name__ == "__main__":
    main()

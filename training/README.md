# Receipt OCR Training Data

This folder is generated from the Malaysian SROIE-style data in `data/`.

## Generate the split

From the project root:

```powershell
python scripts/prepare_receipt_dataset.py
```

The command creates:

- `training/receipt_dataset/train`: 501 receipts
- `training/receipt_dataset/validation`: 63 receipts
- `training/receipt_dataset/test`: 62 receipts

Each split contains a `manifest.jsonl` file and one `.gt.txt` file per image.
The manifest retains the image path, dimensions, JSON key fields, and the
original word-level box annotations.

## Important limitation

The source CSV files contain word-level bounding boxes. They are suitable for
receipt field extraction and document-understanding experiments, but they are
not character-level Tesseract `.box` labels. Do not train Tesseract directly
from these files as though each row were a character box.

For the current app, the practical next step is to benchmark a receipt-aware
model or use these labels to improve preprocessing and `parseReceiptText()`.
To fine-tune Tesseract, create character-level box labels or use an annotation
tool that exports Tesseract training data, then train the model outside the
browser and deploy the resulting model files to the app.
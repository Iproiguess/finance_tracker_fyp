import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReceiptText } from './receiptParser.js';

test('extracts merchant, amount, and date from typical receipt text', () => {
  const receiptText = `
    STARBUCKS
    123 Main Street
    04/03/2026
    2 Cappuccinos
    Total 18.45
  `;

  const parsed = parseReceiptText(receiptText);

  assert.equal(parsed.type, 'expense');
  assert.equal(parsed.amount, 18.45);
  assert.match(parsed.description, /starbucks/i);
  assert.equal(parsed.date, '2026-03-04');
  assert.ok(Array.isArray(parsed.candidates));
});

test('falls back to a currency amount when no total label is present', () => {
  const receiptText = `
    Grocery Market
    02/15/2026
    Milk $4.99
    Bread $2.49
  `;

  const parsed = parseReceiptText(receiptText);

  assert.equal(parsed.type, 'expense');
  assert.equal(parsed.amount, 4.99);
  assert.match(parsed.description, /grocery market/i);
  assert.equal(parsed.date, '2026-02-15');
  assert.ok(Array.isArray(parsed.candidates));
});

test('uses a relevant header line when merchant detection is uncertain', () => {
  const receiptText = `
    7-Eleven Store #403
    4110 South Western Ave
    03/20/2026
    Snack 2.50
    Total $2.50
  `;

  const parsed = parseReceiptText(receiptText);

  assert.equal(parsed.type, 'expense');
  assert.equal(parsed.amount, 2.5);
  assert.match(parsed.description, /7-eleven store #403/i);
  assert.equal(parsed.date, '2026-03-20');
  assert.ok(Array.isArray(parsed.candidates));
});

test('extracts recipient reference narration as description', () => {
  const receiptText = `
    Public Bank
    Reference No. 524657
    Date & Time 30/06/2026 12:52:25 PM
    Transfer Method Other Public Bank Account
    Recipient Reference longlintean jul rental
    Recipient Bank Public Bank Berhad
  `;

  const parsed = parseReceiptText(receiptText);

  assert.equal(parsed.type, 'expense');
  assert.equal(parsed.amount, 0);
  assert.match(parsed.description, /longlintean jul rental/i);
  assert.equal(parsed.date, '2026-06-30');
  assert.ok(Array.isArray(parsed.candidates));
});

test('parses Maybank DuitNow transfer and picks recipient reference', () => {
  const receiptText = `
    Maybank
    DuitNow Transfer Successful
    Reference ID 630786512M 02 Jul 2026, 09:19 PM
    Beneficiary name
    WONG KIAN WAH
    Beneficiary account number
    1050 2400 1013 53
    Receiving bank
    RHB BANK
    Recipient reference
    Prayer fee to Monk
    Payment details
    Ah Suk funeral fee
    Amount
    RM 888.00
  `;

  const parsed = parseReceiptText(receiptText);

  assert.equal(parsed.type, 'expense');
  assert.equal(parsed.amount, 888);
  assert.match(parsed.description, /Prayer fee to Monk/i);
  assert.ok(Array.isArray(parsed.candidates));
});

const syntheticMerchants = [
  'Alpha Cafe',
  'Book Store',
  '7-Eleven',
  'Grocery Market',
  'Public Bank',
  'Maybank',
  'RHB Bank',
  'Thai Restaurant',
  'KFC',
  'Lazada'
];

const syntheticDates = [
  { text: '04/03/2026', expected: '2026-03-04' },
  { text: '2026-07-02', expected: '2026-07-02' },
  { text: '02 Jul 2026', expected: '2026-07-02' },
  { text: '30/06/26', expected: '2026-06-30' },
  { text: '2026/03/04', expected: '2026-03-04' },
  { text: '7-4-2026', expected: '2026-04-07' },
  { text: '11.12.2025', expected: '2025-12-11' },
  { text: '05 Jul 2024', expected: '2024-07-05' },
  { text: '8/13/2025', expected: '2025-08-13' },
  { text: '12/11/2023', expected: '2023-11-12' }
];

const syntheticAmounts = [
  5.5,
  888,
  24.72,
  123,
  14.5,
  15.6,
  99.99,
  1.25,
  250,
  65.4
];

const syntheticAmountLines = [
  (amount) => `Total $${amount.toFixed(2)}`,
  (amount) => `Amount RM ${amount.toFixed(2)}`,
  (amount) => `Grand Total £${amount.toFixed(2)}`,
  (amount) => `Balance Due ${amount.toFixed(2)}`,
  (amount) => `USD ${amount.toFixed(2)}`,
  (amount) => `$${amount.toFixed(2)}`,
  (amount) => `Paid ${amount.toFixed(2)}`,
  (amount) => `Charge ${amount.toFixed(2)}`,
  (amount) => `Total ${amount.toFixed(2)}`,
  (amount) => `Amount ${amount.toFixed(2)}`
];

for (let index = 0; index < 100; index += 1) {
  const merchant = syntheticMerchants[index % syntheticMerchants.length];
  const date = syntheticDates[Math.floor(index / syntheticMerchants.length) % syntheticDates.length];
  const amount = syntheticAmounts[index % syntheticAmounts.length];
  const amountLine = syntheticAmountLines[index % syntheticAmountLines.length](amount);
  const descriptionLine = index % 5 === 0 ? 'Special item purchased' : 'Single item';
  const includeReference = index % 7 === 0;

  test(`synthetic receipt parser case #${index + 1}`, () => {
    const receiptLines = [
      merchant,
      includeReference ? 'Reference No. 123456' : '123 Main Street',
      date.text,
      descriptionLine,
      `Tax ${ (amount * 0.07).toFixed(2) }`,
      amountLine,
      includeReference ? 'Recipient reference Purchase order' : 'Thank you for your business'
    ];

    const parsed = parseReceiptText(receiptLines.join('\n'));

    assert.equal(parsed.type, 'expense');
    assert.equal(parsed.amount, amount);
    assert.equal(parsed.date, date.expected);
    assert.ok(typeof parsed.description === 'string' && parsed.description.trim().length > 0, 'description should be non-empty');
    assert.ok(Array.isArray(parsed.candidates));
    assert.ok(parsed.candidates.length > 0, 'candidates should exist');
  });
}

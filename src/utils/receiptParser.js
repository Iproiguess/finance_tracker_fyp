const CURRENCY_REGEX = /(?:^|\s)(?:\$|£|usd|eur|gbp|rm)?\s*(\d+(?:[.,]\d{1,2}))\b/gi;
const TOTAL_REGEX = /(?:total|grand total|balance due|amount|paid|charge)\s*[:#-]?\s*(?:\$|£|usd|eur|gbp|rm)?\s*(\d+(?:[.,]\d{1,2}))/gi;
const DATE_REGEX = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})|(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/g;
const ISO_DATETIME_REGEX = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/g;
const TEXT_MONTH_REGEX = /(\d{1,2})\s*(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[,\s]+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/gi;

const STATUS_WORDS = /\b(successful|completed|transferred|transfer|pending|processing|save address|save|scam report|please contact|why hasn't|note|why)\b/i;
const LABEL_START = /^\s*(amount|date|time|txid|address|network|fee|wallet|payment|beneficiary|recipient|reference|payment details)\b/i;

const computeLineScore = (line) => {
  const letters = (line.match(/[A-Za-z]/g) || []).length;
  const digits = (line.match(/\d/g) || []).length;
  const hasPrice = /\$\s*\d|\b\d+\.\d{2}\b|rm\s*\d+/i.test(line);
  const hasStreet = /\b(street|st|road|rd|ave|avenue|boulevard|blvd|lane|ln|way|drive|dr)\b/i.test(line);
  let s = letters - digits * 2 - (hasPrice ? 20 : 0) - (hasStreet ? 5 : 0);
  if (STATUS_WORDS.test(line)) s -= 30;
  if (LABEL_START.test(line)) s -= 20;
  if (letters > 6 && digits < 3) s += 5;
  return s;
};

const parseCurrencyValue = (value) => parseFloat(value.replace(/,/g, '.'));

const extractAmount = (text) => {
  const totalMatch = [...text.matchAll(TOTAL_REGEX)].pop();
  if (totalMatch) {
    return parseCurrencyValue(totalMatch[1]);
  }

  const fallbackAmounts = [...text.matchAll(CURRENCY_REGEX)]
    .map(match => parseCurrencyValue(match[1]))
    .filter(value => Number.isFinite(value) && value > 0);

  return fallbackAmounts.length ? Math.max(...fallbackAmounts) : 0;
};

const extractDate = (text) => {
  // 1) Try ISO-like datetime first (YYYY-MM-DD[ HH:MM:SS])
  const isoMatch = [...text.matchAll(ISO_DATETIME_REGEX)].pop();
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const year = isoMatch[1];
    const month = String(Number(isoMatch[2])).padStart(2, '0');
    const day = String(Number(isoMatch[3])).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2) Try textual month formats like '02 Jul 2026' optionally with time and AM/PM
  const textMonthMatch = [...text.matchAll(TEXT_MONTH_REGEX)].pop();
  if (textMonthMatch && textMonthMatch[1] && textMonthMatch[2] && textMonthMatch[3]) {
    const day = String(Number(textMonthMatch[1])).padStart(2, '0');
    const monthStr = textMonthMatch[2].toLowerCase();
    const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12' };
    const month = monthMap[monthStr.slice(0,3)] || '01';
    const year = textMonthMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 3) Fallback to numeric patterns (DD/MM or MM/DD etc.)
  const dateMatch = [...text.matchAll(DATE_REGEX)].pop();
  if (!dateMatch) return '';

  const first = dateMatch[1] || dateMatch[4];
  const second = dateMatch[2] || dateMatch[5];
  const third = dateMatch[3] || dateMatch[6];
  if (!first || !second || !third) return '';

  const year = third.length === 2 ? `20${third}` : third;
  const firstNumber = Number(first);
  const secondNumber = Number(second);

  // Receipts commonly use DD/MM/YYYY or MM/DD/YYYY. We normalize to YYYY-MM-DD.
  let month = firstNumber;
  let day = secondNumber;

  if (secondNumber > 12) {
    month = firstNumber;
    day = secondNumber;
  } else if (firstNumber > 12) {
    month = secondNumber;
    day = firstNumber;
  } else {
    month = secondNumber;
    day = firstNumber;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const pickMerchantLine = (lines) => {
  const blacklist = /\b(?:total|amount|date|time|receipt|thank(?:s| you)?|tax|change|subtotal|visa|mastercard|cash|balance|transaction|recipient|ref(?:erence)?|account|from account|to account|merchant|phone|tel|www|http|card|debit|credit|receipt number|transaction id|transfer|method|purchase order|single item|item)\b/;
  const dateLine = /^(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})$/;
  const numericLine = /^[\d\s.,:/()-]+$/;

  const statusWords = /\b(successful|completed|transferred|transfer|pending|processing|save address|save|scam report|please contact|why hasn't|note|why)\b/i;
  const labelStart = /^\s*(amount|date|time|txid|address|network|fee|wallet|payment|beneficiary|recipient|reference|payment details)\b/i;

  const computeLineScore = (line) => {
    const letters = (line.match(/[A-Za-z]/g) || []).length;
    const digits = (line.match(/\d/g) || []).length;
    const hasPrice = /\$\s*\d|\b\d+\.\d{2}\b|rm\s*\d+/i.test(line);
    const hasStreet = /\b(street|st|road|rd|ave|avenue|boulevard|blvd|lane|ln|way|drive|dr)\b/i.test(line);
    let s = letters - digits * 2 - (hasPrice ? 20 : 0) - (hasStreet ? 5 : 0);
    if (statusWords.test(line)) s -= 30;
    if (labelStart.test(line)) s -= 20;
    if (letters > 6 && digits < 3) s += 5;
    return s;
  };

  // Prefer more specific keys (recipient reference, narration, remarks) before falling back to generic 'reference'.
  const specificRefPattern = /(?:recipient\s+reference|recipient\s+ref|narration|narrative|remarks|remark|description)[:\s-]*/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!specificRefPattern.test(line) || dateLine.test(line) || numericLine.test(line)) continue;
    let extracted = line.replace(specificRefPattern, '').trim();
    // If the label is on its own line, check the next non-empty line for the value.
    if (!extracted) {
      const next = lines[i + 1];
      if (next && next.length >= 3 && !dateLine.test(next) && !numericLine.test(next) && /[A-Za-z]/.test(next)) {
        extracted = next;
      }
    }
    if (extracted) {
      const lower = extracted.toLowerCase().trim();
      const genericReject = /^(purchase order|purchase|order|thank(?:s| you)?|receipt|payment details?|payment|transfer|recipient|single item|item)$/i;
      if (genericReject.test(lower)) {
        continue;
      }
    }
    if (extracted && extracted.length >= 3 && /[A-Za-z]/.test(extracted) && !numericLine.test(extracted)) {
      return extracted;
    }
  }

  // Fallback: handle generic 'reference' but avoid 'Reference ID' or numeric-only references.
  const genericRefPattern = /(?:reference\s+no\.?|reference)[:\s-]*/i;
    for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!genericRefPattern.test(line) || dateLine.test(line) || numericLine.test(line)) continue;
    // Skip lines that are clearly an ID/number-only reference (e.g., 'Reference ID 630786512M').
    if (/reference\s+id|reference\s+no/i.test(line)) {
      let extracted = line.replace(genericRefPattern, '').trim();
      // Look ahead if no trailing text on same line.
      if (!extracted) {
        const next = lines[i + 1];
        if (next && next.length >= 3 && !dateLine.test(next) && !numericLine.test(next) && /[A-Za-z]/.test(next)) {
          extracted = next;
        }
      }
      if (!extracted || !/[A-Za-z]/.test(extracted) || /^\s*(?:id|no)\b/i.test(extracted) || /^\d/.test(extracted)) continue;
        return { text: extracted, source: 'reference' };
    }
    let extracted = line.replace(genericRefPattern, '').trim();
    if (!extracted) {
      const next = lines[i + 1];
      if (next && next.length >= 3 && !dateLine.test(next) && !numericLine.test(next) && /[A-Za-z]/.test(next)) {
        extracted = next;
      }
    }
    if (extracted && extracted.length >= 3 && /[A-Za-z]/.test(extracted) && !numericLine.test(extracted)) {
        return { text: extracted, source: 'reference' };
    }
  }

  const candidates = lines.filter(line => {
    const lower = line.toLowerCase();
    return line.length >= 3 && !blacklist.test(lower) && !dateLine.test(lower) && !numericLine.test(lower);
  });

  if (candidates.length) {
    const firstValid = candidates.find(line => {
      const lower = line.toLowerCase();
      return !/^(purchase order|purchase|order|single item|thank(?:s| you)?|receipt|payment|transfer|recipient)/i.test(lower);
    });
    if (firstValid) {
      return { text: firstValid, source: 'candidate', score: computeLineScore(firstValid) };
    }
    const best = candidates.reduce((bestLine, current) => {
      return computeLineScore(current) > computeLineScore(bestLine) ? current : bestLine;
    }, candidates[0]);
    return { text: best, source: 'candidate', score: computeLineScore(best) };
  }

  return { text: lines[0] || 'Receipt', source: 'fallback' };
};

export function parseReceiptText(text = '') {
  const rawLines = (text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const lines = rawLines.map(line => line.replace(/\s+/g, ' ').trim());
  const normalized = lines.join(' ');

  // Prefer the receipt's explicit total label before falling back to a generic currency amount.
  const amount = extractAmount(normalized);
  const date = extractDate(normalized);
  const merchantMeta = pickMerchantLine(lines);
  const merchantLine = merchantMeta && merchantMeta.text ? merchantMeta.text : (typeof merchantMeta === 'string' ? merchantMeta : '');
  const description = (merchantLine || '').replace(/^[#-]+\s*/, '').slice(0, 80);

  // Build candidate suggestions (top textual lines scored)
  const candidateBlacklist = /\b(?:thank(?:s| you)?|thank you for your business|have a nice day|come again|please visit again|purchase order|purchase|order|single item|item|recipient|www|http|https|receipt|transaction|visa|mastercard|cash|balance due|transaction id|reference id|ref(?:erence)?|account|from account|to account|merchant|phone|tel|tax)\b/i;
  const candidateLines = lines.filter(line => line.length >= 3 && !/^[\d\s.,:/()-]+$/.test(line) && !candidateBlacklist.test(line));
  const candidates = candidateLines.map(l => ({ text: l, score: computeLineScore(l) })).sort((a,b) => b.score - a.score).slice(0,5);

  return {
    type: 'expense',
    amount,
    description,
    date,
    rawText: normalized,
    candidates
  };
}

(async () => {
  const rp = await import('../src/utils/receiptParser.js');
  const text = `Maybank
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
RM 888.00`;
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(l=>l.replace(/\s+/g,' ').trim());
  console.log('Lines and scores:');
  lines.forEach(l => {
    console.log(JSON.stringify(l), '->', rp.computeLineScore ? rp.computeLineScore(l) : 'no compute');
  });
  console.log('\nParsed:');
  console.log(rp.parseReceiptText(text));
})();

(async () => {
  const { parseReceiptText } = await import('../src/utils/receiptParser.js');
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
RM 888.00
Note: This receipt is computer generated and no signature is required.`;
  console.log(parseReceiptText(text));
})();

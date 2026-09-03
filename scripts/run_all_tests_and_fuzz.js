(async () => {
  const { execSync } = await import('node:child_process');
  console.log('Running unit tests...');
  try {
    execSync('node --test src/utils/receiptParser.test.js', { stdio: 'inherit' });
  } catch {
    console.warn('Unit tests failed; continuing with synthetic parser samples.');
  }

  console.log('\nRunning synthetic parser samples...');
  const { parseReceiptText } = await import('../src/utils/receiptParser.js');

  const samples = [
    {
      name: 'Maybank sample (screenshot)',
      text: `Maybank\nDuitNow Transfer Successful\nReference ID 630786512M 02 Jul 2026, 09:19 PM\nBeneficiary name\nWONG KIAN WAH\nBeneficiary account number\n1050 2400 1013 53\nReceiving bank\nRHB BANK\nRecipient reference\nPrayer fee to Monk\nPayment details\nAh Suk funeral fee\nAmount\nRM 888.00`
    },
    {
      name: 'Crypto withdrawal (screenshot)',
      text: `-100.01 USDT\nCompleted\nCrypto transferred out of Binance.\nNetwork BSC\nAddress\n0x44f1004c80fd7cbb1f8ea5ad3f4e4325d5c3c6d9\nTxid\n0x7de1d5370393509402795e36ad3d717749c609d8806cd4e41677f98ea88c243\nAmount\n100.02 USDT\nNetwork fee\n0.01 USDT\nWithdrawal Wallet\nSpot Wallet\nDate\n2026-05-04 16:23:00`
    },
    {
      name: 'ISO date only',
      text: `Store A\n2026-05-14 10:05:00\nTotal $12.00`
    },
    {
      name: 'Text month',
      text: `Bank\nDate & Time 02 Jul 2026, 09:19 PM\nRecipient Reference Some payment\nAmount RM 50.00`
    },
    {
      name: 'Reference on same line numeric',
      text: `Public Bank\nReference No. 524657\nRecipient Reference service charge\nDate 30/06/2026\nTotal $5.00`
    },
    {
      name: 'Amount without total label',
      text: `Grocery Market\n02/15/2026\nMilk $4.99\nBread $2.49`
    },
    {
      name: 'No date present',
      text: `Cafe\nLatte $3.50\nTotal $3.50`
    },
    {
      name: 'Label on next line - Recipient reference',
      text: `Bank Transfer\nRecipient reference\nDonation to Church\nAmount\nRM 100.00\nDate\n04/07/2026`
    },
    {
      name: 'Short date with slashes',
      text: `Shop\n04/03/2026\nTotal 18.45`
    }
  ];

  const results = [];
  for (const s of samples) {
    const parsed = parseReceiptText(s.text);
    results.push({ name: s.name, parsed });
  }

  console.log('\nSample parsing results:');
  for (const r of results) {
    console.log('----');
    console.log(r.name);
    console.log(JSON.stringify(r.parsed, null, 2));
  }

  console.log('\nDone.');
})();

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Opening dashboard...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

    // Wait for React to load and API calls to complete
    console.log('Waiting for content to load...');
    await page.waitForTimeout(8000);

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/pritam.paul/claude/DBSpend360/DBSpend360/dashboard_initial.png',
      fullPage: true
    });
    console.log('Initial screenshot taken');

    // Wait for data to load
    console.log('Looking for table data...');
    try {
      // Wait for either loading state or actual data
      await page.waitForSelector('tbody tr, .loading, .no-data', { timeout: 10000 });
    } catch (e) {
      console.log('No specific data selectors found, continuing...');
    }

    // Take screenshot after data load
    await page.screenshot({
      path: '/Users/pritam.paul/claude/DBSpend360/DBSpend360/dashboard_with_data.png',
      fullPage: true
    });
    console.log('Data screenshot taken');

    // Look for expandable rows
    console.log('Looking for expandable rows...');
    const expandButtons = await page.$$('[data-testid="expand-button"], button[role="button"], .expand, [data-expanded], tr[data-expandable]');
    console.log(`Found ${expandButtons.length} potential expand buttons`);

    if (expandButtons.length > 0) {
      console.log('Clicking first expand button...');
      await expandButtons[0].click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: '/Users/pritam.paul/claude/DBSpend360/DBSpend360/dashboard_expanded.png',
        fullPage: true
      });
      console.log('Expanded screenshot taken');
    }

    // Look for job run rows that can be clicked
    console.log('Looking for clickable job runs...');
    const runRows = await page.$$('tr[data-run-id], .run-row, [data-testid="run-row"]');
    console.log(`Found ${runRows.length} potential run rows`);

    if (runRows.length > 0) {
      console.log('Clicking first run row...');
      await runRows[0].click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: '/Users/pritam.paul/claude/DBSpend360/DBSpend360/dashboard_modal.png',
        fullPage: true
      });
      console.log('Modal screenshot taken');
    }

    // Get page content for analysis
    const pageText = await page.textContent('body');
    console.log('=== PAGE CONTENT ANALYSIS ===');
    console.log('Page contains table headers:', pageText.includes('Job ID') && pageText.includes('Job Name'));
    console.log('Page contains data rows:', pageText.includes('pscope_load_past_scope') || pageText.includes('GenerateDescriptions'));
    console.log('Page contains run information:', pageText.includes('run') || pageText.includes('Run'));
    console.log('Page contains cost information:', pageText.includes('$') || pageText.includes('cost'));

    // Check if we can find specific table elements
    const tableHeaders = await page.$$eval('th', headers => headers.map(h => h.textContent.trim()));
    console.log('Table headers found:', tableHeaders);

    const tableRows = await page.$$eval('tbody tr', rows => rows.length);
    console.log('Table body rows found:', tableRows);

    console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
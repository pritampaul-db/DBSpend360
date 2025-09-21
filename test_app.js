const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Give React time to render

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'app_screenshot.png', fullPage: true });

  // Check for JavaScript errors in console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  // Check if the job table is visible
  const tableVisible = await page.isVisible('[data-testid="job-table"], .job-spending-table, table');
  console.log('Job table visible:', tableVisible);

  // Check for job rows
  const jobRows = await page.locator('tbody tr').count();
  console.log('Number of table rows:', jobRows);

  // Check for expand buttons/chevrons
  const expandButtons = await page.locator('[data-testid="expand-button"], .chevron, [role="button"]').count();
  console.log('Number of expand buttons:', expandButtons);

  // Wait a bit longer to see the app
  await page.waitForTimeout(10000);

  console.log('Closing browser...');
  await browser.close();
})();
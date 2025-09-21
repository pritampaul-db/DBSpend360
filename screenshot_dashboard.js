const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the dashboard
    await page.goto('http://localhost:5173');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait for the dashboard content to appear
    await page.waitForSelector('[data-testid="dashboard"], .dashboard, h1', { timeout: 10000 });

    // Take screenshot
    await page.screenshot({
      path: '/Users/pritam.paul/claude/DBSpend360/DBSpend360/dashboard_screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved as dashboard_screenshot.png');

    // Keep the browser open for manual inspection
    console.log('Browser will stay open for manual inspection. Press Ctrl+C to close.');
    await page.waitForTimeout(30000); // Wait 30 seconds

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
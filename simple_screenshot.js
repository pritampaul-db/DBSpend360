const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('Waiting for content to load...');
    // Wait for any of these elements to appear
    try {
      await page.waitForSelector('body', { timeout: 10000 });
      await page.waitForTimeout(3000); // Give React time to render
    } catch (e) {
      console.log('Selector wait failed, continuing anyway...');
    }

    console.log('Taking screenshot...');
    await page.screenshot({
      path: '/Users/pritam.paul/claude/DBSpend360/DBSpend360/dashboard_screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved successfully!');

    // Get page title and content for debugging
    const title = await page.title();
    const bodyText = await page.textContent('body');
    console.log('Page title:', title);
    console.log('Page contains:', bodyText ? bodyText.substring(0, 200) + '...' : 'No text content');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log('Setting up page...');

    // Set a longer timeout for all operations
    page.setDefaultTimeout(60000);

    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('Page loaded, waiting for React to render...');

    // Wait for React to mount and render content
    await page.waitForTimeout(5000);

    // Try to wait for dashboard content
    try {
      await page.waitForSelector('div', { timeout: 10000 });
      console.log('Found div elements');
    } catch (e) {
      console.log('No specific selectors found, continuing with screenshot...');
    }

    console.log('Taking screenshot...');
    await page.screenshot({
      path: '/Users/pritam.paul/claude/DBSpend360/DBSpend360/dashboard_screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved successfully!');

    // Debug information
    const title = await page.title();
    console.log('Page title:', title);

    // Get the entire page content
    const content = await page.content();
    console.log('Page HTML length:', content.length);

    // Get visible text
    try {
      const bodyText = await page.textContent('body');
      if (bodyText) {
        console.log('Page text preview:', bodyText.substring(0, 500) + '...');
      } else {
        console.log('No text content found');
      }
    } catch (e) {
      console.log('Could not get text content');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
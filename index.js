const { chromium } = require('playwright');
require('dotenv').config();


async function captureAnnouncements(page) {
  const selector = 'tbody > tr[role="row"]';
  
  try {
    await page.waitForSelector(selector, { state: 'attached' });
    console.log('Found announcement elements');
    
    const count = await page.locator(selector).count();
    console.log(`Found ${count} announcement elements`);
    
    const links = await page.$$eval(selector, (rows) => {
      return rows.map(row => {
        const linkElement = row.querySelector('.table_td_header a');
        return linkElement ? linkElement.href : null;
      }).filter(link => link !== null);
    });
    
    console.log('Announcement links:');
    links.forEach(link => console.log(link));
    
    return links;
  } catch (error) {
    console.error('Error capturing announcement links:', error);
    return [];
  }
}


(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the OpenEClass login page
    await page.goto('https://eclass.uniwa.gr');

    // Fill in the login form
    await page.fill('input#uname', process.env.ECLASS_USERNAME);
    await page.fill('input#pass', process.env.ECLASS_PASSWORD);

    // Submit the form
    await page.click('button[name="submit"]');

    // Extract Page URL
    const url = page.url();
    console.log('Page URL:', url);

    await page.goto('https://eclass.uniwa.gr/modules/announcements/myannouncements.php');


    const announcementLinks = await captureAnnouncements(page);
    console.log(`Captured ${announcementLinks.length} announcement links`);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
})();
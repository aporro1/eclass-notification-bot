import { chromium } from 'playwright';
import 'dotenv/config';


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


async function extractAnnouncementInfo(announcementLinks, page) {
  const announcementInfo = [];


  for (const link of announcementLinks) {
    try {

      await page.goto(link);

      const announcementTitle = await page.$$eval('.announcement-title', (elements) => {
        return elements.map(element => element.textContent.trim()).filter(Boolean);
      });

      const paragraphCount = await page.locator(".announcement-main > p").count();

      console.log(`Found ${paragraphCount} paragraphs for announcement: ${announcementTitle}`);

      // Optionally, you can extract the content of these paragraphs:
      const announcementContent = await page.$$eval('.announcement-main > p', (elements) => {
        return elements.map(element => element.textContent.trim());
      });

      announcementInfo.push({
        announcementLink: link,
        anouncementTitle: announcementTitle,
        paragraphCount: paragraphCount,
        announcementContent: announcementContent
      });

    } catch (error) {
      console.error('Error extracting announcement info:', error);
    }
  }

  return announcementInfo;
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


    const announcementInfo = await extractAnnouncementInfo(announcementLinks, page);
    console.log('Announcement info:');
    console.log(announcementInfo);


  } catch (error) {

    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
})();
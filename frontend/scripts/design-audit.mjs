import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('d:/spoorf-web-cloud/frontend/review-output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runDesignAudit() {
  console.log('🚀 Launching Chromium / Chrome browser for Design & Visual Audit...');
  
  // Use installed Chrome or Edge channel if available, else default chromium
  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true
    });
  } catch (e) {
    try {
      browser = await chromium.launch({
        channel: 'msedge',
        headless: true
      });
    } catch (e2) {
      browser = await chromium.launch({ headless: true });
    }
  }

  const results = {
    titleCheck: false,
    backgroundColor: '',
    fontFamilies: {},
    consoleErrors: [],
    overflowCheck: {},
    interactions: {},
    screenshots: []
  };

  const context = await browser.newContext({
    deviceScaleFactor: 2, // Retina quality
  });

  const page = await context.newPage();

  // Listen to console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push(msg.text());
      console.log(`[Browser Console Error]: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    results.consoleErrors.push(err.message);
    console.log(`[Browser Page Error]: ${err.message}`);
  });

  console.log('🌐 Navigating to http://localhost:4173/ ...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // 1. Title Check
  const title = await page.title();
  results.titleCheck = title.includes('Spoorf NetCut Sentinel');
  console.log(`✓ Page Title: "${title}" (Valid: ${results.titleCheck})`);

  // 2. CSS & Design Tokens Inspection
  const bodyStyles = await page.evaluate(() => {
    const body = document.body;
    const computed = window.getComputedStyle(body);
    const mainEl = document.querySelector('div.min-h-screen');
    const mainComputed = mainEl ? window.getComputedStyle(mainEl) : null;
    return {
      bodyBg: computed.backgroundColor,
      mainBg: mainComputed ? mainComputed.backgroundColor : '',
      fontFamily: computed.fontFamily
    };
  });
  results.backgroundColor = bodyStyles.mainBg || bodyStyles.bodyBg;
  console.log(`✓ Background Color: ${results.backgroundColor}`);

  // 3. Inspect Typography Trinity
  const fonts = await page.evaluate(() => {
    const sansEl = document.querySelector('h2');
    const serifEl = document.querySelector('h2 span.font-serif');
    const monoEl = document.querySelector('div.font-mono');
    return {
      sans: sansEl ? window.getComputedStyle(sansEl).fontFamily : 'not found',
      serif: serifEl ? window.getComputedStyle(serifEl).fontFamily : 'not found',
      mono: monoEl ? window.getComputedStyle(monoEl).fontFamily : 'not found'
    };
  });
  results.fontFamilies = fonts;
  console.log('✓ Typography Trinity Fonts:');
  console.log(`   - Sans: ${fonts.sans}`);
  console.log(`   - Serif: ${fonts.serif}`);
  console.log(`   - Mono: ${fonts.mono}`);

  // 4. Desktop Viewport (1440x900) Full Page Snapshot
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500); // Allow animations to settle

  const desktopScreenshot = path.join(OUTPUT_DIR, '01_desktop_fullpage.png');
  await page.screenshot({ path: desktopScreenshot, fullPage: true });
  results.screenshots.push(desktopScreenshot);
  console.log(`📸 Saved Desktop Fullpage: ${desktopScreenshot}`);

  // Screenshot of Hero Topology section
  const heroEl = await page.$('#hero');
  if (heroEl) {
    const heroScreenshot = path.join(OUTPUT_DIR, '02_desktop_hero.png');
    await heroEl.screenshot({ path: heroScreenshot });
    results.screenshots.push(heroScreenshot);
    console.log(`📸 Saved Hero Section: ${heroScreenshot}`);
  }

  // 5. Test Interactive Feature Tabs
  console.log('🧪 Testing Interactive Feature Tabs Showcase...');
  const tabsContainer = await page.$('#showcase');
  if (tabsContainer) {
    // Screenshot Tab 0
    const tab0Screenshot = path.join(OUTPUT_DIR, '03_tabs_discovery.png');
    await tabsContainer.screenshot({ path: tab0Screenshot });
    results.screenshots.push(tab0Screenshot);

    // Click Tab 1 (PWM Bandwidth Limiter)
    console.log('   - Clicking Tab 1: Precision PWM Limiter...');
    const pwmTabBtn = await page.$('button:has-text("Precision PWM Limiter")');
    if (pwmTabBtn) {
      await pwmTabBtn.click();
      await page.waitForTimeout(600);
      
      // Test slider interaction
      const slider = await page.$('input[type="range"]');
      if (slider) {
        await slider.fill('65');
        await page.waitForTimeout(300);
        console.log('   ✓ PWM Slider filled to 65%');
      }

      const tab1Screenshot = path.join(OUTPUT_DIR, '04_tabs_pwm_slider.png');
      await tabsContainer.screenshot({ path: tab1Screenshot });
      results.screenshots.push(tab1Screenshot);
    }

    // Click Tab 3 (Cloud Fleet Hub & Remote Kick)
    console.log('   - Clicking Tab 3: Cloud Fleet & Remote Kick...');
    const cloudTabBtn = await page.$('button:has-text("Cloud Fleet & Remote Kick")');
    if (cloudTabBtn) {
      await cloudTabBtn.click();
      await page.waitForTimeout(600);

      // Trigger "Putuskan Akses (Kick)" button
      const kickBtn = await page.$('button:has-text("Putuskan Akses (Kick)")');
      if (kickBtn) {
        console.log('   - Triggering Kick button to verify live simulation modal...');
        await kickBtn.click();
        await page.waitForTimeout(400);

        // Check if modal dialog appeared
        const modalText = await page.textContent('body');
        const modalVisible = modalText.includes('Sesi Telah Berakhir');
        results.interactions.kickModalTriggered = modalVisible;
        console.log(`   ✓ Kick Alert Modal rendered: ${modalVisible}`);

        const modalScreenshot = path.join(OUTPUT_DIR, '05_kick_modal_dialog.png');
        await page.screenshot({ path: modalScreenshot });
        results.screenshots.push(modalScreenshot);

        // Close modal
        const closeBtn = await page.$('button:has-text("Tutup Notifikasi")');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(300);
        }
      }
    }
  }

  // Screenshot Bento Grid
  const bentoEl = await page.$('#features');
  if (bentoEl) {
    const bentoScreenshot = path.join(OUTPUT_DIR, '06_bento_grid.png');
    await bentoEl.screenshot({ path: bentoScreenshot });
    results.screenshots.push(bentoScreenshot);
    console.log(`📸 Saved Bento Grid: ${bentoScreenshot}`);
  }

  // Screenshot Pricing Tiers
  const pricingEl = await page.$('#pricing');
  if (pricingEl) {
    const pricingScreenshot = path.join(OUTPUT_DIR, '07_pricing_tiers.png');
    await pricingEl.screenshot({ path: pricingScreenshot });
    results.screenshots.push(pricingScreenshot);
    console.log(`📸 Saved Pricing Tiers: ${pricingScreenshot}`);
  }

  // 6. Tablet Viewport (768 x 1024)
  console.log('📱 Testing Tablet Viewport (768x1024)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(400);

  const tabletOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  results.overflowCheck.tablet = tabletOverflow;
  console.log(`   - Tablet horizontal overflow: ${tabletOverflow ? 'FAIL' : 'PASS (No overflow)'}`);

  const tabletScreenshot = path.join(OUTPUT_DIR, '08_tablet_viewport.png');
  await page.screenshot({ path: tabletScreenshot });
  results.screenshots.push(tabletScreenshot);

  // 7. Mobile Viewport (375 x 812 - iPhone 13 / Modern Mobile)
  console.log('📱 Testing Mobile Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);

  const mobileOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  results.overflowCheck.mobile = mobileOverflow;
  console.log(`   - Mobile horizontal overflow: ${mobileOverflow ? 'FAIL' : 'PASS (No overflow)'}`);

  // Test Mobile Navigation Drawer
  console.log('   - Testing Mobile Hamburger Menu drawer...');
  const menuBtn = await page.$('button[aria-label="Toggle Navigation Menu"]');
  if (menuBtn) {
    await menuBtn.click();
    await page.waitForTimeout(400);
    
    const drawerScreenshot = path.join(OUTPUT_DIR, '09_mobile_drawer_open.png');
    await page.screenshot({ path: drawerScreenshot });
    results.screenshots.push(drawerScreenshot);
    console.log(`📸 Saved Mobile Drawer: ${drawerScreenshot}`);

    // Close menu
    await menuBtn.click();
    await page.waitForTimeout(300);
  }

  const mobileFullScreenshot = path.join(OUTPUT_DIR, '10_mobile_fullpage.png');
  await page.screenshot({ path: mobileFullScreenshot, fullPage: true });
  results.screenshots.push(mobileFullScreenshot);
  console.log(`📸 Saved Mobile Fullpage: ${mobileFullScreenshot}`);

  // Summary output
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'audit-results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n======================================================');
  console.log('🎉 PLAYWRIGHT DESIGN AUDIT FINISHED SUCCESSFULLY!');
  console.log(`Total Screenshots Captured: ${results.screenshots.length}`);
  console.log(`Console Errors: ${results.consoleErrors.length}`);
  console.log(`Mobile / Tablet Overflow: ${!results.overflowCheck.mobile && !results.overflowCheck.tablet ? 'CLEAN (0 overflow)' : 'HAS OVERFLOW'}`);
  console.log('======================================================');

  await browser.close();
}

runDesignAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});

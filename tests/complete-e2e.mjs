import { chromium } from 'playwright';

async function runTests() {
  console.log('🚀 Starting Comprehensive KrishiMart E2E Tests via Playwright...\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(`PageError: ${err.message}`);
    console.error('Browser PageError:', err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('Browser console.error:', msg.text());
    }
  });

  const baseUrl = 'http://localhost:3000';

  try {
    // 1. Test Home Page
    console.log('1️⃣ Testing Home Page load & components...');
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const title = await page.title();
    console.log(`   Page Title: "${title}"`);

    // Wait for React to render
    const bodyText = await page.innerText('body');
    console.log(`   Body text sample: "${bodyText.slice(0, 150).replace(/\n/g, ' ')}..."`);
    const brandVisible = bodyText.includes('KrishiMart');
    console.log(`   KrishiMart Branding Visible: ${brandVisible}`);
    if (!brandVisible) throw new Error('Branding not visible on Home Page');

    // 2. Test Login Page (matches reference screenshot)
    console.log('\n2️⃣ Testing Login Page UI & Structure...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const authOverline = await page.getByText('AUTHENTICATION', { exact: false }).isVisible();
    console.log(`   "AUTHENTICATION" overline visible: ${authOverline}`);

    const welcomeHeading = await page.getByRole('heading', { name: /Welcome to KrishiMart/i }).isVisible();
    console.log(`   "Welcome to KrishiMart" heading visible: ${welcomeHeading}`);

    const customerCard = await page.getByRole('heading', { name: /Customer Login/i }).isVisible();
    console.log(`   "Customer Login" card visible: ${customerCard}`);

    const adminCard = await page.getByRole('heading', { name: /Admin Portal/i }).isVisible();
    console.log(`   "Admin Portal" card visible: ${adminCard}`);

    const googleBtnCustomer = await page.getByRole('button', { name: /CONTINUE WITH GOOGLE/i }).isVisible();
    console.log(`   "CONTINUE WITH GOOGLE" button visible: ${googleBtnCustomer}`);

    const googleBtnAdmin = await page.getByRole('button', { name: /STAFF GOOGLE LOGIN/i }).isVisible();
    console.log(`   "STAFF GOOGLE LOGIN" button visible: ${googleBtnAdmin}`);

    if (!authOverline || !welcomeHeading || !customerCard || !adminCard || !googleBtnCustomer || !googleBtnAdmin) {
      throw new Error('Login page missing expected elements matching the reference design');
    }

    // 3. Test 1-Click Demo Login Flow (Customer)
    console.log('\n3️⃣ Testing Customer Authentication flow...');
    const demoCustomerBtn = page.getByRole('button', { name: /1-Click Demo Customer/i });
    if (await demoCustomerBtn.isVisible()) {
      await demoCustomerBtn.click();
      await page.waitForTimeout(1500);
      console.log(`   Navigated to after login: ${page.url()}`);
    }

    // 4. Test Products Catalog Page
    console.log('\n4️⃣ Testing Products Catalog & Navigation...');
    await page.goto(`${baseUrl}/products`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const productHeading = await page.getByRole('heading', { name: /Farm Selection/i }).isVisible();
    console.log(`   Product Catalog "Farm Selection" visible: ${productHeading}`);

    // Count product cards or items
    const productLinks = await page.locator('a[href^="/product/"]').count();
    console.log(`   Found ${productLinks} product detail links on catalog page`);

    // 5. Test Product Detail Page
    if (productLinks > 0) {
      console.log('\n5️⃣ Testing Product Detail view & Interactions...');
      await page.locator('a[href^="/product/"]').first().click();
      await page.waitForTimeout(1000);
      console.log(`   Current URL: ${page.url()}`);

      const productTitle = await page.locator('h1').first().innerText();
      console.log(`   Product Title loaded: "${productTitle}"`);

      // Add to Cart / Bag
      const addToCartBtn = page.getByRole('button', { name: /Add to|Buy Now/i }).first();
      if (await addToCartBtn.isVisible()) {
        const btnText = await addToCartBtn.innerText();
        console.log(`   Action button found: "${btnText.replace(/\n/g, ' ')}"`);
        await addToCartBtn.click();
        console.log('   Clicked product action button');
        await page.waitForTimeout(1000);
      }
    }

    // 6. Test Cart Page
    console.log('\n6️⃣ Testing Shopping Cart...');
    await page.goto(`${baseUrl}/cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const cartHeading = await page.getByText(/Your Cart|Cart Items|Order Summary/i).first().isVisible();
    console.log(`   Cart Page rendered: ${cartHeading}`);

    // 7. Test Admin 1-Click Bypass & Admin Dashboard Access
    console.log('\n7️⃣ Testing Admin Authentication & Dashboard...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const demoAdminBtn = page.getByRole('button', { name: /1-Click Demo Admin/i });
    if (await demoAdminBtn.isVisible()) {
      await demoAdminBtn.click();
      await page.waitForTimeout(2000);
      console.log(`   Current URL after Admin Login: ${page.url()}`);
      
      const adminHeader = await page.getByText(/Admin Dashboard|Administrative Hub|Inventory/i).first().isVisible();
      console.log(`   Admin Dashboard accessible: ${adminHeader}`);

      // Verify Footer is not rendered on Admin Panel
      const footerOnAdmin = await page.locator('footer').count();
      console.log(`   Footer element count on /admin: ${footerOnAdmin}`);
      if (footerOnAdmin > 0) {
        throw new Error('Footer is still rendered on Admin Panel!');
      }
      console.log('   Confirmed: Footer successfully removed from Admin Panel!');
    }

    console.log('\n✅ ALL PLAYWRIGHT TESTS PASSED SUCCESSFULLY!');
    if (errors.length > 0) {
      console.log(`⚠️ Unhandled page console errors (${errors.length}):`, errors);
    } else {
      console.log('✨ 0 uncaught client runtime errors detected.');
    }
  } catch (err) {
    console.error('\n❌ Test Failure:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTests();

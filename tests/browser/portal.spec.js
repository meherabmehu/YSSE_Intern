import { test, expect } from '@playwright/test';
import { createApp } from '../../server/index.js';

let server;
test.beforeAll(async () => {
  server = createApp({ dbPath: ':memory:', demoMode: true });
  await new Promise((resolve) => server.listen(3100, '127.0.0.1', resolve));
});
test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

async function navigate(page, route) {
  const hash = `#/${route}`;
  if (page.url().endsWith(hash)) await page.reload({ waitUntil: 'domcontentloaded' });
  else await page.goto(`/${hash}`, { waitUntil: 'domcontentloaded' });
}
async function login(page, role) {
  await navigate(page, 'login');
  await page.getByLabel('Email address').fill(`${role}@demo.ysse.test`);
  await page.getByLabel('Password', { exact: true }).fill('YsseDemo2026!');
  await page.getByRole('button', { name: 'Sign in →', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: role === 'staff' ? 'Good teams start here.' : 'Hello, Demo.',
    }),
  ).toBeVisible();
}
test('public pages, search, filters, lessons, download, responsive navigation and unknown route', async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await navigate(page, '');
  await expect(page.getByRole('heading', { name: 'A generation of changemakers.' })).toBeVisible();
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page.getByRole('heading', { name: 'A generation of changemakers.' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home-desktop.png'), fullPage: true });
  await navigate(page, 'departments');
  await expect(page.locator('.department-card')).toHaveCount(9);
  await page.getByRole('searchbox', { name: 'Search departments' }).fill('technology');
  // Search supports department names and the documented responsibility skills.
  await page.getByRole('searchbox', { name: 'Search departments' }).fill('web');
  await expect(page.locator('.department-card')).toHaveCount(1);
  await page.locator('.department-card').click();
  await expect(page.getByRole('heading', { name: 'IT', exact: true })).toBeVisible();
  await expect(page.getByText('Team members / interns')).toBeVisible();
  await navigate(page, 'courses');
  await page
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption('Entrepreneurship');
  await expect(page.locator('.course-card')).toHaveCount(1);
  await page.locator('.course-card').click();
  await page.getByRole('button', { name: '02 Understand the problem' }).click();
  await expect(
    page.getByRole('heading', { name: 'Understand the problem', exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download worksheet' }).click();
  expect((await download).suggestedFilename()).toBe('social-entrepreneurship-worksheet.txt');
  for (const route of ['about', 'updates', 'contact', 'internship', 'login', 'register']) {
    await navigate(page, route);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.getByText('We couldn’t load this page.')).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['', 'departments', 'courses', 'internship', 'login']) {
    await navigate(page, route);
    await expect(page.locator('main h1')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `No horizontal overflow on mobile route ${route}`).toBe(false);
  }
  await navigate(page, '');
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.getByRole('button', { name: 'Toggle navigation' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Departments', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Find where you belong.' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('departments-mobile.png'), fullPage: true });
  await navigate(page, 'does-not-exist');
  await expect(page.getByRole('heading', { name: 'This page is not here.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('browser recruitment journey, staff evaluation, applicant acceptance and announcement publishing', async ({
  browser,
}, testInfo) => {
  const applicantContext = await browser.newContext();
  const staffContext = await browser.newContext();
  const candidate = await applicantContext.newPage();
  const staff = await staffContext.newPage();
  const errors = [];
  candidate.on('pageerror', (e) => errors.push(e.message));
  staff.on('pageerror', (e) => errors.push(e.message));
  try {
    await login(candidate, 'applicant');
    await navigate(candidate, 'apply');
    await candidate.getByLabel('Full name', { exact: true }).fill('Browser Demo Candidate');
    await candidate.getByLabel('Phone', { exact: true }).fill('+8801700000000');
    await candidate.getByLabel('Institution', { exact: true }).fill('Demo University');
    await candidate.getByLabel('Education / year').fill('Undergraduate year 2');
    await candidate.getByLabel('Preferred department').selectOption('it');
    await candidate
      .getByLabel('Relevant skills')
      .fill('JavaScript, collaboration and accessible web development');
    await candidate
      .getByLabel('Why do you want to join?')
      .fill(
        'I would like to contribute to community projects and develop useful skills with a purposeful team.',
      );
    await candidate.getByLabel('Portfolio link').fill('https://example.com/demo');
    await candidate.getByLabel('I meet the eligibility').check();
    await candidate.getByLabel('I can commit').check();
    await candidate.getByLabel('I agree to store').check();
    await candidate.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(candidate.locator('#toast')).toHaveText('Draft saved to the database.');
    await candidate.reload({ waitUntil: 'domcontentloaded' });
    await expect(candidate.getByLabel('Institution', { exact: true })).toHaveValue(
      'Demo University',
    );
    await candidate.getByRole('button', { name: 'Review application' }).click();
    await candidate.getByRole('button', { name: 'Confirm & submit application' }).click();
    await expect(candidate.locator('.dashboard-top .badge')).toHaveText('Submitted');
    await login(staff, 'staff');
    await staff.getByRole('link', { name: 'Review →', exact: true }).click();
    await staff.getByLabel('Score (0–100)').fill('85');
    await staff.getByLabel('Review notes').fill('PRIVATE: strong sample application');
    await staff.getByRole('button', { name: 'Save evaluation' }).click();
    await expect(staff.locator('#toast')).toHaveText('Private evaluation saved.');
    async function transition(status) {
      await staff.getByLabel('Recruitment stage').selectOption(status);
      await staff.getByRole('button', { name: 'Confirm stage change' }).click();
      await expect(staff.locator('.dashboard-top .badge')).toHaveText(
        {
          shortlisted: 'Shortlisted',
          interview_scheduled: 'Interview scheduled',
          interviewed: 'Interview complete',
          selected: 'Selected',
          onboarded: 'Onboarded',
        }[status],
      );
    }
    await transition('shortlisted');
    await staff.getByLabel('Interviewer', { exact: true }).fill('Demo Mentor');
    const nextDay = new Date(Date.now() + 86400000);
    const local = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}T12:00`;
    await staff.getByLabel('Interview time').fill(local);
    await staff.getByLabel('Meeting link').fill('https://meet.google.com/demo');
    await transition('interview_scheduled');
    await transition('interviewed');
    await transition('selected');
    await expect(staff.getByText('Waiting for offer acceptance', { exact: true })).toBeVisible();
    await candidate.getByRole('button', { name: 'Refresh', exact: false }).click();
    await expect(candidate.locator('.dashboard-top .badge')).toHaveText('Selected');
    await expect(candidate.getByText('PRIVATE: strong sample application')).toHaveCount(0);
    candidate.once('dialog', (dialog) => dialog.accept());
    await candidate.getByRole('button', { name: 'Accept demo offer' }).click();
    await expect(candidate.locator('.dashboard-top .badge')).toHaveText('Offer accepted');
    await staff.reload({ waitUntil: 'domcontentloaded' });
    await transition('onboarded');
    await navigate(candidate, 'dashboard');
    await expect(candidate.getByRole('heading', { name: 'Welcome to the team.' })).toBeVisible();
    await candidate.screenshot({
      path: testInfo.outputPath('applicant-dashboard.png'),
      fullPage: true,
    });
    await candidate.setViewportSize({ width: 390, height: 844 });
    expect(await candidate.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await staff.setViewportSize({ width: 390, height: 844 });
    expect(await staff.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await staff.setViewportSize({ width: 1440, height: 1000 });
    await navigate(staff, 'staff');
    await staff.getByRole('combobox', { name: 'Status', exact: true }).selectOption('onboarded');
    await expect(staff.locator('tbody tr')).toHaveCount(1);
    const csv = staff.waitForEvent('download');
    await staff.getByRole('button', { name: 'Export filtered CSV' }).click();
    expect((await csv).suggestedFilename()).toBe('ysse-demo-applications.csv');
    await navigate(staff, 'settings');
    await staff.getByLabel('Accept demo applications').uncheck();
    await staff.getByRole('button', { name: 'Save batch settings' }).click();
    await expect(staff.locator('#toast')).toHaveText('Batch settings saved.');
    await navigate(candidate, 'internship');
    await expect(candidate.getByText('Applications closed', { exact: true })).toBeVisible();
    await navigate(staff, 'content');
    await staff.getByLabel('Title', { exact: true }).fill('Browser demo announcement');
    await staff
      .getByLabel('Summary', { exact: true })
      .fill('This is a sample announcement published through the staff dashboard.');
    await staff.getByLabel('Link', { exact: true }).fill('#/courses');
    await staff.getByRole('button', { name: 'Add demo announcement' }).click();
    await expect(staff.locator('#toast')).toHaveText('Demo announcement added.');
    await navigate(candidate, 'updates');
    await expect(candidate.getByRole('link', { name: 'Browser demo announcement' })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await applicantContext.close();
    await staffContext.close();
  }
});

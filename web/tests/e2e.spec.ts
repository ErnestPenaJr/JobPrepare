import { test, expect } from '@playwright/test';
import { mkdir } from 'fs/promises';

test('analyze shows final score and captures screenshots', async ({ page }) => {
  await page.goto('/');

  // Fill JD and Resume
  await page.getByPlaceholder('Paste JD text here...').fill([
    'Role: Backend Engineer',
    'Must have: Python, SQL, Django',
    'Nice to have: Azure',
  ].join('\n'));

  await page.getByPlaceholder('Paste resume text here...').fill([
    'Experience: 5 years',
    'Skills: Python, Django, SQL',
    'Built REST APIs with Django',
  ].join('\n'));

  // Run analysis
  await page.getByRole('button', { name: /Analyze/ }).click();

  // Wait for Final Score to render (value 1-10), then screenshot
  const numericScore = page.locator('.tabular-nums').filter({ hasText: /\d+\.\d/ }).first();
  await expect(numericScore).toBeVisible({ timeout: 60_000 });

  // Ensure artifact directory exists
  await mkdir('tests-artifacts', { recursive: true });

  // Save a screenshot of the score card area (closest card container)
  const scoreCard = numericScore.locator('xpath=ancestor::*[@class[contains(.,"CardContent")]] | xpath=ancestor::div[contains(@class, "Card")]').first();
  await scoreCard.screenshot({ path: 'tests-artifacts/score-card.png' });

  // Also capture the Iteration Scores list
  await page.getByText('Iteration Scores').first().scrollIntoViewIfNeeded();
  const iterationsSection = page.locator('text=Iteration Scores').locator('xpath=..');
  await iterationsSection.screenshot({ path: 'tests-artifacts/iterations.png' });
});

// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InfoTip from './InfoTip';

afterEach(cleanup);

it('opens on tap, stays open, closes with Escape, and always describes the button', async () => {
  const user = userEvent.setup();
  render(<InfoTip>Gusts are short bursts.</InfoTip>);
  const button = screen.getByRole('button', { name: 'More info' });

  expect(button).toHaveAccessibleDescription('Gusts are short bursts.');
  expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible();

  await user.click(button); // focus + click must not cancel each other out
  expect(screen.getByRole('tooltip')).toBeVisible();

  await user.keyboard('{Escape}');
  expect(screen.getByRole('tooltip', { hidden: true })).not.toBeVisible();
});

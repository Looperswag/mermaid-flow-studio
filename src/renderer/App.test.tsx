import { render, screen } from '@testing-library/react';

import App from './App';

test('shows the app shell title and input composer', () => {
  render(<App />);

  expect(screen.getByText('Mermaid Flow Studio')).toBeInTheDocument();
  expect(screen.getByRole('region', { name: /chat timeline/i })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: /diagram preview/i })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /mermaid input/i })).toBeInTheDocument();
});

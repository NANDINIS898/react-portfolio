import { render, screen } from '@testing-library/react';
import App from './App';

// jsdom has no ResizeObserver, which the capstone roadmap measures with.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
});

test('renders the landing name and every section anchor', () => {
  const { container } = render(<App />);

  expect(screen.getByRole('heading', { level: 1, name: /nandini gangwar/i })).toBeInTheDocument();

  ['home', 'about', 'projects', 'tech-stack', 'achievements', 'certifications', 'contact'].forEach((id) => {
    expect(container.querySelector(`#${id}`)).not.toBeNull();
  });
});

test('keeps the About copy in the notebook', () => {
  render(<App />);
  expect(screen.getAllByText(/final year B\.Tech student/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/multi-agent LLM pipelines to credit-risk intelligence/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/preparing for SDE and AI\/ML roles/i).length).toBeGreaterThan(0);
});

test('the lab has a machine for every project and opens one on click', () => {
  render(<App />);
  const machines = screen.getAllByRole('button', { name: /^Open / });
  expect(machines).toHaveLength(8);

  machines[2].click();
  return screen.findByRole('dialog').then((dialog) => {
    expect(dialog).toHaveTextContent('Screen');
    expect(dialog).toHaveTextContent('03 / 08');
    expect(screen.getByRole('link', { name: /live demo/i })).toHaveAttribute(
      'href',
      'https://visl-ai-lab-assignment-screening-pl.vercel.app/'
    );
  });
});

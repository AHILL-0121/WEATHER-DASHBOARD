import '@testing-library/jest-dom/vitest';

// jsdom has no layout, so it doesn't implement scrolling
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView ??= () => {};


document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('signup-status');
  if (status) {
    status.textContent = 'Newsletter registration is temporarily unavailable.';
  }

  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (status) status.textContent =
        'Newsletter registration is not available on this preview.';
    });
  }
});

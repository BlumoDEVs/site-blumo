(() => {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-blumo-reveal]').forEach((el) => revealObserver.observe(el));

  document.querySelectorAll('[data-blumo-scroll-to-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      const cartAnchor = document.querySelector('.single_add_to_cart_button');
      cartAnchor?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();

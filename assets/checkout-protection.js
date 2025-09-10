(() => {
  'use strict';

  function protectCheckoutElements() {
    const checkoutSelectors = [
      'form[action*="/cart/add"]',
      'form[action*="/cart"]',
      'form[action*="checkout"]',
      '.cart-form',
      '.product-form',
      '.checkout-form',
      '.add-to-cart-form',
      'button[name="add"]',
      'input[name="add"]',
      '.add-to-cart-btn',
      '.checkout-btn',
      '.purchase-btn',
      '.buy-now-btn',
      '[data-cart-submit]',
      '[data-add-to-cart]',
      '[data-product-form]',
      '#AddToCart',
      '#add-to-cart',
      '.AddToCart',
      '.add-to-cart',
      '[id*="add-to-cart"]',
      '[class*="add-to-cart"]'
    ];

    document.querySelectorAll(checkoutSelectors.join(',')).forEach((element) => {
      element.style.setProperty('z-index', '2147483647', 'important');
      element.style.setProperty('pointer-events', 'auto', 'important');
      element.style.setProperty('position', 'relative', 'important');
      element.style.setProperty('visibility', 'visible', 'important');
      element.style.setProperty('opacity', '1', 'important');

      element.querySelectorAll('*').forEach((child) => {
        child.style.setProperty('pointer-events', 'auto', 'important');
        child.style.setProperty('z-index', 'inherit', 'important');
      });
    });
  }

  protectCheckoutElements();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectCheckoutElements);
  }

  setInterval(protectCheckoutElements, 500);

  if (window.MutationObserver) {
    const observer = new MutationObserver(() => {
      protectCheckoutElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  console.log('🛡️ Checkout protection script loaded');
})();

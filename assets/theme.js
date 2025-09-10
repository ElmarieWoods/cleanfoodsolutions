// Theme JavaScript - Clean Food Solutions
;(() => {
  // Global theme object
  window.theme = window.theme || {}

  // Utility functions
  window.theme.utils = {
    debounce: (func, wait, immediate) => {
      let timeout
      return function executedFunction() {
        
        const args = arguments
        const later = () => {
          timeout = null
          if (!immediate) func.apply(this, args)
        }
        const callNow = immediate && !timeout
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
        if (callNow) func.apply(this, args)
      }
    },

    throttle: (func, limit) => {
      let inThrottle
      return function () {
        const args = arguments
        
        if (!inThrottle) {
          func.apply(this, args)
          inThrottle = true
          setTimeout(() => (inThrottle = false), limit)
        }
      }
    },

    formatMoney: (cents) => {
      const amount = cents / 100
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    },

    getUrlParameter: (name) => {
      name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]")
      const regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
      const results = regex.exec(location.search)
      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
    },

    getElement: (selector) => document.querySelector(selector),

    getElements: (selector) => document.querySelectorAll(selector),

    addEvent: (element, event, handler) => {
      if (element && typeof handler === "function") {
        element.addEventListener(event, handler)
      }
    },

    showToast: (message, type = "success", duration = 3000) => {
      const container = document.getElementById("toast-container")
      if (!container) return

      const toast = document.createElement("div")
      toast.className = `toast-notification ${type}`
      toast.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        min-width: 300px;
        max-width: 400px;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        border-left: 4px solid ${type === "success" ? "#10b981" : "#ef4444"};
        font-family: 'Serotiva', Arial, sans-serif;
        z-index: 2147483647;
      `

      const iconSvg =
        type === "success"
          ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="color: #10b981;"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="color: #ef4444;"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>'

      toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="flex-shrink: 0;">${iconSvg}</div>
          <div style="color: #111827; font-weight: 500;">${message}</div>
        </div>
      `

      container.appendChild(toast)

      setTimeout(() => {
        toast.style.transform = "translateX(0)"
        toast.style.opacity = "1"
      }, 100)

      setTimeout(() => {
        toast.style.transform = "translateX(100%)"
        toast.style.opacity = "0"
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast)
          }
        }, 300)
      }, duration)

      return toast
    },
  }

  // Enhanced Theme Manager for Clean Food Solutions
  class ThemeManager {
    constructor() {
      this.cartSettings = window.theme_settings?.cart || {
        type: "drawer",
        notification_type: "toast",
        animate_badge: true,
        toast_duration: 3,
      }
      this.isUpdating = false
      this.init()
    }

    init() {
      this.initProductForms()
      this.initToastNotifications()
      this.initCartDrawer()
      this.protectCheckoutElements()
      this.initCartPage()
      console.log("✅ ThemeManager Initialized")
    }

    // CRITICAL: Protect checkout elements from being blocked
    protectCheckoutElements() {
      const checkoutSelectors = [
        'form[action*="/cart/add"]',
        'form[action*="/cart"]',
        'form[action*="checkout"]',
        ".cart-form",
        ".product-form",
        ".checkout-form",
        ".add-to-cart-form",
        'button[name="add"]',
        'input[name="add"]',
        ".add-to-cart-btn",
        ".checkout-btn",
        ".purchase-btn",
        ".buy-now-btn",
        "[data-cart-submit]",
        "[data-add-to-cart]",
        "[data-product-form]",
        "#AddToCart",
        "#add-to-cart",
        ".AddToCart",
        ".add-to-cart",
        '[id*="add-to-cart"]',
        '[class*="add-to-cart"]',
      ]

      const protectElements = () => {
        const elements = document.querySelectorAll(checkoutSelectors.join(", "))
        elements.forEach((element) => {
          if (element) {
            // Apply maximum z-index and ensure clickability
            element.style.setProperty("z-index", "2147483647", "important")
            element.style.setProperty("pointer-events", "auto", "important")
            element.style.setProperty("position", "relative", "important")
            element.style.setProperty("visibility", "visible", "important")
            element.style.setProperty("opacity", "1", "important")

            // Protect all children
            const children = element.querySelectorAll("*")
            children.forEach((child) => {
              child.style.setProperty("pointer-events", "auto", "important")
              child.style.setProperty("z-index", "inherit", "important")
            })
          }
        })
      }

      // Protect immediately and on interval
      protectElements()
      setInterval(protectElements, 500)

      // Monitor for new elements
      const observer = new MutationObserver(() => {
        setTimeout(protectElements, 10)
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })

      console.log("🛡️ Checkout protection active")
    }

    initProductForms() {
      const productForms = document.querySelectorAll('form[action$="/cart/add"]')
      productForms.forEach((form) => {
        // Ensure form is protected
        form.style.setProperty("z-index", "2147483647", "important")
        form.style.setProperty("pointer-events", "auto", "important")

        form.addEventListener("submit", this.handleProductSubmit.bind(this))
      })
    }

    initCartPage() {
      if (window.location.pathname === "/cart") {
        this.initCartPageControls()
      }
    }

    initCartPageControls() {
      // Handle cart page quantity controls
      document.addEventListener("click", (e) => {
        if (this.isUpdating) return

        const quantityBtn = e.target.closest(".quantity-selector__btn")
        const removeBtn = e.target.closest(".cart-item__remove")

        if (quantityBtn) {
          e.preventDefault()
          this.handleCartPageQuantityChange(quantityBtn)
        }

        if (removeBtn) {
          e.preventDefault()
          this.handleCartPageRemoveItem(removeBtn)
        }
      })

      // Handle quantity input changes
      document.addEventListener("change", (e) => {
        if (e.target.classList.contains("quantity-selector__input") && !this.isUpdating) {
          this.handleCartPageQuantityInput(e.target)
        }
      })
    }

    handleCartPageQuantityChange(button) {
      const action = button.dataset.action
      const line = Number.parseInt(button.dataset.line)
      const input = document.querySelector(`.quantity-selector__input[data-line="${line}"]`)

      if (!input) return

      let currentQuantity = Number.parseInt(input.value) || 1

      if (action === "increase") {
        currentQuantity++
      } else if (action === "decrease" && currentQuantity > 1) {
        currentQuantity--
      }

      if (input.value != currentQuantity) {
        input.value = currentQuantity
        this.updateCartItem(line, currentQuantity)
      }
    }

    handleCartPageQuantityInput(input) {
      const line = Number.parseInt(input.dataset.line)
      const quantity = Math.max(1, Number.parseInt(input.value) || 1)

      if (input.value != quantity) {
        input.value = quantity
      }

      this.updateCartItem(line, quantity)
    }

    handleCartPageRemoveItem(button) {
      const line = Number.parseInt(button.dataset.line)
      this.updateCartItem(line, 0)
    }

    initCartDrawer() {
      this.cartDrawer = document.getElementById("cart-drawer")
      this.cartDrawerOverlay = document.getElementById("cart-drawer-overlay")

      if (!this.cartDrawer) {
        console.warn("Cart drawer elements not found")
        return
      }

      // Ensure cart drawer has high z-index but lower than checkout forms
      this.cartDrawer.style.setProperty("z-index", "2147483646", "important")

      // Setup all close handlers
      this.setupCloseHandlers()

      // Setup cart toggle - look for any cart toggle button
      document.addEventListener("click", (e) => {
        const toggleBtn = e.target.closest("[data-cart-toggle], #cart-drawer-toggle, .cart-toggle, #cart-icon-bubble")
        if (toggleBtn) {
          e.preventDefault()
          e.stopPropagation()
          this.toggleCartDrawer()
        }
      })

      // Setup quantity controls
      this.initDrawerQuantityInputs()
    }

    setupCloseHandlers() {
      // Method 1: Direct close button
      const closeBtn = this.cartDrawer?.querySelector(".cart-drawer__close")
      if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          this.closeCartDrawer()
        })
      }

      // Method 2: Overlay click
      const overlay = this.cartDrawer?.querySelector(".cart-drawer__overlay")
      if (overlay) {
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) {
            this.closeCartDrawer()
          }
        })
      }

      // Method 3: Escape key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.cartDrawer?.classList.contains("is-open")) {
          this.closeCartDrawer()
        }
      })
    }

    initDrawerQuantityInputs() {
      if (!this.cartDrawer) return

      // Add single event listener for all cart interactions
      this.cartDrawer.addEventListener("click", (event) => {
        if (this.isUpdating) return

        const target = event.target
        const quantityBtn = target.closest(".quantity-btn")
        const removeBtn = target.closest(".cart-item__remove")
        const closeBtn = target.closest(".cart-drawer__close")

        if (closeBtn) {
          event.preventDefault()
          event.stopPropagation()
          this.closeCartDrawer()
          return
        }

        if (quantityBtn) {
          event.preventDefault()
          const line = quantityBtn.dataset.line
          const input = this.cartDrawer.querySelector(`.quantity-input[data-line="${line}"]`)

          if (!input) return

          let currentQuantity = Number.parseInt(input.value) || 1

          if (quantityBtn.classList.contains("quantity-btn--plus")) {
            currentQuantity++
          } else if (quantityBtn.classList.contains("quantity-btn--minus") && currentQuantity > 1) {
            currentQuantity--
          }

          if (input.value != currentQuantity) {
            input.value = currentQuantity
            this.updateCartItem(line, currentQuantity)
          }
        }

        if (removeBtn) {
          event.preventDefault()
          const line = removeBtn.dataset.line
          if (line) {
            this.updateCartItem(line, 0)
          }
        }
      })
    }

    async updateCartItem(line, quantity) {
      if (this.isUpdating) return

      this.isUpdating = true

      // Show loading state
      const cartItem = document.querySelector(`[data-line="${line}"]`)
      if (cartItem) {
        cartItem.classList.add("loading")
      }

      this.cartDrawer?.classList.add("loading")

      try {
        const response = await fetch("/cart/change.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ line: Number.parseInt(line), quantity }),
        })

        if (!response.ok) {
          throw new Error("Failed to update cart")
        }

        const cartData = await response.json()

        if (cartData.status === 422) {
          throw new Error(cartData.description)
        }

        // Update cart count immediately
        this.updateCartCount(cartData.item_count)

        // Show success message
        if (quantity === 0) {
          window.theme.utils.showToast("Item removed from cart", "success")
        } else {
          window.theme.utils.showToast("Cart updated", "success")
        }

        // Refresh cart drawer content
        await this.refreshCartDrawer()

        // Refresh main cart page if we're on it
        if (window.location.pathname === "/cart") {
          setTimeout(() => {
            window.location.reload()
          }, 500)
        }
      } catch (error) {
        console.error("Error updating cart:", error)
        window.theme.utils.showToast(error.message || "Failed to update cart", "error")
      } finally {
        this.isUpdating = false
        if (cartItem) {
          cartItem.classList.remove("loading")
        }
        this.cartDrawer?.classList.remove("loading")
      }
    }

    async refreshCartDrawer() {
      if (!this.cartDrawer) return

      try {
        const response = await fetch("/cart?section_id=cart-drawer")
        const html = await response.text()

        const parser = new DOMParser()
        const doc = parser.parseFromString(html, "text/html")
        const newContent = doc.querySelector("#cart-drawer")

        if (newContent) {
          const newItems = newContent.querySelector(".cart-drawer__items")
          const currentItems = this.cartDrawer.querySelector(".cart-drawer__items")

          const newFooter = newContent.querySelector(".cart-drawer__footer")
          const currentFooter = this.cartDrawer.querySelector(".cart-drawer__footer")

          if (newItems && currentItems) {
            currentItems.innerHTML = newItems.innerHTML
          }

          if (newFooter && currentFooter) {
            currentFooter.innerHTML = newFooter.innerHTML
          } else if (newFooter && !currentFooter) {
            this.cartDrawer.querySelector(".cart-drawer__content").appendChild(newFooter.cloneNode(true))
          }

          // Re-setup handlers after content update
          this.setupCloseHandlers()
          this.initDrawerQuantityInputs()
          // Re-protect checkout elements
          this.protectCheckoutElements()
        }
      } catch (error) {
        console.error("Failed to refresh cart drawer:", error)
      }
    }

    toggleCartDrawer() {
      const isActive = this.cartDrawer?.classList.contains("is-open")
      if (isActive) {
        this.closeCartDrawer()
      } else {
        this.openCartDrawer()
      }
    }

    async openCartDrawer() {
      if (!this.cartDrawer) return

      // Refresh cart drawer content before opening
      await this.refreshCartDrawer()

      this.cartDrawer.classList.add("is-open")
      if (this.cartDrawerOverlay) {
        this.cartDrawerOverlay.classList.add("is-active")
      }
      document.body.style.overflow = "hidden"
    }

    closeCartDrawer() {
      if (!this.cartDrawer) return

      this.cartDrawer.classList.remove("is-open")
      if (this.cartDrawerOverlay) {
        this.cartDrawerOverlay.classList.remove("is-active")
      }
      document.body.style.overflow = ""
    }

    initToastNotifications() {
      if (!document.getElementById("toast-container")) {
        const container = document.createElement("div")
        container.id = "toast-container"
        container.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          gap: 10px;
        `
        document.body.appendChild(container)
      }
    }
  }

  // Mobile menu functionality
  window.theme.mobileMenu = {
    init: function () {
      this.bindEvents()
    },

    bindEvents: function () {
      document.addEventListener("click", (e) => {
        // Mobile menu toggle
        if (e.target.matches("[data-mobile-menu-toggle]") || e.target.closest("[data-mobile-menu-toggle]")) {
          e.preventDefault()
          this.toggleMobileMenu()
        }

        // Close mobile menu
        if (e.target.matches("[data-mobile-menu-close]") || e.target.closest("[data-mobile-menu-close]")) {
          e.preventDefault()
          this.closeMobileMenu()
        }

        // Submenu toggles
        if (e.target.matches("[data-submenu-toggle]") || e.target.closest("[data-submenu-toggle]")) {
          e.preventDefault()
          this.toggleSubmenu(e.target.closest("[data-submenu-toggle]"))
        }
      })

      // Close mobile menu on escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.closeMobileMenu()
        }
      })

      // Close mobile menu on resize to desktop
      window.addEventListener(
        "resize",
        window.theme.utils.debounce(() => {
          if (window.innerWidth >= 1024) {
            this.closeMobileMenu()
          }
        }, 250),
      )
    },

    toggleMobileMenu: function () {
      const menu = document.querySelector("[data-mobile-menu]")
      const toggle = document.querySelector("[data-mobile-menu-toggle]")

      if (menu && toggle) {
        const isOpen = menu.classList.contains("is-active")

        if (isOpen) {
          this.closeMobileMenu()
        } else {
          this.openMobileMenu()
        }
      }
    },

    openMobileMenu: () => {
      const menu = document.querySelector("[data-mobile-menu]")
      const toggle = document.querySelector("[data-mobile-menu-toggle]")

      if (menu) {
        menu.classList.add("is-active")
        document.body.classList.add("mobile-menu-open")

        // Focus first focusable element
        const firstFocusable = menu.querySelector('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }

      if (toggle) {
        toggle.setAttribute("aria-expanded", "true")
      }
    },

    closeMobileMenu: () => {
      const menu = document.querySelector("[data-mobile-menu]")
      const toggle = document.querySelector("[data-mobile-menu-toggle]")

      if (menu) {
        menu.classList.remove("is-active")
        document.body.classList.remove("mobile-menu-open")
      }

      if (toggle) {
        toggle.setAttribute("aria-expanded", "false")
        toggle.focus()
      }
    },

    toggleSubmenu: (trigger) => {
      const submenu = trigger.nextElementSibling
      const isOpen = submenu && submenu.classList.contains("is-active")

      // Close all other submenus
      document.querySelectorAll("[data-submenu].is-active").forEach((menu) => {
        if (menu !== submenu) {
          menu.classList.remove("is-active")
          const menuTrigger = menu.previousElementSibling
          if (menuTrigger) {
            menuTrigger.setAttribute("aria-expanded", "false")
          }
        }
      })

      if (submenu) {
        if (isOpen) {
          submenu.classList.remove("is-active")
          trigger.setAttribute("aria-expanded", "false")
        } else {
          submenu.classList.add("is-active")
          trigger.setAttribute("aria-expanded", "true")
        }
      }
    },
  }

  // Search functionality
  window.theme.search = {
    init: function () {
      this.bindEvents()
    },

    bindEvents: function () {
      document.addEventListener("click", (e) => {
        // Search toggle
        if (e.target.matches("[data-search-toggle]") || e.target.closest("[data-search-toggle]")) {
          e.preventDefault()
          this.toggleSearch()
        }

        // Close search
        if (e.target.matches("[data-search-close]") || e.target.closest("[data-search-close]")) {
          e.preventDefault()
          this.closeSearch()
        }
      })

      // Close search on escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.closeSearch()
        }
      })
    },

    toggleSearch: function () {
      const search = document.querySelector("[data-search]")
      if (search) {
        const isOpen = search.classList.contains("is-active")
        if (isOpen) {
          this.closeSearch()
        } else {
          this.openSearch()
        }
      }
    },

    openSearch: () => {
      const search = document.querySelector("[data-search]")
      const input = search?.querySelector('input[type="search"]')

      if (search) {
        search.classList.add("is-active")
        document.body.classList.add("search-open")
      }

      if (input) {
        setTimeout(() => input.focus(), 100)
      }
    },

    closeSearch: () => {
      const search = document.querySelector("[data-search]")

      if (search) {
        search.classList.remove("is-active")
        document.body.classList.remove("search-open")
      }
    },
  }

  // Product functionality
  window.theme.product = {
    init: function () {
      this.bindEvents()
      this.initVariantSelectors()
    },

    bindEvents: function () {
      // Variant selector changes
      document.addEventListener("change", (e) => {
        if (e.target.matches("[data-variant-selector]")) {
          this.handleVariantChange(e.target)
        }
      })

      // Quantity controls
      document.addEventListener("click", (e) => {
        if (e.target.matches("[data-quantity-plus]")) {
          e.preventDefault()
          this.increaseQuantity(e.target)
        }

        if (e.target.matches("[data-quantity-minus]")) {
          e.preventDefault()
          this.decreaseQuantity(e.target)
        }
      })

      // Product media
      document.addEventListener("click", (e) => {
        if (e.target.matches("[data-product-media-toggle]") || e.target.closest("[data-product-media-toggle]")) {
          e.preventDefault()
          this.handleMediaClick(e.target.closest("[data-product-media-toggle]"))
        }
      })
    },

    initVariantSelectors: function () {
      const forms = document.querySelectorAll("[data-product-form]")
      forms.forEach((form) => {
        const selectors = form.querySelectorAll("[data-variant-selector]")
        if (selectors.length > 0) {
          this.updateVariantFromUrl(form)
        }
      })
    },

    handleVariantChange: function (selector) {
      const form = selector.closest("[data-product-form]")
      if (!form) return

      const selectedOptions = Array.from(form.querySelectorAll("[data-variant-selector]")).map((select) => select.value)

      const variants = JSON.parse(form.dataset.productVariants || "[]")
      const selectedVariant = variants.find((variant) =>
        variant.options.every((option, index) => option === selectedOptions[index]),
      )

      this.updateProductInfo(form, selectedVariant)
    },

    updateProductInfo: (form, variant) => {
      // Update hidden variant ID input
      const variantInput = form.querySelector('[name="id"]')
      if (variantInput) {
        variantInput.value = variant ? variant.id : ""
      }

      // Update price
      const priceElement = form.querySelector("[data-product-price]")
      if (priceElement && variant) {
        priceElement.textContent = window.theme.utils.formatMoney(variant.price)
      }

      // Update compare at price
      const compareElement = form.querySelector("[data-product-compare-price]")
      if (compareElement) {
        if (variant && variant.compare_at_price && variant.compare_at_price > variant.price) {
          compareElement.textContent = window.theme.utils.formatMoney(variant.compare_at_price)
          compareElement.style.display = ""
        } else {
          compareElement.style.display = "none"
        }
      }

      // Update availability
      const submitButton = form.querySelector('[type="submit"]')
      if (submitButton) {
        if (!variant) {
          submitButton.disabled = true
          submitButton.textContent = "Unavailable"
        } else if (!variant.available) {
          submitButton.disabled = true
          submitButton.textContent = "Sold Out"
        } else {
          submitButton.disabled = false
          submitButton.textContent = "Add to Cart"
        }
      }

      // Update URL
      if (variant) {
        const url = new URL(window.location)
        url.searchParams.set("variant", variant.id)
        window.history.replaceState({}, "", url)
      }
    },

    updateVariantFromUrl: function (form) {
      const urlParams = new URLSearchParams(window.location.search)
      const variantId = urlParams.get("variant")

      if (variantId) {
        const variants = JSON.parse(form.dataset.productVariants || "[]")
        const variant = variants.find((v) => v.id.toString() === variantId)

        if (variant) {
          // Update selectors to match variant
          const selectors = form.querySelectorAll("[data-variant-selector]")
          selectors.forEach((selector, index) => {
            if (variant.options[index]) {
              selector.value = variant.options[index]
            }
          })

          this.updateProductInfo(form, variant)
        }
      }
    },

    increaseQuantity: (button) => {
      const input = button.parentNode.querySelector('input[name="quantity"]')
      if (input) {
        const currentValue = Number.parseInt(input.value) || 1
        input.value = currentValue + 1
        input.dispatchEvent(new Event("change"))
      }
    },

    decreaseQuantity: (button) => {
      const input = button.parentNode.querySelector('input[name="quantity"]')
      if (input) {
        const currentValue = Number.parseInt(input.value) || 1
        if (currentValue > 1) {
          input.value = currentValue - 1
          input.dispatchEvent(new Event("change"))
        }
      }
    },

    handleMediaClick: (trigger) => {
      const mediaId = trigger.dataset.productMediaToggle
      const targetMedia = document.querySelector(`[data-product-media="${mediaId}"]`)

      if (targetMedia) {
        // Hide all media
        document.querySelectorAll("[data-product-media]").forEach((media) => {
          media.classList.remove("is-active")
        })

        // Show target media
        targetMedia.classList.add("is-active")

        // Update thumbnails
        document.querySelectorAll("[data-product-media-toggle]").forEach((thumb) => {
          thumb.classList.remove("is-active")
        })
        trigger.classList.add("is-active")
      }
    },
  }

  // Accordion functionality
  window.theme.accordion = {
    init: function () {
      this.bindEvents()
    },

    bindEvents: function () {
      document.addEventListener("click", (e) => {
        if (e.target.matches("[data-accordion-toggle]") || e.target.closest("[data-accordion-toggle]")) {
          e.preventDefault()
          this.toggleAccordion(e.target.closest("[data-accordion-toggle]"))
        }
      })
    },

    toggleAccordion: (trigger) => {
      const content = trigger.nextElementSibling
      const isOpen = content && content.classList.contains("is-active")

      if (content) {
        if (isOpen) {
          content.classList.remove("is-active")
          trigger.setAttribute("aria-expanded", "false")
        } else {
          content.classList.add("is-active")
          trigger.setAttribute("aria-expanded", "true")
        }
      }
    },
  }

  // Modal functionality
  window.theme.modal = {
    init: function () {
      this.bindEvents()
    },

    bindEvents: function () {
      document.addEventListener("click", (e) => {
        // Open modal
        if (e.target.matches("[data-modal-toggle]") || e.target.closest("[data-modal-toggle]")) {
          e.preventDefault()
          const modalId = e.target.closest("[data-modal-toggle]").dataset.modalToggle
          this.openModal(modalId)
        }

        // Close modal
        if (e.target.matches("[data-modal-close]") || e.target.closest("[data-modal-close]")) {
          e.preventDefault()
          this.closeModal()
        }

        // Close modal when clicking backdrop
        if (e.target.matches(".modal.is-active")) {
          this.closeModal()
        }
      })

      // Close modal on escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.closeModal()
        }
      })
    },

    openModal: (modalId) => {
      const modal = document.querySelector(`[data-modal="${modalId}"]`)
      if (modal) {
        modal.classList.add("is-active")
        document.body.classList.add("modal-open")

        // Focus first focusable element
        const firstFocusable = modal.querySelector(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }
    },

    closeModal: () => {
      const activeModal = document.querySelector(".modal.is-active")
      if (activeModal) {
        activeModal.classList.remove("is-active")
        document.body.classList.remove("modal-open")
      }
    },
  }

  // Form enhancements
  window.theme.forms = {
    init: function () {
      this.bindEvents()
      this.initValidation()
    },

    bindEvents: function () {
      // Newsletter forms
      document.addEventListener("submit", (e) => {
        if (e.target.matches("[data-newsletter-form]")) {
          this.handleNewsletterSubmit(e)
        }
      })

      // Contact forms
      document.addEventListener("submit", (e) => {
        if (e.target.matches("[data-contact-form]")) {
          this.handleContactSubmit(e)
        }
      })
    },

    initValidation: function () {
      // Add real-time validation
      document.addEventListener(
        "blur",
        (e) => {
          if (e.target.matches("input[required], textarea[required], select[required]")) {
            this.validateField(e.target)
          }
        },
        true,
      )
    },

    validateField: (field) => {
      const isValid = field.checkValidity()
      const errorElement = field.parentNode.querySelector(".field-error")

      if (!isValid) {
        field.classList.add("error")
        if (errorElement) {
          errorElement.textContent = field.validationMessage
          errorElement.style.display = "block"
        }
      } else {
        field.classList.remove("error")
        if (errorElement) {
          errorElement.style.display = "none"
        }
      }

      return isValid
    },

    handleNewsletterSubmit: function (e) {
      e.preventDefault()
      const form = e.target
      const submitButton = form.querySelector('[type="submit"]')
      const originalText = submitButton.textContent

      // Validate form
      const isValid = Array.from(form.querySelectorAll("input[required]")).every((field) => this.validateField(field))

      if (!isValid) return

      // Show loading state
      submitButton.disabled = true
      submitButton.textContent = "Subscribing..."

      // Simulate form submission (replace with actual endpoint)
      setTimeout(() => {
        submitButton.textContent = "Subscribed!"
        form.reset()

        setTimeout(() => {
          submitButton.disabled = false
          submitButton.textContent = originalText
        }, 2000)
      }, 1000)
    },

    handleContactSubmit: function (e) {
      e.preventDefault()
      const form = e.target
      const submitButton = form.querySelector('[type="submit"]')
      const originalText = submitButton.textContent

      // Validate form
      const isValid = Array.from(form.querySelectorAll("input[required], textarea[required]")).every((field) =>
        this.validateField(field),
      )

      if (!isValid) return

      // Show loading state
      submitButton.disabled = true
      submitButton.textContent = "Sending..."

      // Simulate form submission (replace with actual endpoint)
      setTimeout(() => {
        submitButton.textContent = "Message Sent!"
        form.reset()

        setTimeout(() => {
          submitButton.disabled = false
          submitButton.textContent = originalText
        }, 2000)
      }, 1000)
    },
  }

  // Lazy loading
  window.theme.lazyLoad = {
    init: function () {
      if ("IntersectionObserver" in window) {
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
          rootMargin: "50px 0px",
          threshold: 0.01,
        })

        this.bindElements()
      } else {
        // Fallback for older browsers
        this.loadAllImages()
      }
    },

    bindElements: function () {
      document.querySelectorAll("[data-lazy]").forEach((element) => {
        this.observer.observe(element)
      })
    },

    handleIntersection: function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target)
          this.observer.unobserve(entry.target)
        }
      })
    },

    loadElement: (element) => {
      if (element.dataset.src) {
        element.src = element.dataset.src
        element.removeAttribute("data-src")
      }

      if (element.dataset.srcset) {
        element.srcset = element.dataset.srcset
        element.removeAttribute("data-srcset")
      }

      if (element.dataset.backgroundImage) {
        element.style.backgroundImage = `url(${element.dataset.backgroundImage})`
        element.removeAttribute("data-background-image")
      }

      element.classList.remove("lazy")
      element.classList.add("loaded")
    },

    loadAllImages: function () {
      document.querySelectorAll("[data-lazy]").forEach((element) => {
        this.loadElement(element)
      })
    },
  }

  // Scroll effects
  window.theme.scroll = {
    init: function () {
      this.bindEvents()
      this.handleScroll()
    },

    bindEvents: function () {
      window.addEventListener("scroll", window.theme.utils.throttle(this.handleScroll.bind(this), 16))
    },

    handleScroll: () => {
      const scrollY = window.pageYOffset

      // Header scroll effects
      const header = document.querySelector("[data-header]")
      if (header) {
        if (scrollY > 100) {
          header.classList.add("scrolled")
        } else {
          header.classList.remove("scrolled")
        }
      }

      // Parallax effects
      document.querySelectorAll("[data-parallax]").forEach((element) => {
        const speed = Number.parseFloat(element.dataset.parallax) || 0.5
        const yPos = -(scrollY * speed)
        element.style.transform = `translateY(${yPos}px)`
      })

      // Fade in animations
      document.querySelectorAll("[data-fade-in]:not(.visible)").forEach((element) => {
        const elementTop = element.getBoundingClientRect().top
        const elementVisible = 150

        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add("visible")
        }
      })
    },
  }

  // Initialize all modules when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    window.theme.mobileMenu.init()
    window.theme.search.init()
    window.theme.product.init()
    window.theme.accordion.init()
    window.theme.modal.init()
    window.theme.forms.init()
    window.theme.lazyLoad.init()
    window.theme.scroll.init()

    console.log("🎨 Clean Food Solutions theme initialized")
  })

  // Handle page visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Page is hidden
      console.log("Page hidden")
    } else {
      // Page is visible
      console.log("Page visible")
    }
  })

  // Handle online/offline status
  window.addEventListener("online", () => {
    console.log("Connection restored")
  })

  window.addEventListener("offline", () => {
    console.log("Connection lost")
  })
})()

// Add CSS for toast notifications
const toastStyles = `
  .toast-notification {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-bottom: 10px;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 400px;
    border-left: 4px solid var(--color-primary);
  }
  
  .toast-notification--success {
    border-left-color: var(--color-success);
  }
  
  .toast-notification--error {
    border-left-color: var(--color-error);
  }
  
  .toast-notification--info {
    border-left-color: var(--color-primary);
  }
  
  .toast-notification__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
  }
  
  .toast-notification__message {
    font-size: 14px;
    color: var(--color-foreground);
    margin-right: 12px;
  }
  
  .toast-notification__close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--color-foreground-light);
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .toast-notification__close:hover {
    color: var(--color-foreground);
  }
`

// Inject toast styles
const styleSheet = document.createElement("style")
styleSheet.textContent = toastStyles
document.head.appendChild(styleSheet)

// Clean Food Solutions - Enhanced Cart JavaScript
console.log("🛒 Cart JavaScript loaded")

// Import necessary variables and functions
const debounce = (func, wait) => {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

const ON_CHANGE_DEBOUNCE_TIMER = 300 // Example value, should be defined according to your application's needs

// Event system
const subscribe = (event, callback) => {
  window.addEventListener(event, callback)
  return () => window.removeEventListener(event, callback)
}

const publish = (event, data) => {
  const eventObj = new CustomEvent(event, { detail: data })
  window.dispatchEvent(eventObj)
}

const PUB_SUB_EVENTS = {
  cartUpdate: "cartUpdate",
  cartError: "cartError",
}

// Routes
const routes = {
  cart_url: "/cart",
  cart_change_url: "/cart/change.js",
  cart_update_url: "/cart/update.js",
  cart_add_url: "/cart/add.js",
}

// Fetch configuration
const fetchConfig = () => {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }
}

// Cart counter management - prevents multiple increments
let cartUpdateInProgress = false

// Focus management utilities
function trapFocus(container, elementToFocus) {
  if (!container) return

  const focusableElements = container.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
  )

  if (focusableElements.length === 0) return

  const firstFocusableElement = focusableElements[0]
  const lastFocusableElement = focusableElements[focusableElements.length - 1]

  container.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus()
        e.preventDefault()
      }
    }
  })

  if (elementToFocus) {
    elementToFocus.focus()
  } else {
    firstFocusableElement.focus()
  }
}

function removeTrapFocus(activeElement) {
  if (activeElement) {
    activeElement.blur()
  }
}

const onKeyUpEscape = (event) => {
  if (event.code.toUpperCase() === "ESCAPE") {
    event.preventDefault()
    const drawer = document.querySelector("cart-drawer")
    if (drawer) drawer.close()
  }
}

class CartRemoveButton extends HTMLElement {
  constructor() {
    super()

    this.addEventListener("click", (event) => {
      event.preventDefault()
      const cartItems = this.closest("cart-items") || this.closest("cart-drawer-items")
      if (cartItems) {
        cartItems.updateQuantity(this.dataset.index, 0)
      }
    })
  }
}

customElements.define("cart-remove-button", CartRemoveButton)

class CartItems extends HTMLElement {
  constructor() {
    super()
    this.lineItemStatusElement =
      document.getElementById("shopping-cart-line-item-status") || document.getElementById("CartDrawer-LineItemStatus")

    const debouncedOnChange = debounce((event) => {
      this.onChange(event)
    }, ON_CHANGE_DEBOUNCE_TIMER)

    this.addEventListener("change", debouncedOnChange.bind(this))
  }

  cartUpdateUnsubscriber = undefined

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.detail && event.detail.source === "cart-items") {
        return
      }
      this.onCartUpdate()
    })
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber()
    }
  }

  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute("name"))
  }

  onCartUpdate() {
    if (this.tagName === "CART-DRAWER-ITEMS") {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, "text/html")
          const selectors = ["cart-drawer-items", ".cart-drawer__footer"]
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector)
            const sourceElement = html.querySelector(selector)
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement)
            }
          }
        })
        .catch((e) => {
          console.error("Error updating cart drawer:", e)
        })
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, "text/html")
          const sourceQty = html.querySelector("cart-items")
          if (sourceQty) {
            this.innerHTML = sourceQty.innerHTML
          }
        })
        .catch((e) => {
          console.error("Error updating cart items:", e)
        })
    }
  }

  getSectionsToRender() {
    return [
      {
        id: "main-cart-items",
        section: document.getElementById("main-cart-items")?.dataset.id || "main-cart-items",
        selector: ".js-contents",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
      {
        id: "cart-live-region-text",
        section: "cart-live-region-text",
        selector: ".shopify-section",
      },
      {
        id: "main-cart-footer",
        section: document.getElementById("main-cart-footer")?.dataset.id || "main-cart-footer",
        selector: ".js-contents",
      },
    ]
  }

  updateQuantity(line, quantity, name) {
    if (cartUpdateInProgress) {
      console.log("Cart update already in progress, skipping...")
      return
    }

    cartUpdateInProgress = true
    this.enableLoading(line)

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    })

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text()
      })
      .then((state) => {
        const parsedState = JSON.parse(state)
        const quantityElement =
          document.getElementById(`Quantity-${line}`) ||
          document.getElementById(`Drawer-quantity-${line}`) ||
          document.querySelector(`[name="${name}"]`)

        const items = document.querySelectorAll(".cart-item")

        if (parsedState.errors) {
          if (quantityElement) {
            quantityElement.value = quantityElement.getAttribute("value")
          }
          this.updateLiveRegions(line, parsedState.errors)
          return
        }

        // Update cart counter with exact count from API response
        if (window.cartCounterFix && typeof parsedState.item_count !== "undefined") {
          window.cartCounterFix.updateCartCount(parsedState.item_count)
        }

        this.classList.toggle("is-empty", parsedState.item_count === 0)
        const cartDrawerWrapper = document.querySelector("cart-drawer")
        const cartFooter = document.getElementById("main-cart-footer")

        if (cartFooter) cartFooter.classList.toggle("is-empty", parsedState.item_count === 0)
        if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle("is-empty", parsedState.item_count === 0)

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document.getElementById(section.id)?.querySelector(section.selector) || document.getElementById(section.id)
          if (elementToReplace && parsedState.sections[section.section]) {
            elementToReplace.innerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.section],
              section.selector,
            )
          }
        })

        const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined
        let message = ""
        if (items.length === parsedState.items.length && updatedValue !== Number.parseInt(quantityElement?.value)) {
          if (typeof updatedValue === "undefined") {
            message = window.cartStrings?.error || "There was an error updating your cart"
          } else {
            message = (window.cartStrings?.quantityError || "Quantity updated to [quantity]").replace(
              "[quantity]",
              updatedValue,
            )
          }
        }
        this.updateLiveRegions(line, message)

        const lineItem =
          document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`)

        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          if (cartDrawerWrapper) {
            trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
          } else {
            lineItem.querySelector(`[name="${name}"]`).focus()
          }
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper, document.querySelector("#CartDrawer-Overlay"))
        }

        publish(PUB_SUB_EVENTS.cartUpdate, { source: "cart-items", cart: parsedState })
      })
      .catch((error) => {
        console.error("Error updating cart:", error)
        this.querySelectorAll(".loading-overlay").forEach((overlay) => overlay.classList.add("hidden"))
        const errors = document.getElementById("cart-errors") || document.getElementById("CartDrawer-CartErrors")
        if (errors) {
          errors.textContent = window.cartStrings?.error || "There was an error updating your cart"
        }
        publish(PUB_SUB_EVENTS.cartError, { error })
      })
      .finally(() => {
        this.disableLoading(line)
        cartUpdateInProgress = false
      })
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`)

    if (lineItemError) {
      const errorText = lineItemError.querySelector(".cart-item__error-text")
      if (errorText) {
        errorText.innerHTML = message
      }
    }

    if (this.lineItemStatusElement) {
      this.lineItemStatusElement.setAttribute("aria-hidden", true)
    }

    const cartStatus =
      document.getElementById("cart-live-region-text") || document.getElementById("CartDrawer-LiveRegionText")

    if (cartStatus) {
      cartStatus.setAttribute("aria-hidden", false)
      setTimeout(() => {
        cartStatus.setAttribute("aria-hidden", true)
      }, 1000)
    }
  }

  getSectionInnerHTML(html, selector) {
    const parsed = new DOMParser().parseFromString(html, "text/html")
    return selector ? parsed.querySelector(selector)?.innerHTML || "" : html
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById("main-cart-items") || document.querySelector("cart-drawer-items")
    if (mainCartItems) {
      mainCartItems.classList.add("cart__items--disabled")
    }

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading-overlay`)
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`)
    ;[...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove("hidden"))

    document.activeElement?.blur()
    if (this.lineItemStatusElement) {
      this.lineItemStatusElement.setAttribute("aria-hidden", false)
    }
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById("main-cart-items") || document.querySelector("cart-drawer-items")
    if (mainCartItems) {
      mainCartItems.classList.remove("cart__items--disabled")
    }

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading-overlay`)
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`)
    ;[...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.add("hidden"))
  }
}

customElements.define("cart-items", CartItems)

// Cart Note Component
if (!customElements.get("cart-note")) {
  customElements.define(
    "cart-note",
    class CartNote extends HTMLElement {
      constructor() {
        super()

        this.addEventListener(
          "change",
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value })
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } }).catch((error) => {
              console.error("Error updating cart note:", error)
            })
          }, ON_CHANGE_DEBOUNCE_TIMER),
        )
      }
    },
  )
}

// Cart Drawer Component
class CartDrawer extends HTMLElement {
  constructor() {
    super()

    this.addEventListener("keyup", (evt) => evt.code === "Escape" && this.close())
    const overlay = this.querySelector("#CartDrawer-Overlay")
    if (overlay) {
      overlay.addEventListener("click", this.close.bind(this))
    }
    this.setHeaderCartIconAccessibility()
  }

  setHeaderCartIconAccessibility() {
    const cartLinks = document.querySelectorAll("#cart-icon-bubble, [data-cart-toggle], .cart-toggle")
    cartLinks.forEach((cartLink) => {
      if (cartLink) {
        cartLink.setAttribute("role", "button")
        cartLink.setAttribute("aria-haspopup", "dialog")
        cartLink.addEventListener("click", (event) => {
          event.preventDefault()
          this.open(cartLink)
        })
        cartLink.addEventListener("keydown", (event) => {
          if (event.code.toUpperCase() === "SPACE") {
            event.preventDefault()
            this.open(cartLink)
          }
        })
      }
    })
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy)

    const cartDrawerNote = this.querySelector('[id^="Details-"] summary')
    if (cartDrawerNote && !cartDrawerNote.hasAttribute("role")) {
      this.setSummaryAccessibility(cartDrawerNote)
    }

    // Animation trigger with timeout
    setTimeout(() => {
      this.classList.add("animate", "active")
    }, 10)

    this.addEventListener(
      "transitionend",
      () => {
        const containerToTrapFocusOn = this.classList.contains("active") ? this : null
        const focusElement = this.querySelector(".drawer__inner") || this.querySelector(".drawer__close")
        trapFocus(containerToTrapFocusOn, focusElement)
      },
      { once: true },
    )

    document.body.classList.add("overflow-hidden")
  }

  close() {
    this.classList.remove("active")
    removeTrapFocus(this.activeElement)
    document.body.classList.remove("overflow-hidden")
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute("role", "button")
    cartDrawerNote.setAttribute("aria-expanded", "false")

    if (cartDrawerNote.nextElementSibling?.getAttribute("id")) {
      cartDrawerNote.setAttribute("aria-controls", cartDrawerNote.nextElementSibling.id)
    }

    cartDrawerNote.addEventListener("click", (event) => {
      event.currentTarget.setAttribute("aria-expanded", !event.currentTarget.closest("details").hasAttribute("open"))
    })

    cartDrawerNote.parentElement.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") {
        event.preventDefault()
        this.close()
      }
    })
  }

  renderContents(parsedState) {
    const drawerInner = this.querySelector(".drawer__inner")
    if (drawerInner?.classList.contains("is-empty")) {
      drawerInner.classList.remove("is-empty")
    }

    this.productId = parsedState.id
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id)

      if (sectionElement && parsedState.sections[section.id]) {
        sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector)
      }
    })

    setTimeout(() => {
      const overlay = this.querySelector("#CartDrawer-Overlay")
      if (overlay) {
        overlay.addEventListener("click", this.close.bind(this))
      }
      this.open()
    }, 10)
  }

  getSectionInnerHTML(html, selector) {
    const parsed = new DOMParser().parseFromString(html, "text/html")
    return selector ? parsed.querySelector(selector)?.innerHTML || "" : html
  }

  getSectionsToRender() {
    return [
      {
        id: "cart-drawer",
        selector: "#CartDrawer .drawer__inner",
      },
      {
        id: "cart-icon-bubble",
      },
    ]
  }

  setActiveElement(element) {
    this.activeElement = element
  }
}

customElements.define("cart-drawer", CartDrawer)

// Cart Drawer Items Component
class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: "CartDrawer-CartItems",
        section: "cart-drawer",
        selector: '[data-id="CartDrawer-CartItems"]',
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
      {
        id: "CartDrawer-LiveRegionText",
        section: "cart-live-region-text",
        selector: '[data-id="CartDrawer-LiveRegionText"]',
      },
    ]
  }
}

customElements.define("cart-drawer-items", CartDrawerItems)

// Enhanced Add to Cart functionality
function addToCart(variantId, quantity = 1, properties = {}) {
  if (cartUpdateInProgress) {
    console.log("Cart update in progress, please wait...")
    return Promise.reject("Cart update in progress")
  }

  cartUpdateInProgress = true

  const body = JSON.stringify({
    items: [
      {
        id: variantId,
        quantity: quantity,
        properties: properties,
      },
    ],
  })

  return fetch(routes.cart_add_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status && data.status !== 200) {
        throw new Error(data.description || data.message || "Failed to add item to cart")
      }

      // Get fresh cart data to ensure accurate count
      return fetch("/cart.js")
        .then((response) => response.json())
        .then((cart) => {
          // Update cart count with exact API response
          if (window.cartCounterFix) {
            window.cartCounterFix.updateCartCount(cart.item_count)
          }

          // Show success message or open cart drawer
          const cartDrawer = document.querySelector("cart-drawer") || document.getElementById("cart-drawer")
          if (cartDrawer) {
            // Refresh cart drawer content first
            refreshCartDrawer().then(() => {
              if (typeof cartDrawer.open === "function") {
                cartDrawer.open()
              } else if (typeof window.openCartDrawer === "function") {
                window.openCartDrawer()
              }
            })
          }

          // Publish cart update event
          publish(PUB_SUB_EVENTS.cartUpdate, { source: "add-to-cart", cart: cart })

          return { success: true, cart: cart, item: data }
        })
    })
    .catch((error) => {
      console.error("Error adding to cart:", error)
      publish(PUB_SUB_EVENTS.cartError, { error: error.message })
      throw error
    })
    .finally(() => {
      cartUpdateInProgress = false
    })
}

// Refresh cart drawer content
function refreshCartDrawer() {
  return fetch("/cart?section_id=cart-drawer")
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")
      const newCartDrawer = doc.querySelector("#cart-drawer")
      const currentCartDrawer = document.querySelector("#cart-drawer")

      if (newCartDrawer && currentCartDrawer) {
        // Update the cart drawer content
        const newItems = newCartDrawer.querySelector(".cart-drawer__items")
        const currentItems = currentCartDrawer.querySelector(".cart-drawer__items")

        const newFooter = newCartDrawer.querySelector(".cart-drawer__footer")
        const currentFooter = currentCartDrawer.querySelector(".cart-drawer__footer")

        if (newItems && currentItems) {
          currentItems.innerHTML = newItems.innerHTML
        }

        if (newFooter && currentFooter) {
          currentFooter.innerHTML = newFooter.innerHTML
        } else if (newFooter && !currentFooter) {
          // Add footer if it doesn't exist
          currentCartDrawer.querySelector(".cart-drawer__content").appendChild(newFooter.cloneNode(true))
        }
      }
    })
    .catch((error) => {
      console.error("Error refreshing cart drawer:", error)
    })
}

// Update cart count function
function updateCartCount() {
  fetch("/cart.js")
    .then((response) => response.json())
    .then((cart) => {
      if (window.cartCounterFix) {
        window.cartCounterFix.updateCartCount(cart.item_count)
      }
    })
    .catch((error) => {
      console.error("Error updating cart count:", error)
    })
}

// Cart Manager Class
class CartManager {
  constructor() {
    this.cart = null
    this.isUpdating = false
    this.init()
  }

  init() {
    this.bindEvents()
    this.loadCart()
  }

  bindEvents() {
    // Add to cart form submissions
    document.addEventListener("submit", (e) => {
      if (e.target.matches('form[action*="/cart/add"]')) {
        e.preventDefault()
        this.handleAddToCart(e.target)
      }
    })

    // Cart drawer events
    document.addEventListener("click", (e) => {
      // Open cart drawer
      if (e.target.matches("[data-cart-drawer-toggle]") || e.target.closest("[data-cart-drawer-toggle]")) {
        e.preventDefault()
        this.openCartDrawer()
      }

      // Close cart drawer
      if (e.target.matches("[data-cart-drawer-close]") || e.target.closest("[data-cart-drawer-close]")) {
        e.preventDefault()
        this.closeCartDrawer()
      }

      // Remove item from cart
      if (e.target.matches("[data-cart-remove]") || e.target.closest("[data-cart-remove]")) {
        e.preventDefault()
        const key = e.target.closest("[data-cart-remove]").dataset.cartRemove
        this.removeFromCart(key)
      }

      // Update quantity buttons
      if (e.target.matches("[data-cart-quantity-plus]")) {
        e.preventDefault()
        const input = e.target.parentNode.querySelector('input[name="quantity"]')
        const currentValue = Number.parseInt(input.value) || 0
        input.value = currentValue + 1
        this.updateCartItem(input)
      }

      if (e.target.matches("[data-cart-quantity-minus]")) {
        e.preventDefault()
        const input = e.target.parentNode.querySelector('input[name="quantity"]')
        const currentValue = Number.parseInt(input.value) || 0
        if (currentValue > 0) {
          input.value = currentValue - 1
          this.updateCartItem(input)
        }
      }
    })

    // Quantity input changes
    document.addEventListener("change", (e) => {
      if (e.target.matches("[data-cart-quantity-input]")) {
        this.updateCartItem(e.target)
      }
    })

    // Close cart drawer when clicking overlay
    document.addEventListener("click", (e) => {
      if (e.target.matches("#cart-drawer-overlay")) {
        this.closeCartDrawer()
      }
    })

    // Close cart drawer with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeCartDrawer()
      }
    })
  }

  async handleAddToCart(form) {
    if (this.isUpdating) return

    this.isUpdating = true
    const formData = new FormData(form)
    const submitButton = form.querySelector('[type="submit"]')
    const originalText = submitButton.textContent

    try {
      // Update button state
      submitButton.disabled = true
      submitButton.classList.add("loading")
      submitButton.textContent = "Adding..."

      const response = await fetch("/cart/add.js", {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const item = await response.json()

      // Show success state
      submitButton.classList.remove("loading")
      submitButton.classList.add("success")
      submitButton.textContent = "Added!"

      // Refresh cart and open drawer
      await this.loadCart()
      this.openCartDrawer()

      // Show success notification
      this.showNotification(`${item.product_title} added to cart!`, "success")

      // Reset button after delay
      setTimeout(() => {
        submitButton.disabled = false
        submitButton.classList.remove("success")
        submitButton.textContent = originalText
      }, 2000)
    } catch (error) {
      console.error("Error adding to cart:", error)

      // Show error state
      submitButton.classList.remove("loading")
      submitButton.classList.add("error")
      submitButton.textContent = "Error"

      this.showNotification("Error adding item to cart. Please try again.", "error")

      // Reset button after delay
      setTimeout(() => {
        submitButton.disabled = false
        submitButton.classList.remove("error")
        submitButton.textContent = originalText
      }, 3000)
    } finally {
      this.isUpdating = false
    }
  }

  async updateCartItem(input) {
    if (this.isUpdating) return

    this.isUpdating = true
    const key = input.dataset.cartQuantityInput
    const quantity = Number.parseInt(input.value) || 0

    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          id: key,
          quantity: quantity,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const cart = await response.json()
      this.cart = cart
      this.updateCartUI()

      if (quantity === 0) {
        this.showNotification("Item removed from cart", "info")
      }
    } catch (error) {
      console.error("Error updating cart:", error)
      this.showNotification("Error updating cart. Please try again.", "error")
      // Revert input value
      input.value = input.dataset.originalValue || 1
    } finally {
      this.isUpdating = false
    }
  }

  async removeFromCart(key) {
    if (this.isUpdating) return

    this.isUpdating = true

    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          id: key,
          quantity: 0,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const cart = await response.json()
      this.cart = cart
      this.updateCartUI()
      this.showNotification("Item removed from cart", "info")
    } catch (error) {
      console.error("Error removing from cart:", error)
      this.showNotification("Error removing item. Please try again.", "error")
    } finally {
      this.isUpdating = false
    }
  }

  async loadCart() {
    try {
      const response = await fetch("/cart.js", {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      this.cart = await response.json()
      this.updateCartUI()
    } catch (error) {
      console.error("Error loading cart:", error)
    }
  }

  updateCartUI() {
    this.updateCartCount()
    this.updateCartDrawer()
  }

  updateCartCount() {
    const count = this.cart ? this.cart.item_count : 0
    const countElements = document.querySelectorAll("[data-cart-count]")

    countElements.forEach((element) => {
      element.textContent = count
      if (count === 0) {
        element.style.display = "none"
      } else {
        element.style.display = ""
      }
    })
  }

  updateCartDrawer() {
    const drawer = document.querySelector("[data-cart-drawer]")
    if (!drawer) return

    const itemsContainer = drawer.querySelector("[data-cart-items]")
    const emptyState = drawer.querySelector("[data-cart-empty]")
    const cartFooter = drawer.querySelector("[data-cart-footer]")

    if (!this.cart || this.cart.item_count === 0) {
      // Show empty state
      if (itemsContainer) itemsContainer.style.display = "none"
      if (cartFooter) cartFooter.style.display = "none"
      if (emptyState) emptyState.style.display = "block"
    } else {
      // Show cart items
      if (emptyState) emptyState.style.display = "none"
      if (itemsContainer) itemsContainer.style.display = "block"
      if (cartFooter) cartFooter.style.display = "block"

      // Update cart items HTML
      if (itemsContainer) {
        itemsContainer.innerHTML = this.generateCartItemsHTML()
      }

      // Update cart total
      const totalElement = drawer.querySelector("[data-cart-total]")
      if (totalElement && this.cart.total_price) {
        totalElement.textContent = this.formatMoney(this.cart.total_price)
      }
    }
  }

  generateCartItemsHTML() {
    if (!this.cart || !this.cart.items) return ""

    return this.cart.items
      .map(
        (item) => `
      <div class="cart-item" data-cart-item="${item.key}">
        <div class="cart-item__image">
          ${item.image ? `<img src="${item.image}" alt="${item.product_title}" loading="lazy">` : ""}
        </div>
        <div class="cart-item__details">
          <h3 class="cart-item__title">${item.product_title}</h3>
          ${item.variant_title ? `<p class="cart-item__variant">${item.variant_title}</p>` : ""}
          <div class="cart-item__price">
            ${this.formatMoney(item.final_line_price)}
            ${item.quantity > 1 ? `<span class="cart-item__unit-price">${this.formatMoney(item.final_price)} each</span>` : ""}
          </div>
        </div>
        <div class="cart-item__quantity">
          <div class="quantity-selector">
            <button type="button" class="quantity-btn" data-cart-quantity-minus>
              <span class="visually-hidden">Decrease quantity</span>
              −
            </button>
            <input 
              type="number" 
              name="quantity" 
              value="${item.quantity}" 
              min="0" 
              class="quantity-input"
              data-cart-quantity-input="${item.key}"
              data-original-value="${item.quantity}"
            >
            <button type="button" class="quantity-btn" data-cart-quantity-plus>
              <span class="visually-hidden">Increase quantity</span>
              +
            </button>
          </div>
        </div>
        <div class="cart-item__remove">
          <button type="button" class="cart-item__remove-btn" data-cart-remove="${item.key}">
            <span class="visually-hidden">Remove ${item.product_title}</span>
            ×
          </button>
        </div>
      </div>
    `,
      )
      .join("")
  }

  openCartDrawer() {
    const drawer = document.querySelector("[data-cart-drawer]")
    const overlay = document.querySelector("#cart-drawer-overlay")

    if (drawer) {
      drawer.classList.add("is-active")
      document.body.classList.add("cart-drawer-open")
    }

    if (overlay) {
      overlay.style.visibility = "visible"
      overlay.style.opacity = "1"
    }

    // Focus management
    const closeButton = drawer?.querySelector("[data-cart-drawer-close]")
    if (closeButton) {
      closeButton.focus()
    }
  }

  closeCartDrawer() {
    const drawer = document.querySelector("[data-cart-drawer]")
    const overlay = document.querySelector("#cart-drawer-overlay")

    if (drawer) {
      drawer.classList.remove("is-active")
      document.body.classList.remove("cart-drawer-open")
    }

    if (overlay) {
      overlay.style.visibility = "hidden"
      overlay.style.opacity = "0"
    }
  }

  showNotification(message, type = "info") {
    const container = document.getElementById("toast-container")
    if (!container) return

    const toast = document.createElement("div")
    toast.className = `toast toast--${type}`
    toast.innerHTML = `
      <div class="toast__content">
        <span class="toast__message">${message}</span>
        <button type="button" class="toast__close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `

    container.appendChild(toast)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove()
      }
    }, 5000)

    // Add entrance animation
    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)"
      toast.style.opacity = "1"
    })
  }

  formatMoney(cents) {
    const amount = cents / 100
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }
}

// Initialize cart manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.cartManager = new CartManager()
})

// Export functions for global use
window.addToCart = addToCart
window.updateCartCount = updateCartCount
window.refreshCartDrawer = refreshCartDrawer

console.log("✅ Cart JavaScript fully loaded")

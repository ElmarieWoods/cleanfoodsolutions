document.addEventListener("DOMContentLoaded", () => {
  // Enhanced footer functionality
  const footer = document.querySelector(".site-footer-section")
  if (!footer) return

  // Newsletter form handling
  const newsletterForm = document.querySelector(".newsletter-form")
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      const email = this.querySelector('input[type="email"]').value

      // Basic email validation
      if (!email || !email.includes("@")) {
        e.preventDefault()
        alert("Please enter a valid email address.")
        return
      }

      // Add loading state
      const button = this.querySelector(".newsletter-button")
      const originalText = button.textContent
      button.textContent = "Subscribing..."
      button.disabled = true

      // Reset after form submission (for demo purposes)
      setTimeout(() => {
        button.textContent = originalText
        button.disabled = false
      }, 2000)
    })
  }

  // Social link tracking
  const socialLinks = document.querySelectorAll(".social-link")
  socialLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const platform = this.getAttribute("aria-label").replace("Follow us on ", "")
      console.log(`Social link clicked: ${platform}`)
    })
  })

  // Responsive menu handling
  function handleResponsiveFooter() {
    const isMobile = window.innerWidth < 768
    const footerMain = document.querySelector(".footer-main")

    if (isMobile) {
      footerMain.style.gridTemplateColumns = "1fr"
    } else {
      footerMain.style.gridTemplateColumns = ""
    }
  }

  // Throttled resize handler
  let resizeTimeout
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(handleResponsiveFooter, 150)
  })

  // Initial call
  handleResponsiveFooter()
})

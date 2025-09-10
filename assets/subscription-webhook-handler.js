/**
 * Subscription Webhook Handler
 * Handles Shopify subscription webhooks to update customer metafields
 * This should be implemented as a serverless function or backend service
 */

class SubscriptionWebhookHandler {
  constructor() {
    this.shopifyApiVersion = "2024-01"
    this.metafieldNamespace = "subscription"
  }

  /**
   * Handle subscription creation webhook
   */
  async handleSubscriptionCreated(webhookData) {
    console.log("🔍 WEBHOOK - Subscription created:", webhookData)

    try {
      const subscription = webhookData
      const customerId = subscription.customer_id

      // Update customer metafields
      await this.updateCustomerSubscriptionStatus(customerId, {
        status: "active",
        type: this.getSubscriptionType(subscription),
        plan_id: subscription.selling_plan_id,
        created_at: subscription.created_at,
        next_billing_date: subscription.next_billing_date,
        expires_at: this.calculateExpirationDate(subscription),
      })

      console.log("✅ WEBHOOK - Customer subscription status updated")

      // Send welcome email or trigger other actions
      await this.triggerWelcomeActions(customerId, subscription)
    } catch (error) {
      console.error("❌ WEBHOOK ERROR - Failed to handle subscription creation:", error)
      throw error
    }
  }

  /**
   * Handle subscription updated webhook
   */
  async handleSubscriptionUpdated(webhookData) {
    console.log("🔍 WEBHOOK - Subscription updated:", webhookData)

    try {
      const subscription = webhookData
      const customerId = subscription.customer_id

      // Determine new status
      let status = "active"
      if (subscription.status === "cancelled" || subscription.status === "expired") {
        status = "inactive"
      } else if (subscription.status === "paused") {
        status = "paused"
      }

      // Update customer metafields
      await this.updateCustomerSubscriptionStatus(customerId, {
        status: status,
        type: this.getSubscriptionType(subscription),
        plan_id: subscription.selling_plan_id,
        updated_at: new Date().toISOString(),
        next_billing_date: subscription.next_billing_date,
        expires_at: this.calculateExpirationDate(subscription),
      })

      console.log("✅ WEBHOOK - Customer subscription status updated")
    } catch (error) {
      console.error("❌ WEBHOOK ERROR - Failed to handle subscription update:", error)
      throw error
    }
  }

  /**
   * Handle subscription cancelled webhook
   */
  async handleSubscriptionCancelled(webhookData) {
    console.log("🔍 WEBHOOK - Subscription cancelled:", webhookData)

    try {
      const subscription = webhookData
      const customerId = subscription.customer_id

      // Update customer metafields
      await this.updateCustomerSubscriptionStatus(customerId, {
        status: "cancelled",
        type: this.getSubscriptionType(subscription),
        plan_id: subscription.selling_plan_id,
        cancelled_at: new Date().toISOString(),
        expires_at: this.calculateGracePeriodEnd(subscription),
      })

      console.log("✅ WEBHOOK - Customer subscription cancelled")

      // Send cancellation email or trigger other actions
      await this.triggerCancellationActions(customerId, subscription)
    } catch (error) {
      console.error("❌ WEBHOOK ERROR - Failed to handle subscription cancellation:", error)
      throw error
    }
  }

  /**
   * Update customer metafields via Shopify Admin API
   */
  async updateCustomerSubscriptionStatus(customerId, subscriptionData) {
    const metafields = []

    // Create metafield for each piece of subscription data
    Object.keys(subscriptionData).forEach((key) => {
      if (subscriptionData[key] !== null && subscriptionData[key] !== undefined) {
        metafields.push({
          namespace: this.metafieldNamespace,
          key: key,
          value: String(subscriptionData[key]),
          type: this.getMetafieldType(key, subscriptionData[key]),
        })
      }
    })

    // Batch update metafields
    for (const metafield of metafields) {
      await this.createOrUpdateMetafield(customerId, metafield)
    }
  }

  /**
   * Create or update a customer metafield
   */
  async createOrUpdateMetafield(customerId, metafield) {
    try {
      const response = await fetch(
        `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/${this.shopifyApiVersion}/customers/${customerId}/metafields.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
          },
          body: JSON.stringify({ metafield }),
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to update metafield: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ METAFIELD - Updated ${metafield.namespace}.${metafield.key} for customer ${customerId}`)
      return result
    } catch (error) {
      console.error(`❌ METAFIELD ERROR - Failed to update ${metafield.namespace}.${metafield.key}:`, error)
      throw error
    }
  }

  /**
   * Determine subscription type from subscription data
   */
  getSubscriptionType(subscription) {
    // Map selling plan IDs to subscription types
    const planTypeMap = {
      690984845681: "monthly",
      // Add other selling plan IDs here
    }

    return planTypeMap[subscription.selling_plan_id] || "unknown"
  }

  /**
   * Calculate subscription expiration date
   */
  calculateExpirationDate(subscription) {
    if (subscription.next_billing_date) {
      // Add grace period (e.g., 7 days after next billing date)
      const nextBilling = new Date(subscription.next_billing_date)
      nextBilling.setDate(nextBilling.getDate() + 7)
      return nextBilling.toISOString()
    }

    // Fallback: 30 days from now
    const fallback = new Date()
    fallback.setDate(fallback.getDate() + 30)
    return fallback.toISOString()
  }

  /**
   * Calculate grace period end for cancelled subscriptions
   */
  calculateGracePeriodEnd(subscription) {
    // Give 30 days of access after cancellation
    const gracePeriod = new Date()
    gracePeriod.setDate(gracePeriod.getDate() + 30)
    return gracePeriod.toISOString()
  }

  /**
   * Get appropriate metafield type
   */
  getMetafieldType(key, value) {
    if (key.includes("_at") || key.includes("date")) {
      return "date_time"
    }
    if (key === "plan_id") {
      return "number_integer"
    }
    return "single_line_text_field"
  }

  /**
   * Trigger welcome actions for new subscribers
   */
  async triggerWelcomeActions(customerId, subscription) {
    console.log("🎉 WELCOME - Triggering welcome actions for customer:", customerId)

    // Add welcome actions here:
    // - Send welcome email
    // - Add to subscriber email list
    // - Grant access to exclusive content
    // - Create customer tags

    try {
      // Example: Add customer tag
      await this.addCustomerTag(customerId, "subscriber")
      await this.addCustomerTag(customerId, `subscription-${this.getSubscriptionType(subscription)}`)
    } catch (error) {
      console.error("❌ WELCOME ERROR - Failed to trigger welcome actions:", error)
    }
  }

  /**
   * Trigger cancellation actions
   */
  async triggerCancellationActions(customerId, subscription) {
    console.log("😢 CANCELLATION - Triggering cancellation actions for customer:", customerId)

    // Add cancellation actions here:
    // - Send cancellation confirmation email
    // - Remove from subscriber email list (after grace period)
    // - Send feedback survey

    try {
      // Example: Add cancellation tag
      await this.addCustomerTag(customerId, "subscription-cancelled")
    } catch (error) {
      console.error("❌ CANCELLATION ERROR - Failed to trigger cancellation actions:", error)
    }
  }

  /**
   * Add tag to customer
   */
  async addCustomerTag(customerId, tag) {
    try {
      // First get current customer data
      const customerResponse = await fetch(
        `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/${this.shopifyApiVersion}/customers/${customerId}.json`,
        {
          headers: {
            "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
          },
        },
      )

      if (!customerResponse.ok) {
        throw new Error("Failed to fetch customer data")
      }

      const customerData = await customerResponse.json()
      const currentTags = customerData.customer.tags ? customerData.customer.tags.split(", ") : []

      // Add new tag if not already present
      if (!currentTags.includes(tag)) {
        currentTags.push(tag)

        // Update customer with new tags
        const updateResponse = await fetch(
          `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/${this.shopifyApiVersion}/customers/${customerId}.json`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
            },
            body: JSON.stringify({
              customer: {
                id: customerId,
                tags: currentTags.join(", "),
              },
            }),
          },
        )

        if (!updateResponse.ok) {
          throw new Error("Failed to update customer tags")
        }

        console.log(`✅ TAG - Added "${tag}" to customer ${customerId}`)
      }
    } catch (error) {
      console.error(`❌ TAG ERROR - Failed to add tag "${tag}" to customer ${customerId}:`, error)
    }
  }
}

// Export for use in serverless functions or Node.js backend
if (typeof module !== "undefined" && module.exports) {
  module.exports = SubscriptionWebhookHandler
}

// Browser-compatible version for theme development
if (typeof window !== "undefined") {
  window.SubscriptionWebhookHandler = SubscriptionWebhookHandler
}

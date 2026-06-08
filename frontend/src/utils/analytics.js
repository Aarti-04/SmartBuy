// analytics.js
export function trackRedirect({ productName, platform, price, city }) {
  // TODO: connect to PostHog / Mixpanel / GA4 in future development
  console.log('[BasketAI Redirect]', { productName, platform, price, city });
}

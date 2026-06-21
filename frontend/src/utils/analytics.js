// analytics.js
export function trackRedirect({ productName, platform, price, city }) {
  // TODO: connect to PostHog / Mixpanel / GA4 in future development
  console.log('[SmartBuy Redirect]', { productName, platform, price, city });
}

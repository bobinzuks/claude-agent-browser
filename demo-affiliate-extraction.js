#!/usr/bin/env node

/**
 * Demo: Affiliate Link Extraction
 * Quick demo to extract affiliate links without full TypeScript build
 */

console.log('🚀 Affiliate Link Extraction Demo\n');

// Simulate network detection
function detectNetwork(url) {
  const networks = {
    'shareasale.com': { id: 'shareasale', name: 'ShareASale', tosLevel: 1 },
    'cj.com': { id: 'cj', name: 'CJ Affiliate', tosLevel: 2 },
    'impact.com': { id: 'impact', name: 'Impact.com', tosLevel: 1 },
    'partnerstack.com': { id: 'partnerstack', name: 'PartnerStack', tosLevel: 0 }
  };

  for (const [domain, config] of Object.entries(networks)) {
    if (url.includes(domain)) {
      return config;
    }
  }
  return null;
}

// Simulate link extraction from HTML
function extractAffiliateLinks(html, networkId) {
  const links = [];

  // Simple regex-based extraction (real implementation uses DOM parsing)
  const linkPatterns = {
    shareasale: /https?:\/\/www\.shareasale\.com\/r\.cfm\?[^"'\s]+/g,
    cj: /https?:\/\/www\.anrdoezrs\.net\/[^"'\s]+/g,
    impact: /https?:\/\/[^"'\s]*impact[^"'\s]*\.com\/[^"'\s]+/g,
    partnerstack: /https?:\/\/[^"'\s]*partnerstack[^"'\s]*\.com\/[^"'\s]+/g
  };

  const pattern = linkPatterns[networkId];
  if (pattern) {
    const matches = html.match(pattern) || [];
    matches.forEach((url, index) => {
      links.push({
        id: `${networkId}-${index}`,
        url: url,
        networkId: networkId,
        extractedAt: new Date().toISOString(),
        metadata: {}
      });
    });
  }

  return links;
}

// Simulate deep link generation
function generateDeepLink(targetUrl, networkId, affiliateId) {
  const templates = {
    shareasale: `https://www.shareasale.com/r.cfm?affID=${affiliateId}&urllink=${encodeURIComponent(targetUrl)}`,
    cj: `https://www.anrdoezrs.net/click-${affiliateId}/URL?url=${encodeURIComponent(targetUrl)}`,
    impact: `https://impact.com/campaign/redirect?campaignId=${affiliateId}&url=${encodeURIComponent(targetUrl)}`,
    partnerstack: `https://partnerstack.com/referral/${affiliateId}?redirect=${encodeURIComponent(targetUrl)}`
  };

  return templates[networkId] || targetUrl;
}

// Demo 1: Network Detection
console.log('📍 Demo 1: Network Detection');
console.log('─────────────────────────────\n');

const testUrls = [
  'https://account.shareasale.com/dashboard',
  'https://members.cj.com/member/login',
  'https://app.impact.com/login',
  'https://app.partnerstack.com/dashboard'
];

testUrls.forEach(url => {
  const network = detectNetwork(url);
  if (network) {
    console.log(`✅ ${url}`);
    console.log(`   → Network: ${network.name} (ToS Level: ${network.tosLevel})`);
    console.log(`   → ID: ${network.id}\n`);
  }
});

// Demo 2: Link Extraction
console.log('\n🔗 Demo 2: Link Extraction from HTML');
console.log('─────────────────────────────────────\n');

const mockShareASaleHTML = `
<html>
  <div class="affiliate-links">
    <a href="https://www.shareasale.com/r.cfm?affID=12345&urllink=https://example.com/product1">Product 1</a>
    <a href="https://www.shareasale.com/r.cfm?affID=12345&urllink=https://example.com/product2">Product 2</a>
    <a href="https://www.shareasale.com/r.cfm?affID=12345&urllink=https://example.com/product3">Product 3</a>
  </div>
</html>
`;

const extractedLinks = extractAffiliateLinks(mockShareASaleHTML, 'shareasale');
console.log(`Found ${extractedLinks.length} affiliate links:\n`);

extractedLinks.forEach((link, index) => {
  console.log(`${index + 1}. ${link.url}`);
  console.log(`   Network: ${link.networkId}`);
  console.log(`   Extracted: ${link.extractedAt}\n`);
});

// Demo 3: Deep Link Generation
console.log('\n🌐 Demo 3: Deep Link Generation');
console.log('────────────────────────────────\n');

const merchantUrls = [
  { url: 'https://example-shop.com/product/123', name: 'Product 123' },
  { url: 'https://another-store.com/item/456', name: 'Item 456' }
];

const networks = ['shareasale', 'cj', 'partnerstack'];

networks.forEach(networkId => {
  console.log(`Network: ${networkId.toUpperCase()}`);
  merchantUrls.forEach(product => {
    const affiliateLink = generateDeepLink(product.url, networkId, 'DEMO123');
    console.log(`  ${product.name}:`);
    console.log(`  ${affiliateLink}\n`);
  });
});

// Demo 4: Live Browser Test (requires Playwright)
console.log('\n🌐 Demo 4: Live Browser Test');
console.log('─────────────────────────────\n');

console.log('To extract links from a real affiliate network:');
console.log('');
console.log('1. Install Playwright: npm install playwright');
console.log('2. Run the live demo: node demo-affiliate-live.js');
console.log('');
console.log('Or use the MCP bridge:');
console.log('');
console.log('  npm start  # Start MCP server');
console.log('  # Then in Claude Code:');
console.log('  # mcp_tool_affiliate_detect_network({ url: "https://shareasale.com" })');
console.log('  # mcp_tool_affiliate_extract_links({ maxLinks: 10 })');

console.log('\n✅ Demo Complete!\n');
console.log('Next steps:');
console.log('1. Set up your affiliate network credentials');
console.log('2. Navigate to an affiliate dashboard');
console.log('3. Use the MCP tools to extract links automatically');
console.log('');
console.log('📚 See AFFILIATE-AUTOMATION-GUIDE.md for full documentation\n');

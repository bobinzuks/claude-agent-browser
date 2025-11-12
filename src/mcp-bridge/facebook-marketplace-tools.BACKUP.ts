/**
 * Facebook Marketplace Automation Tools
 * Specialized tools for scraping Facebook Marketplace listings
 */

import { BrowserController } from './browser-controller.js';

export interface MarketplaceListing {
  listingId: string;
  title: string;
  price: number;
  currency: string;
  daysListed: number | null;
  location: string;
  url: string;
  imageUrl?: string;
  extractedAt: number;
}

export interface MarketplaceSearchParams {
  product: string;
  location: string;
  maxListings?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface BatchSearchParams {
  product: string;
  locations: Array<{ city: string; state?: string; province?: string }>;
  maxListingsPerLocation?: number;
  parallel?: boolean;
  maxConcurrent?: number;
}

export interface BatchSearchResult {
  success: boolean;
  totalLocations: number;
  successfulLocations: number;
  failedLocations: number;
  results: Array<{
    location: string;
    listings: MarketplaceListing[];
    error?: string;
  }>;
  duration: number;
  startTime: number;
  endTime: number;
}

export class FacebookMarketplaceTools {
  private browserController: BrowserController;

  constructor(browserController: BrowserController) {
    this.browserController = browserController;
  }

  /**
   * Build Facebook Marketplace URL for search
   */
  private buildMarketplaceURL(params: MarketplaceSearchParams): string {
    const citySlugMap: Record<string, string> = {
      Seattle: 'seattle',
      Portland: 'portland',
      Vancouver: 'vancouver',
      Toronto: 'toronto',
      Calgary: 'calgary',
      Montreal: 'montreal',
      'New York': 'newyork',
      'Los Angeles': 'losangeles',
      Chicago: 'chicago',
      Houston: 'houston',
      Phoenix: 'phoenix',
      Philadelphia: 'philadelphia',
      'San Antonio': 'sanantonio',
      'San Diego': 'sandiego',
      Dallas: 'dallas',
      'San Jose': 'sanjose',
    };

    const citySlug =
      citySlugMap[params.location] ||
      params.location.toLowerCase().replace(/\s+/g, '');

    const urlParams = new URLSearchParams({
      query: params.product,
      exact: 'false',
    });

    if (params.minPrice) {
      urlParams.append('minPrice', params.minPrice.toString());
    }

    if (params.maxPrice) {
      urlParams.append('maxPrice', params.maxPrice.toString());
    }

    return `https://www.facebook.com/marketplace/${citySlug}/search/?${urlParams}`;
  }

  /**
   * Extract listings from current page using JavaScript
   */
  private getExtractionScript(maxListings = 10): string {
    return `
      (() => {
        const maxListings = ${maxListings};
        const listings = [];
        const links = document.querySelectorAll('a[href*="/marketplace/item/"]');

        for (let i = 0; i < Math.min(links.length, maxListings); i++) {
          const link = links[i];

          // Extract listing ID
          const idMatch = link.href.match(/\\/marketplace\\/item\\/(\\d+)/);
          if (!idMatch) continue;

          // Extract title
          const titleSpans = link.querySelectorAll('span[dir="auto"]');
          let title = '';
          for (const span of titleSpans) {
            const text = span.textContent.trim();
            if (text.length > 3 && !text.match(/\\$/) && !text.toLowerCase().includes('listed')) {
              title = text;
              break;
            }
          }

          // Extract price and currency
          const priceMatch = link.textContent.match(/(CA?|US)?\\$([\\d,]+)(?:\\.\\d{2})?/);
          let price = null;
          let currency = 'USD';
          if (priceMatch) {
            currency = priceMatch[1] === 'CA' ? 'CAD' : 'USD';
            price = parseFloat(priceMatch[2].replace(/,/g, ''));
          }

          // Extract days listed
          let daysListed = null;
          const allSpans = link.querySelectorAll('span');
          for (const span of allSpans) {
            const text = span.textContent.toLowerCase();
            if (text.includes('listed')) {
              if (text.includes('minute') || text.includes('hour') || text.includes('today')) {
                daysListed = 0;
              } else if (text.includes('yesterday')) {
                daysListed = 1;
              } else {
                const dayMatch = text.match(/(\\d+)\\s*day/);
                if (dayMatch) daysListed = parseInt(dayMatch[1]);
              }
              break;
            }
          }

          // Extract image
          const img = link.querySelector('img');
          const imageUrl = img ? img.src : null;

          if (title && price !== null) {
            listings.push({
              listingId: idMatch[1],
              title: title,
              price: price,
              currency: currency,
              daysListed: daysListed,
              url: link.href,
              imageUrl: imageUrl,
              extractedAt: Date.now()
            });
          }
        }

        return listings;
      })();
    `;
  }

  /**
   * Search a single location
   */
  async searchLocation(params: MarketplaceSearchParams): Promise<MarketplaceListing[]> {
    const url = this.buildMarketplaceURL(params);

    try {
      // Create new page for this search
      const pageId = await this.browserController.newPage();

      // Navigate to marketplace
      await this.browserController.navigate(url, pageId);

      // Wait for listings to load
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Extract listings
      const result = await this.browserController.executeScript(
        this.getExtractionScript(params.maxListings || 10),
        pageId
      );

      // Close the page
      await this.browserController.closePage(pageId);

      if (result.success && Array.isArray(result.data)) {
        return result.data.map((listing: Partial<MarketplaceListing>) => ({
          ...listing,
          location: params.location,
        })) as MarketplaceListing[];
      }

      return [];
    } catch (error) {
      console.error(`[FacebookMarketplace] Error searching ${params.location}:`, error);
      throw error;
    }
  }

  /**
   * Search multiple locations in parallel
   */
  async batchSearch(params: BatchSearchParams): Promise<BatchSearchResult> {
    const startTime = Date.now();
    const maxConcurrent = params.maxConcurrent || 5;
    const results: BatchSearchResult['results'] = [];

    console.log(
      `[FacebookMarketplace] Starting batch search: ${params.product} in ${params.locations.length} locations`
    );

    // Process in batches
    for (let i = 0; i < params.locations.length; i += maxConcurrent) {
      const batch = params.locations.slice(i, i + maxConcurrent);

      console.log(
        `[FacebookMarketplace] Processing batch ${Math.floor(i / maxConcurrent) + 1}: ${batch.length} locations`
      );

      const batchPromises = batch.map(async (loc) => {
        const locationName = `${loc.city}, ${loc.state || loc.province || ''}`.trim();

        try {
          const listings = await this.searchLocation({
            product: params.product,
            location: loc.city,
            maxListings: params.maxListingsPerLocation || 10,
          });

          return {
            location: locationName,
            listings,
          };
        } catch (error) {
          return {
            location: locationName,
            listings: [],
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting between batches
      if (i + maxConcurrent < params.locations.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const endTime = Date.now();
    const successfulLocations = results.filter((r) => !r.error).length;
    const failedLocations = results.filter((r) => r.error).length;

    console.log(
      `[FacebookMarketplace] Batch search complete: ${successfulLocations}/${params.locations.length} successful`
    );

    return {
      success: true,
      totalLocations: params.locations.length,
      successfulLocations,
      failedLocations,
      results,
      duration: endTime - startTime,
      startTime,
      endTime,
    };
  }

  /**
   * Get statistics from batch search results
   */
  static getStatistics(batchResult: BatchSearchResult): {
    totalListings: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    locationsWithResults: number;
  } {
    const allListings = batchResult.results.flatMap((r) => r.listings);

    const prices = allListings.map((l) => l.price).filter((p) => p > 0);

    return {
      totalListings: allListings.length,
      averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      locationsWithResults: batchResult.results.filter((r) => r.listings.length > 0).length,
    };
  }
}

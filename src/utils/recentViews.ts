import { Product } from "../types";

const RECENTLY_VIEWED_KEY = "recently_viewed_products";
const MAX_RECENT_ITEMS = 8;

export function addRecentlyViewed(productId: string) {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    let viewedIds: string[] = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists to move to top
    viewedIds = viewedIds.filter(id => id !== productId);
    
    // Add to front
    viewedIds.unshift(productId);
    
    // Limit size
    if (viewedIds.length > MAX_RECENT_ITEMS) {
      viewedIds = viewedIds.slice(0, MAX_RECENT_ITEMS);
    }
    
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(viewedIds));
  } catch (error) {
    console.error("Error saving to recently viewed:", error);
  }
}

export function getRecentlyViewedIds(): string[] {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading recently viewed:", error);
    return [];
  }
}

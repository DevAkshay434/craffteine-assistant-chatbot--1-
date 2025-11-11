import flavorsData from '../data/flavors.json';
import powdersData from '../data/powders.json';

export interface Flavor {
  id: string;
  name: string;
  availableFor: string[];
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  category: string;
  sortOrder: number;
}

export interface Powder {
  id: string;
  name: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  type: string;
  sortOrder: number;
}

export class InventoryService {
  private flavors: Flavor[];
  private powders: Powder[];
  
  constructor() {
    this.flavors = flavorsData.flavors as Flavor[];
    this.powders = powdersData.powders as Powder[];
  }
  
  // Get all in-stock flavors for Stick Packs
  getStickPackFlavors(): Flavor[] {
    return this.flavors.filter(f => 
      f.availableFor.includes('stickPack') && 
      f.status === 'in_stock'
    );
  }
  
  // Get all in-stock powders
  getInStockPowders(): Powder[] {
    return this.powders.filter(p => p.status === 'in_stock');
  }
  
  // Check if a flavor is in stock
  isFlavorInStock(flavorName: string): boolean {
    const normalized = flavorName.toLowerCase().trim();
    return this.flavors.some(f => 
      f.name.toLowerCase().includes(normalized) && 
      f.status === 'in_stock'
    );
  }
  
  // Check if a powder is in stock
  isPowderInStock(powderName: string): boolean {
    const normalized = powderName.toLowerCase().trim();
    return this.powders.some(p => 
      p.name.toLowerCase().includes(normalized) && 
      p.status === 'in_stock'
    );
  }
  
  // Get flavor names formatted for AI prompt
  getFlavorListForPrompt(): string {
    const flavors = this.getStickPackFlavors();
    return flavors.map(f => f.name.replace(' Flavor Powder', '')).join(', ');
  }
  
  // Get max flavor selections (always 2 for stick packs)
  getMaxFlavorSelections(): number {
    return flavorsData.maxSelectionsPerFormula;
  }
  
  // Get inventory summary for AI
  getInventorySummary(): string {
    const inStockFlavors = this.getStickPackFlavors().length;
    const inStockPowders = this.getInStockPowders().length;
    const lastUpdated = new Date(flavorsData.lastUpdated).toLocaleDateString();
    
    return `Inventory (Updated: ${lastUpdated}): ${inStockFlavors} flavors, ${inStockPowders} ingredient powders in stock.`;
  }
}

// Singleton instance
export const inventoryService = new InventoryService();

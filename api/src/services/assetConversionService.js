const axios = require('axios');

class AssetConversionService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached price or fetch new one
  async getPrice(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.price;
    }

    try {
      const price = await fetchFunction();
      this.cache.set(key, { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      console.error(`Error fetching price for ${key}:`, error);
      // Return cached value if available, otherwise return 0
      return cached ? cached.price : 0;
    }
  }

  // Get gold price from Turkish gold API
  async getGoldPriceTRY(karat = 24) {
    const key = `gold_${karat}_TRY`;

    return this.getPrice(key, async () => {
      try {
        const response = await axios.get('https://finans.truncgil.com/today.json', {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const goldData = response.data;
        let price24k = 0;

        // Try to get gram gold price (24k)
        if (goldData['gram-altin'] && goldData['gram-altin'].Satış) {
          // Turkish number format: dot (.) is thousands separator, comma (,) is decimal separator
          // Example: "5.540,56" means 5540.56
          const priceStr = goldData['gram-altin'].Satış
            .replace(/\./g, '')  // Remove thousands separator (dot)
            .replace(',', '.')   // Convert decimal separator (comma to dot)
            .replace(/[^\d\.]/g, ''); // Remove any remaining non-numeric characters
          price24k = parseFloat(priceStr) || 0;
        }

        if (price24k > 0) {
          // Calculate price for different karats
          const karatPrice = (karat / 24) * price24k;
          return Math.round(karatPrice * 100) / 100;
        }

        // Fallback to estimated price if API fails
        console.warn('Gold price API returned invalid data, using fallback price');
        const fallbackPrice24k = 5500; // Approximate 24k gold price in TRY (updated for 2025)
        const karatPrice = (karat / 24) * fallbackPrice24k;
        return Math.round(karatPrice * 100) / 100;

      } catch (error) {
        console.error('Error in getGoldPriceTRY:', error);
        // Return fallback price on error
        const fallbackPrice24k = 5500;
        const karatPrice = (karat / 24) * fallbackPrice24k;
        return Math.round(karatPrice * 100) / 100;
      }
    });
  }

  // Get silver price from API
  async getSilverPriceTRY() {
    const key = 'silver_TRY';

    return this.getPrice(key, async () => {
      try {
        const response = await axios.get('https://finans.truncgil.com/today.json', {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const data = response.data;

        // Look for silver data (gümüş)
        if (data.gumus && data.gumus.Satış) {
          // Turkish number format: dot is thousands separator, comma is decimal separator
          const priceStr = data.gumus.Satış
            .replace(/\./g, '')  // Remove thousands separator
            .replace(',', '.')   // Convert decimal separator
            .replace(/[^\d\.]/g, ''); // Remove any remaining non-numeric characters
          const silverPrice = parseFloat(priceStr) || 0;
          if (silverPrice > 0) {
            return silverPrice;
          }
        }

        // Fallback: approximate silver price (usually 1/85 of gold)
        const goldPrice = await this.getGoldPriceTRY(24);
        return Math.round((goldPrice / 85) * 100) / 100;
      } catch (error) {
        console.error('Error in getSilverPriceTRY:', error);
        // Fallback to approximate silver price
        const goldPrice = await this.getGoldPriceTRY(24);
        return Math.round((goldPrice / 85) * 100) / 100;
      }
    });
  }

  // Convert crypto to TRY (placeholder - you can integrate with crypto APIs)
  async getCryptoPriceTRY(symbol) {
    const key = `crypto_${symbol}_TRY`;

    return this.getPrice(key, async () => {
      // This is a placeholder - integrate with CoinGecko, Binance, etc.
      // For now, return 0 to avoid errors
      console.warn(`Crypto conversion for ${symbol} not implemented yet`);
      return 0;
    });
  }

  // Main conversion function
  async convertToTRY(asset) {
    const { assetType, unit, currentAmount, targetAmount, goldKarat } = asset;

    switch (assetType) {
      case 'currency':
        if (unit === 'TRY') {
          return {
            currentValueTRY: currentAmount,
            targetValueTRY: targetAmount,
            conversionRate: 1
          };
        }
        // Add other currency conversions here (USD, EUR, etc.)
        return {
          currentValueTRY: 0,
          targetValueTRY: 0,
          conversionRate: 0
        };

      case 'gold':
        const goldPrice = await this.getGoldPriceTRY(goldKarat || 24);
        return {
          currentValueTRY: currentAmount * goldPrice,
          targetValueTRY: targetAmount * goldPrice,
          conversionRate: goldPrice
        };

      case 'silver':
        const silverPrice = await this.getSilverPriceTRY();
        return {
          currentValueTRY: currentAmount * silverPrice,
          targetValueTRY: targetAmount * silverPrice,
          conversionRate: silverPrice
        };

      case 'crypto':
        const cryptoPrice = await this.getCryptoPriceTRY(unit);
        return {
          currentValueTRY: currentAmount * cryptoPrice,
          targetValueTRY: targetAmount * cryptoPrice,
          conversionRate: cryptoPrice
        };

      default:
        return {
          currentValueTRY: 0,
          targetValueTRY: 0,
          conversionRate: 0
        };
    }
  }

  // Convert multiple assets
  async convertAssetsToTRY(assets) {
    const conversions = await Promise.all(
      assets.map(asset => this.convertToTRY(asset))
    );

    const totalCurrent = conversions.reduce((sum, conv) => sum + conv.currentValueTRY, 0);
    const totalTarget = conversions.reduce((sum, conv) => sum + conv.targetValueTRY, 0);

    return {
      totalCurrentTRY: Math.round(totalCurrent * 100) / 100,
      totalTargetTRY: Math.round(totalTarget * 100) / 100,
      conversions
    };
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new AssetConversionService();
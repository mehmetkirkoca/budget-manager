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
        // Try multiple Turkish gold price APIs
        const apis = [
          'https://finans.truncgil.com/v4/today.json',
          'https://api.genelpara.com/today.json',
          'https://api.doviz.com/v1/golds'
        ];

        for (const apiUrl of apis) {
          try {
            const response = await axios.get(apiUrl, {
              timeout: 5000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });

            let price24k = 0;

            if (apiUrl.includes('truncgil')) {
              const goldData = response.data;
              if (goldData.GRA && goldData.GRA.Selling) {
                price24k = parseFloat(goldData.GRA.Selling) || 0;
              } else if (goldData.gram_altin) {
                price24k = parseFloat(goldData.gram_altin.satis) || 0;
              }
            } else if (apiUrl.includes('genelpara')) {
              const goldData = response.data;
              if (goldData.GAC) {
                price24k = parseFloat(goldData.GAC.satis) || 0;
              }
            } else if (apiUrl.includes('doviz')) {
              const goldData = response.data;
              if (goldData && Array.isArray(goldData)) {
                const gramGold = goldData.find(item => item.name === 'Gram Altın');
                if (gramGold) {
                  price24k = parseFloat(gramGold.selling) || 0;
                }
              }
            }

            if (price24k > 0) {
              // Calculate price for different karats
              const karatPrice = (karat / 24) * price24k;
              return Math.round(karatPrice * 100) / 100;
            }
          } catch (apiError) {
            console.warn(`API ${apiUrl} failed:`, apiError.message);
            continue;
          }
        }

        // Fallback to estimated price if APIs fail
        console.warn('All gold price APIs failed, using fallback price');
        const fallbackPrice24k = 2900; // Approximate 24k gold price in TRY
        const karatPrice = (karat / 24) * fallbackPrice24k;
        return Math.round(karatPrice * 100) / 100;

      } catch (error) {
        console.error('Error in getGoldPriceTRY:', error);
        throw error;
      }
    });
  }

  // Get silver price from API
  async getSilverPriceTRY() {
    const key = 'silver_TRY';

    return this.getPrice(key, async () => {
      const response = await axios.get('https://api.genelpara.com/embed/altin.json', {
        timeout: 5000
      });

      const data = response.data;

      // Look for silver data (usually GU - gümüş)
      if (data.GU && data.GU.satis) {
        return parseFloat(data.GU.satis) || 0;
      }

      // Fallback: approximate silver price (usually 1/80 of gold)
      const goldPrice = await this.getGoldPriceTRY(24);
      return Math.round((goldPrice / 80) * 100) / 100;
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
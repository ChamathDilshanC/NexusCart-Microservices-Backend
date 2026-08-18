import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';
import Settings from '../models/Settings';

// Public: Get currency settings (creates the singleton with defaults on first read)
export const getCurrencySettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({
      baseCurrency: settings.baseCurrency,
      supportedCurrencies: settings.supportedCurrencies
    });
  } catch (error) {
    console.error('getCurrencySettings error:', error);
    res.status(500).json({ message: 'Error fetching currency settings', error: (error as Error).message });
  }
};

// Admin: Update currency settings
export const updateCurrencySettings = async (req: AuthRequest, res: Response) => {
  try {
    const { baseCurrency, supportedCurrencies } = req.body;
    const update: Partial<{ baseCurrency: string; supportedCurrencies: string[] }> = {};
    if (typeof baseCurrency === 'string' && baseCurrency.trim()) update.baseCurrency = baseCurrency.trim().toUpperCase();
    if (Array.isArray(supportedCurrencies)) {
      update.supportedCurrencies = supportedCurrencies.map((c: string) => String(c).trim().toUpperCase()).filter(Boolean);
    }
    const settings = await Settings.findOneAndUpdate({}, update, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.status(200).json({
      message: 'Currency settings updated',
      baseCurrency: settings.baseCurrency,
      supportedCurrencies: settings.supportedCurrencies
    });
  } catch (error) {
    console.error('updateCurrencySettings error:', error);
    res.status(500).json({ message: 'Error updating currency settings', error: (error as Error).message });
  }
};

// In-memory exchange rate cache — the upstream API updates once a day, so
// there's no need to hit it on every page load.
const RATE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let rateCache: { base: string; rates: Record<string, number>; lastUpdated: string } | null = null;
let rateCacheFetchedAt = 0;

// Public: Get USD exchange rates (cached, falls back to stale/1:1 data if the
// upstream provider is unreachable so the storefront never breaks on this).
export const getExchangeRates = async (req: Request, res: Response) => {
  const isFresh = rateCache && Date.now() - rateCacheFetchedAt < RATE_CACHE_TTL_MS;
  if (isFresh) {
    return res.status(200).json(rateCache);
  }

  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 8000 });
    if (response.data && response.data.result === 'success') {
      rateCache = {
        base: response.data.base_code || 'USD',
        rates: response.data.rates,
        lastUpdated: response.data.time_last_update_utc || new Date().toISOString()
      };
      rateCacheFetchedAt = Date.now();
      return res.status(200).json(rateCache);
    }
    throw new Error('Unexpected exchange rate API response');
  } catch (error) {
    console.error('getExchangeRates error:', (error as Error).message);
    if (rateCache) {
      // Serve stale cache rather than failing the request.
      return res.status(200).json(rateCache);
    }
    return res.status(200).json({ base: 'USD', rates: { USD: 1 }, lastUpdated: null });
  }
};

#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { config } from 'dotenv';

config();

const API_URL = process.env.BUDGET_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to format currency
function formatCurrency(amount, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Helper function to format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Initialize server
const server = new Server(
  {
    name: 'budget-manager',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_expenses',
        description: 'Tüm harcamaları getirir. Kategoriye göre filtreleme yapabilir.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Kategoriye göre filtrele (opsiyonel)',
            },
          },
        },
      },
      {
        name: 'create_expense',
        description: 'Yeni bir harcama kaydı oluşturur.',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Harcama açıklaması',
            },
            amount: {
              type: 'number',
              description: 'Harcama tutarı',
            },
            category: {
              type: 'string',
              description: 'Harcama kategorisi',
            },
            date: {
              type: 'string',
              description: 'Harcama tarihi (YYYY-MM-DD formatında)',
            },
          },
          required: ['description', 'amount', 'category'],
        },
      },
      {
        name: 'get_assets',
        description: 'Tüm varlıkları getirir.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_asset',
        description: 'Yeni bir varlık oluşturur.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Varlık adı',
            },
            type: {
              type: 'string',
              description: 'Varlık tipi (savings, investment, property, crypto, other)',
            },
            currentValue: {
              type: 'number',
              description: 'Mevcut değer',
            },
            targetValue: {
              type: 'number',
              description: 'Hedef değer (opsiyonel)',
            },
            currency: {
              type: 'string',
              description: 'Para birimi (TRY, USD, EUR, vb.)',
            },
          },
          required: ['name', 'type', 'currentValue', 'currency'],
        },
      },
      {
        name: 'get_summary',
        description: 'Finansal özet bilgileri getirir (toplam gelir, gider, bakiye vb.)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_expenses_by_category',
        description: 'Harcamaları kategorilere göre gruplar ve toplamları döndürür.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'update_expense',
        description: 'Var olan bir harcamayı günceller.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Güncellenecek harcamanın ID\'si',
            },
            description: {
              type: 'string',
              description: 'Harcama açıklaması',
            },
            amount: {
              type: 'number',
              description: 'Harcama tutarı',
            },
            category: {
              type: 'string',
              description: 'Harcama kategorisi',
            },
            date: {
              type: 'string',
              description: 'Harcama tarihi (YYYY-MM-DD formatında)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_expense',
        description: 'Bir harcamayı siler.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Silinecek harcamanın ID\'si',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'update_asset',
        description: 'Var olan bir varlığı günceller.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Güncellenecek varlığın ID\'si',
            },
            name: {
              type: 'string',
              description: 'Varlık adı',
            },
            type: {
              type: 'string',
              description: 'Varlık tipi',
            },
            currentValue: {
              type: 'number',
              description: 'Mevcut değer',
            },
            targetValue: {
              type: 'number',
              description: 'Hedef değer',
            },
            currency: {
              type: 'string',
              description: 'Para birimi',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_asset',
        description: 'Bir varlığı siler.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Silinecek varlığın ID\'si',
            },
          },
          required: ['id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_expenses': {
        const response = await api.get('/expenses');
        let expenses = response.data;

        if (args.category) {
          expenses = expenses.filter(
            (exp) => exp.category.toLowerCase() === args.category.toLowerCase()
          );
        }

        const formatted = expenses.map((exp) => ({
          id: exp._id,
          açıklama: exp.description,
          tutar: formatCurrency(exp.amount, exp.currency || 'TRY'),
          kategori: exp.category,
          tarih: formatDate(exp.date),
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Toplam ${formatted.length} harcama bulundu:\n\n${JSON.stringify(formatted, null, 2)}`,
            },
          ],
        };
      }

      case 'create_expense': {
        const expenseData = {
          description: args.description,
          amount: args.amount,
          category: args.category,
          date: args.date || new Date().toISOString(),
        };

        const response = await api.post('/expenses', expenseData);

        return {
          content: [
            {
              type: 'text',
              text: `Yeni harcama başarıyla oluşturuldu:\n\nAçıklama: ${response.data.description}\nTutar: ${formatCurrency(response.data.amount)}\nKategori: ${response.data.category}\nTarih: ${formatDate(response.data.date)}`,
            },
          ],
        };
      }

      case 'get_assets': {
        const response = await api.get('/assets');
        const assets = response.data;

        const formatted = assets.map((asset) => ({
          id: asset._id,
          ad: asset.name,
          tip: asset.type,
          mevcutDeğer: formatCurrency(asset.currentValueTRY ?? asset.currentAmount ?? 0),
          hedefDeğer: asset.targetValueTRY || asset.targetAmount
            ? formatCurrency(asset.targetValueTRY ?? asset.targetAmount ?? 0)
            : 'Yok',
          ilerleme: asset.targetValueTRY || asset.targetAmount
            ? `%${(((asset.currentValueTRY ?? asset.currentAmount ?? 0) / (asset.targetValueTRY ?? asset.targetAmount ?? 1)) * 100).toFixed(1)}`
            : 'N/A',
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Toplam ${formatted.length} varlık bulundu:\n\n${JSON.stringify(formatted, null, 2)}`,
            },
          ],
        };
      }

      case 'create_asset': {
        const assetData = {
          name: args.name,
          type: args.type,
          currentValue: args.currentValue,
          targetValue: args.targetValue,
          currency: args.currency,
        };

        const response = await api.post('/assets', assetData);

        return {
          content: [
            {
              type: 'text',
              text: `Yeni varlık başarıyla oluşturuldu:\n\nAd: ${response.data.name}\nTip: ${response.data.type}\nMevcut Değer: ${formatCurrency(response.data.currentAmount ?? 0)}${response.data.targetAmount ? `\nHedef Değer: ${formatCurrency(response.data.targetAmount)}` : ''}`,
            },
          ],
        };
      }

      case 'get_summary': {
        const response = await api.get('/summary');
        const summary = response.data;

        return {
          content: [
            {
              type: 'text',
              text: `Finansal Özet:\n\nToplam Gelir: ${formatCurrency(summary.totalIncome || 0)}\nToplam Gider: ${formatCurrency(summary.totalExpense || 0)}\nBakiye: ${formatCurrency(summary.balance || 0)}\nToplam Varlıklar: ${formatCurrency(summary.totalAssets || 0)}`,
            },
          ],
        };
      }

      case 'get_expenses_by_category': {
        const response = await api.get('/expenses/by-category');
        const categories = response.data;

        const formatted = categories.map((cat) => ({
          kategori: cat._id,
          toplamTutar: formatCurrency(cat.total),
          harcamaSayısı: cat.count,
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Kategorilere Göre Harcamalar:\n\n${JSON.stringify(formatted, null, 2)}`,
            },
          ],
        };
      }

      case 'update_expense': {
        const { id, ...updateData } = args;
        const response = await api.put(`/expenses/${id}`, updateData);

        return {
          content: [
            {
              type: 'text',
              text: `Harcama başarıyla güncellendi:\n\nAçıklama: ${response.data.description}\nTutar: ${formatCurrency(response.data.amount)}\nKategori: ${response.data.category}`,
            },
          ],
        };
      }

      case 'delete_expense': {
        await api.delete(`/expenses/${args.id}`);

        return {
          content: [
            {
              type: 'text',
              text: `ID: ${args.id} olan harcama başarıyla silindi.`,
            },
          ],
        };
      }

      case 'update_asset': {
        const { id, ...updateData } = args;
        const response = await api.put(`/assets/${id}`, updateData);

        return {
          content: [
            {
              type: 'text',
              text: `Varlık başarıyla güncellendi:\n\nAd: ${response.data.name}\nTip: ${response.data.type}\nMevcut Değer: ${formatCurrency(response.data.currentAmount ?? 0)}`,
            },
          ],
        };
      }

      case 'delete_asset': {
        await api.delete(`/assets/${args.id}`);

        return {
          content: [
            {
              type: 'text',
              text: `ID: ${args.id} olan varlık başarıyla silindi.`,
            },
          ],
        };
      }

      default:
        throw new Error(`Bilinmeyen araç: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Hata: ${error.message}\n\nDetay: ${error.response?.data ? JSON.stringify(error.response.data) : 'Detay yok'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Budget MCP Server çalışıyor...');
}

main().catch((error) => {
  console.error('Server hatası:', error);
  process.exit(1);
});

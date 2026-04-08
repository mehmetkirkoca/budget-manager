#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { config } from 'dotenv';
import { CC_MIN_PAYMENT_RATE_LOW, CC_MIN_PAYMENT_RATE_HIGH, CC_MIN_PAYMENT_LIMIT_THRESHOLD, CC_MIN_PAYMENT_FLOOR } from './config/constants.js';

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
            unit: {
              type: 'string',
              description: 'Birim (gr, adet, vb.) - opsiyonel',
            },
            currency: {
              type: 'string',
              description: 'Para birimi (TRY, USD, EUR, vb.)',
            },
          },
          required: ['name', 'type', 'targetValue'],
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
      {
        name: 'get_notes',
        description: 'Tüm notları getirir. Kategori, öncelik veya arama ile filtrelenebilir.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Kategori filtresi (personal, work, finance, health, other)',
            },
            priority: {
              type: 'string',
              description: 'Öncelik filtresi (low, medium, high)',
            },
            search: {
              type: 'string',
              description: 'Başlık veya içerikte arama',
            },
          },
        },
      },
      {
        name: 'create_note',
        description: 'Yeni bir not oluşturur.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Not başlığı',
            },
            content: {
              type: 'string',
              description: 'Not içeriği',
            },
            category: {
              type: 'string',
              description: 'Kategori (personal, work, finance, health, other)',
            },
            priority: {
              type: 'string',
              description: 'Öncelik (low, medium, high)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Etiketler',
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'update_note',
        description: 'Var olan bir notu günceller.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Güncellenecek notun ID\'si',
            },
            title: {
              type: 'string',
              description: 'Not başlığı',
            },
            content: {
              type: 'string',
              description: 'Not içeriği',
            },
            category: {
              type: 'string',
              description: 'Kategori',
            },
            priority: {
              type: 'string',
              description: 'Öncelik',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Etiketler',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_note',
        description: 'Bir notu siler.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Silinecek notun ID\'si',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_credit_cards',
        description: 'Tüm kredi kartlarını ekstre durumuyla birlikte listeler. Bakiye, limit kullanımı, asgari ödeme ve son ödeme tarihi gösterilir.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_credit_card_statement',
        description: 'Bir kredi kartının detaylı ekstresini gösterir. Bakiye, taksitler, faiz bilgileri, ücretler ve ödeme takvimi dahildir.',
        inputSchema: {
          type: 'object',
          properties: {
            card_id: {
              type: 'string',
              description: 'Kredi kartının ID\'si. get_credit_cards aracıyla öğrenilebilir.',
            },
            card_name: {
              type: 'string',
              description: 'Kart adı veya banka adı ile arama (card_id verilmezse kullanılır)',
            },
          },
        },
      },
      {
        name: 'get_upcoming_payments',
        description: 'Yaklaşan tüm ödemeleri listeler: kredi kartı ekstre ödemeleri, taksitler ve tekrarlayan ödemeler. Takvime etkinlik eklemek için idealdir.',
        inputSchema: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              description: 'Kaç günlük ödeme takvimi gösterilsin (varsayılan: 30)',
            },
          },
        },
      },
      {
        name: 'calculate_credit_card_interest',
        description: 'Kredi kartı faiz simülasyonu yapar. Ödeme tutarına göre akdi faiz ve gecikme faizini 4 senaryo karşılaştırmasıyla gösterir.',
        inputSchema: {
          type: 'object',
          properties: {
            card_id: {
              type: 'string',
              description: 'Kredi kartının ID\'si. get_credit_cards aracıyla öğrenilebilir.',
            },
            card_name: {
              type: 'string',
              description: 'Kart adı veya banka adı ile arama (card_id verilmezse kullanılır)',
            },
            payment_amount: {
              type: 'number',
              description: 'Yapmayı planladığınız ödeme tutarı (TL)',
            },
            akdi_faiz_rate: {
              type: 'number',
              description: 'Aylık akdi faiz oranı (opsiyonel, verilmezse kartın kayıtlı interestRate.monthly değeri kullanılır)',
            },
            gecikme_faiz_rate: {
              type: 'number',
              description: 'Aylık gecikme faiz oranı (opsiyonel, verilmezse dönem borcuna göre TCMB kademeli oranı uygulanır)',
            },
          },
          required: ['payment_amount'],
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
          currentAmount: args.currentValue ?? 0,
          targetAmount: args.targetValue,
          unit: args.unit,
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
        const { id, currentValue, targetValue, currency, ...rest } = args;
        const updateData = { ...rest };
        if (currentValue !== undefined) updateData.currentAmount = currentValue;
        if (targetValue !== undefined) updateData.targetAmount = targetValue;
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

      case 'get_notes': {
        const params = {};
        if (args.category) params.category = args.category;
        if (args.priority) params.priority = args.priority;
        if (args.search) params.search = args.search;

        const response = await api.get('/notes', { params });
        const notes = response.data.notes;

        const formatted = notes.map((note) => ({
          id: note._id,
          başlık: note.title,
          içerik: note.content,
          kategori: note.category,
          öncelik: note.priority,
          etiketler: note.tags,
          tarih: formatDate(note.updatedAt),
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Toplam ${formatted.length} not bulundu:\n\n${JSON.stringify(formatted, null, 2)}`,
            },
          ],
        };
      }

      case 'create_note': {
        const noteData = {
          title: args.title,
          content: args.content,
          category: args.category || 'personal',
          priority: args.priority || 'medium',
          tags: args.tags || [],
        };

        const response = await api.post('/notes', noteData);

        return {
          content: [
            {
              type: 'text',
              text: `Not başarıyla oluşturuldu:\n\nBaşlık: ${response.data.title}\nKategori: ${response.data.category}\nÖncelik: ${response.data.priority}`,
            },
          ],
        };
      }

      case 'update_note': {
        const { id, ...updateData } = args;
        const response = await api.put(`/notes/${id}`, updateData);

        return {
          content: [
            {
              type: 'text',
              text: `Not başarıyla güncellendi:\n\nBaşlık: ${response.data.title}\nKategori: ${response.data.category}\nÖncelik: ${response.data.priority}`,
            },
          ],
        };
      }

      case 'delete_note': {
        await api.delete(`/notes/${args.id}`);

        return {
          content: [
            {
              type: 'text',
              text: `ID: ${args.id} olan not başarıyla silindi.`,
            },
          ],
        };
      }

      case 'get_upcoming_payments': {
        const days = args.days || 30;

        const [cardsRes, installmentsRes, recurringRes] = await Promise.all([
          api.get('/credit-cards'),
          api.get(`/credit-card-installments/upcoming?days=${days}`),
          api.get(`/recurring-payments/upcoming?days=${days}`),
        ]);

        const cards = cardsRes.data || [];
        const installments = Array.isArray(installmentsRes.data) ? installmentsRes.data : [];
        const recurring = Array.isArray(recurringRes.data) ? recurringRes.data : [];

        const now = new Date();
        const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        // Kredi kartı ekstre ödemeleri
        const cardPayments = cards
          .filter(c => c.nextPaymentDue && new Date(c.nextPaymentDue) <= until)
          .map(c => ({
            type: 'credit_card',
            title: `${c.bankName} ${c.name}`,
            cardNumber: c.cardNumber,
            amount: c.currentBalance || 0,
            minimumPayment: c.minimumPaymentAmount || 0,
            dueDate: c.nextPaymentDue,
            cardId: c._id,
          }))
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // Taksit ödemeleri
        const installmentPayments = installments.map(i => ({
          type: 'installment',
          title: i.description || i.name || 'Taksit Ödemesi',
          amount: i.installmentAmount || i.amount || 0,
          dueDate: i.nextPaymentDate || i.dueDate,
          cardName: i.cardName || '',
          remaining: i.remainingInstallments || null,
        })).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // Tekrarlayan ödemeler
        const recurringPayments = recurring.map(r => ({
          type: 'recurring',
          title: r.name || r.description || 'Tekrarlayan Ödeme',
          amount: r.calculatedAmount || r.amount || 0,
          dueDate: r.nextDue,
          frequency: r.frequency || '',
        })).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        const allPayments = [...cardPayments, ...installmentPayments, ...recurringPayments]
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        const lines = [`Yaklaşan Ödemeler (${days} gün, toplam ${allPayments.length} ödeme):\n`];

        if (cardPayments.length > 0) {
          lines.push('=== KREDİ KARTI EKSTRE ÖDEMELERİ ===');
          for (const p of cardPayments) {
            lines.push(`  • ${p.title} (****${p.cardNumber})`);
            lines.push(`    Tarih         : ${formatDate(p.dueDate)}`);
            lines.push(`    Toplam Borç   : ${formatCurrency(p.amount)}`);
            lines.push(`    Asgari Ödeme  : ${formatCurrency(p.minimumPayment)}`);
            lines.push(`    Kart ID       : ${p.cardId}`);
            lines.push('');
          }
        }

        if (installmentPayments.length > 0) {
          lines.push('=== TAKSİT ÖDEMELERİ ===');
          for (const p of installmentPayments) {
            lines.push(`  • ${p.title}${p.cardName ? ` (${p.cardName})` : ''}`);
            lines.push(`    Tarih    : ${p.dueDate ? formatDate(p.dueDate) : 'Belirsiz'}`);
            lines.push(`    Tutar    : ${formatCurrency(p.amount)}`);
            if (p.remaining) lines.push(`    Kalan    : ${p.remaining} taksit`);
            lines.push('');
          }
        }

        if (recurringPayments.length > 0) {
          lines.push('=== TEKRARLAYAN ÖDEMELER ===');
          for (const p of recurringPayments) {
            lines.push(`  • ${p.title}`);
            lines.push(`    Tarih    : ${p.dueDate ? formatDate(p.dueDate) : 'Belirsiz'}`);
            lines.push(`    Tutar    : ${formatCurrency(p.amount)}`);
            if (p.frequency) lines.push(`    Sıklık   : ${p.frequency}`);
            lines.push('');
          }
        }

        if (allPayments.length === 0) {
          lines.push(`Önümüzdeki ${days} günde yaklaşan ödeme bulunmadı.`);
        }

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
          _structured: allPayments,
        };
      }

      case 'get_credit_cards': {
        const [cardsRes, summaryRes] = await Promise.all([
          api.get('/credit-cards'),
          api.get('/credit-cards/summary'),
        ]);
        const cards = cardsRes.data;
        const summary = summaryRes.data;

        const lines = [`Toplam ${cards.length} kredi kartı bulundu:\n`];

        for (const card of cards) {
          const usedLimit = card.totalLimit - card.availableLimit;
          const utilizationRate = ((usedLimit / card.totalLimit) * 100).toFixed(1);
          const minPayment = card.minimumPaymentAmount
            ? card.minimumPaymentAmount
            : Math.max((card.currentBalance || 0) * (card.minimumPaymentRate ?? (card.totalLimit > CC_MIN_PAYMENT_LIMIT_THRESHOLD ? CC_MIN_PAYMENT_RATE_HIGH : CC_MIN_PAYMENT_RATE_LOW)), CC_MIN_PAYMENT_FLOOR);

          lines.push(`=== ${card.bankName} — ${card.name} (****${card.cardNumber}) ===`);
          lines.push(`  Kart ID         : ${card._id}`);
          lines.push(`  Kart Tipi       : ${(card.cardType || '').toUpperCase()}`);
          lines.push(`  Toplam Limit    : ${formatCurrency(card.totalLimit)}`);
          lines.push(`  Kullanılan      : ${formatCurrency(usedLimit)} (%${utilizationRate})`);
          lines.push(`  Kullanılabilir  : ${formatCurrency(card.availableLimit)}`);
          lines.push(`  Mevcut Bakiye   : ${formatCurrency(card.currentBalance || 0)}`);
          lines.push(`  Asgari Ödeme    : ${formatCurrency(minPayment)}`);
          lines.push(`  Son Ödeme Tarihi: ${card.nextPaymentDue ? formatDate(card.nextPaymentDue) : 'Belirsiz'}`);
          lines.push(`  Ekstre Günü     : Her ayın ${card.statementDay}. günü`);
          lines.push(`  Aylık Faiz      : %${((card.interestRate?.monthly || 0) * 100).toFixed(2)}`);
          lines.push('');
        }

        if (summary?.utilization) {
          const u = summary.utilization;
          lines.push('--- GENEL ÖZET ---');
          lines.push(`  Toplam Limit    : ${formatCurrency(u.totalLimit || 0)}`);
          lines.push(`  Toplam Kullanılan: ${formatCurrency(u.totalUsed || 0)} (%${(u.averageUtilization || 0).toFixed(1)})`);
          lines.push(`  Toplam Borç     : ${formatCurrency(u.totalDebt || 0)}`);
        }

        if (summary?.upcomingPayments?.length > 0) {
          lines.push('\n--- YAKLAŞAN ÖDEMELER (7 gün) ---');
          for (const p of summary.upcomingPayments) {
            lines.push(`  • ${p.bankName} ${p.name}: ${formatCurrency(p.minimumPaymentAmount || 0)} — ${p.nextPaymentDue ? formatDate(p.nextPaymentDue) : ''}`);
          }
        }

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
        };
      }

      case 'get_credit_card_statement': {
        let cardId = args.card_id;

        if (!cardId && args.card_name) {
          const allCards = (await api.get('/credit-cards')).data;
          const matches = allCards.filter(
            (c) =>
              c.name.toLowerCase().includes(args.card_name.toLowerCase()) ||
              c.bankName.toLowerCase().includes(args.card_name.toLowerCase())
          );
          if (matches.length === 0) {
            return { content: [{ type: 'text', text: `"${args.card_name}" ile eşleşen kart bulunamadı. get_credit_cards aracıyla mevcut kartları listeleyin.` }] };
          }
          if (matches.length > 1) {
            const list = matches.map((c) => `  • ${c.bankName} ${c.name} (ID: ${c._id})`).join('\n');
            return { content: [{ type: 'text', text: `Birden fazla kart eşleşti. Lütfen card_id parametresini kullanın:\n${list}` }] };
          }
          cardId = matches[0]._id;
        }

        if (!cardId) {
          return { content: [{ type: 'text', text: 'card_id veya card_name parametrelerinden biri gereklidir.' }] };
        }

        const detailRes = await api.get(`/credit-cards/${cardId}/details`);
        const { creditCard: c, installments, stats } = detailRes.data;

        const usedLimit = c.totalLimit - c.availableLimit;
        const utilizationRate = ((usedLimit / c.totalLimit) * 100).toFixed(1);
        const minPayment = c.minimumPaymentAmount
          ? c.minimumPaymentAmount
          : Math.max((c.currentBalance || 0) * (c.minimumPaymentRate || 0.03), 50);

        const lines = [];

        lines.push(`=== ${c.bankName} — ${c.name} (****${c.cardNumber}) ===`);
        lines.push(`Kart Tipi: ${(c.cardType || '').toUpperCase()}\n`);

        lines.push('--- LİMİT BİLGİSİ ---');
        lines.push(`  Toplam Limit    : ${formatCurrency(c.totalLimit)}`);
        lines.push(`  Kullanılan      : ${formatCurrency(usedLimit)} (%${utilizationRate})`);
        lines.push(`  Kullanılabilir  : ${formatCurrency(c.availableLimit)}\n`);

        lines.push('--- EKSTRE ÖZETİ ---');
        lines.push(`  Mevcut Bakiye       : ${formatCurrency(c.currentBalance || 0)}`);
        lines.push(`  Asgari Ödeme Tutarı : ${formatCurrency(minPayment)}`);
        lines.push(`    (Oran: %${((c.minimumPaymentRate || 0.03) * 100).toFixed(0)}, min. 50 ₺)`);
        lines.push(`  Son Ödeme Tarihi    : ${c.nextPaymentDue ? formatDate(c.nextPaymentDue) : 'Belirsiz'}`);
        lines.push(`  Son Ekstre Tarihi   : ${c.lastStatementDate ? formatDate(c.lastStatementDate) : 'Henüz yok'}`);
        lines.push(`  Ekstre Kesim Günü   : Her ayın ${c.statementDay}. günü`);
        lines.push(`  Ödeme Son Günü      : Her ayın ${c.paymentDueDay}. günü\n`);

        lines.push('--- FAİZ BİLGİLERİ ---');
        lines.push(`  Akdi Faiz (Aylık) : %${((c.interestRate?.monthly || 0) * 100).toFixed(2)}`);
        lines.push(`  Akdi Faiz (Yıllık): %${((c.interestRate?.annual || 0) * 100).toFixed(2)}`);
        lines.push(`  Nakit Avans Faizi : %${((c.cashAdvanceRate || 0) * 100).toFixed(2)}\n`);

        lines.push('--- ÜCRETLER ---');
        lines.push(`  Yıllık Kart Ücreti: ${formatCurrency(c.fees?.annualFee || 0)}`);
        lines.push(`  Gecikme Ücreti    : ${formatCurrency(c.fees?.latePaymentFee || 0)}`);
        lines.push(`  Limit Aşım Ücreti : ${formatCurrency(c.fees?.overlimitFee || 0)}\n`);

        if (stats) {
          lines.push('--- TAKSİT ÖZETİ ---');
          lines.push(`  Toplam Taksit Planı          : ${stats.totalInstallments || 0} adet`);
          lines.push(`  Aktif Taksit                 : ${stats.activeInstallments || 0} adet`);
          lines.push(`  Bu Ay Ödenecek Taksit Tutarı : ${formatCurrency(stats.monthlyPaymentAmount || 0)}`);
          lines.push(`  Kalan Toplam Taksit Borcu    : ${formatCurrency(stats.totalRemainingAmount || 0)}\n`);
        }

        const activeInstallments = (installments || []).filter((i) => i.paymentStatus === 'active');
        if (activeInstallments.length > 0) {
          lines.push('--- AKTİF TAKSİTLER ---');
          const display = activeInstallments.slice(0, 10);
          for (const inst of display) {
            lines.push(`  • ${inst.purchaseDescription}`);
            lines.push(`    ${inst.completedInstallments}/${inst.totalInstallments} taksit tamamlandı`);
            lines.push(`    Aylık: ${formatCurrency(inst.installmentAmount)}  |  Kalan: ${inst.remainingInstallments} taksit`);
            lines.push(`    Sonraki Ödeme: ${inst.nextPaymentDate ? formatDate(inst.nextPaymentDate) : 'Belirsiz'}`);
          }
          if (activeInstallments.length > 10) {
            lines.push(`  ...ve ${activeInstallments.length - 10} taksit daha`);
          }
        }

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
        };
      }

      case 'calculate_credit_card_interest': {
        let interestCardId = args.card_id;
        if (!interestCardId && args.card_name) {
          const allCards = (await api.get('/credit-cards')).data;
          const matches = allCards.filter(
            (c) =>
              c.name.toLowerCase().includes(args.card_name.toLowerCase()) ||
              c.bankName.toLowerCase().includes(args.card_name.toLowerCase())
          );
          if (matches.length === 0) {
            return { content: [{ type: 'text', text: `"${args.card_name}" adında kart bulunamadı.` }] };
          }
          if (matches.length > 1) {
            const list = matches.map((c) => `  • ${c.bankName} — ${c.name}: ${c._id}`).join('\n');
            return { content: [{ type: 'text', text: `Birden fazla kart eşleşti. Lütfen card_id parametresini kullanın:\n${list}` }] };
          }
          interestCardId = matches[0]._id;
        }
        if (!interestCardId) {
          return { content: [{ type: 'text', text: 'card_id veya card_name parametrelerinden biri gereklidir.' }] };
        }

        const body = { payment_amount: args.payment_amount };
        if (args.akdi_faiz_rate !== undefined) body.akdi_faiz_rate = args.akdi_faiz_rate;
        if (args.gecikme_faiz_rate !== undefined) body.gecikme_faiz_rate = args.gecikme_faiz_rate;

        const { data } = await api.post(`/credit-cards/${interestCardId}/calculate-interest`, body);
        const { card: c, scenarios: { fullPayment: s1, minPayment: s2, noPayment: s3, customPayment: s4 } } = data;

        const fmt = (n) => formatCurrency(n);
        const typeLabels = {
          full_payment: 'TAM ÖDEME',
          akdi_faiz: 'AKDİ FAİZ',
          gecikme_faizi: 'GECİKME FAİZİ',
          gecikme_faizi_no_payment: 'GECİKME FAİZİ (ödeme yok)',
        };
        const s4Label = typeLabels[s4.type] || s4.type;

        const lines = [];
        lines.push(`=== FAİZ HESAPLAMA SİMÜLASYONU ===`);
        lines.push(`Kart       : ${c.bankName} — ${c.name}`);
        lines.push(`Bakiye     : ${fmt(c.balance)}`);
        lines.push(`Asgari Öd. : ${fmt(c.minPayment)}`);
        lines.push(`Akdi Faiz  : %${(c.akdiRate * 100).toFixed(2)}/ay`);
        lines.push(`Gecikme F. : %${(c.gecikmeRate * 100).toFixed(2)}/ay\n`);

        lines.push('SENARYO KARŞILAŞTIRMASI (1 Dönem):');
        lines.push('─'.repeat(62));
        lines.push(`  ${'Senaryo'.padEnd(22)} ${'Ödeme'.padStart(12)} ${'Faiz'.padStart(12)} ${'Sonraki Ay'.padStart(12)}`);
        lines.push('─'.repeat(62));
        lines.push(`  ${'Tam Ödeme'.padEnd(22)} ${fmt(s1.payment).padStart(12)} ${fmt(s1.interest).padStart(12)} ${fmt(s1.nextMonthBalance).padStart(12)}`);
        lines.push(`  ${'Asgari Ödeme'.padEnd(22)} ${fmt(s2.payment).padStart(12)} ${fmt(s2.interest).padStart(12)} ${fmt(s2.nextMonthBalance).padStart(12)}`);
        lines.push(`  ${'Ödeme Yok (Gecikme)'.padEnd(22)} ${fmt(s3.payment).padStart(12)} ${fmt(s3.interest).padStart(12)} ${fmt(s3.nextMonthBalance).padStart(12)}`);
        lines.push(`  ${'Seçtiğiniz Ödeme'.padEnd(22)} ${fmt(s4.payment).padStart(12)} ${fmt(s4.interest).padStart(12)} ${fmt(s4.nextMonthBalance).padStart(12)}`);
        lines.push('─'.repeat(62));

        lines.push(`\n--- SEÇTİĞİNİZ ÖDEME: ${fmt(args.payment_amount)} ---`);
        lines.push(`Sınıflandırma       : ${s4Label}`);
        lines.push(`Kalan Bakiye        : ${fmt(c.balance - Math.min(args.payment_amount, c.balance))}`);
        lines.push(`Oluşacak Faiz       : ${fmt(s4.interest)}`);
        if (s4.lateFee) {
          lines.push(`Gecikme Ücreti      : ${fmt(s4.lateFee)}`);
        }
        lines.push(`Bir Sonraki Dönem   : ${fmt(s4.nextMonthBalance)}`);

        if (s4Label.includes('GECİKME')) {
          lines.push(`\n⚠️  UYARI: Asgari ödeme karşılanmadığında gecikme faizi TÜM bakiye`);
          lines.push(`   üzerinden işler (${fmt(c.balance)} × %${(c.gecikmeRate * 100).toFixed(2)}) ve ${fmt(s3.lateFee)} gecikme ücreti uygulanır.`);
          lines.push(`   Asgari ödeme yapmak bile ${fmt(s2.interest)} tasarruf sağlar.`);
        } else if (s4Label === 'AKDİ FAİZ') {
          const tasarruf = s3.interest - s4.interest;
          lines.push(`\n💡 TAVSİYE: Tam ödeme yaparsanız ${fmt(s4.interest)} faizden kurtulursunuz.`);
          if (tasarruf > 0) {
            lines.push(`   Asgari yerine bu ödemeyle gecikme senaryosuna göre ${fmt(tasarruf)} tasarruf edersiniz.`);
          }
        } else if (s4Label === 'TAM ÖDEME') {
          lines.push(`\n✅ Tam ödeme: Bu dönem hiç faiz ödemezsiniz.`);
        }

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
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

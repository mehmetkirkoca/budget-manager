const {
  importAllData,
  importCollection,
  validateImportData,
  getImportPreview
} = require('../controllers/importController');

async function importRoutes(fastify, options) {
  // Import all data
  fastify.post('/all', {
    schema: {
      description: 'Import all budget data from JSON',
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            description: 'The exported budget data'
          },
          options: {
            type: 'object',
            properties: {
              mode: {
                type: 'string',
                enum: ['merge', 'replace', 'append'],
                default: 'merge'
              },
              skipDuplicates: {
                type: 'boolean',
                default: true
              },
              validateData: {
                type: 'boolean',
                default: true
              },
              collections: {
                type: 'array',
                items: { type: 'string' },
                default: ['all']
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            imported: { type: 'object' },
            errors: { type: 'array' },
            summary: { type: 'object' }
          }
        }
      }
    }
  }, importAllData);

  // Import specific collection
  fastify.post('/collection/:collection', {
    schema: {
      description: 'Import specific collection data',
      params: {
        type: 'object',
        required: ['collection'],
        properties: {
          collection: {
            type: 'string',
            enum: ['categories', 'expenses', 'incomes', 'assets', 'recurringPayments', 'creditCards', 'creditCardInstallments']
          }
        }
      },
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'array',
            description: 'Array of items to import'
          },
          options: {
            type: 'object',
            properties: {
              mode: {
                type: 'string',
                enum: ['merge', 'replace', 'append'],
                default: 'merge'
              },
              skipDuplicates: {
                type: 'boolean',
                default: true
              },
              validateData: {
                type: 'boolean',
                default: true
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            collection: { type: 'string' },
            result: { type: 'object' },
            importDate: { type: 'string' }
          }
        }
      }
    }
  }, importCollection);

  // Import with options
  fastify.post('/with-options', {
    schema: {
      description: 'Import data with custom options',
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            description: 'The exported budget data'
          },
          options: {
            type: 'object',
            properties: {
              mode: {
                type: 'string',
                enum: ['merge', 'replace', 'append'],
                default: 'merge'
              },
              skipDuplicates: {
                type: 'boolean',
                default: true
              },
              validateData: {
                type: 'boolean',
                default: true
              },
              collections: {
                type: 'array',
                items: { type: 'string' },
                default: ['all']
              }
            }
          }
        }
      }
    }
  }, importAllData);

  // Validate import data
  fastify.post('/validate', {
    schema: {
      description: 'Validate import data before importing',
      body: {
        type: 'object',
        description: 'The budget data to validate'
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            errors: { type: 'array' },
            warnings: { type: 'array' },
            summary: { type: 'object' }
          }
        }
      }
    }
  }, validateImportData);

  // Get import preview
  fastify.post('/preview', {
    schema: {
      description: 'Get preview of what will be imported',
      body: {
        type: 'object',
        description: 'The budget data to preview'
      },
      response: {
        200: {
          type: 'object',
          properties: {
            exportDate: { type: 'string' },
            version: { type: 'string' },
            summary: { type: 'object' },
            originalSummary: { type: 'object' }
          }
        }
      }
    }
  }, getImportPreview);
}

module.exports = importRoutes;
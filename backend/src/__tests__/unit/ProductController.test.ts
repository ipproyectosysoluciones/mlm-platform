/**
 * @fileoverview Product Controller Unit Tests
 * @description Tests for ProductReadController and ProductWriteController
 * @module __tests__/unit/ProductController
 */

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../services/ProductService', () => ({
  productService: {
    getProductList: jest.fn(),
    findByIdWithCategory: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { getProducts, getProductById } from '../../controllers/products/ProductReadController';
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../controllers/products/ProductWriteController';
import { productService } from '../../services/ProductService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: 'admin-id', role: 'admin' },
    next: jest.fn(),
    ...overrides,
  } as any;
}

function makeRes() {
  const mockRes: any = {
    _status: 200,
    _json: null,
    status: function (code: number) {
      this._status = code;
      return this;
    },
    json: function (data: any) {
      this._json = data;
      return this;
    },
  };
  return mockRes;
}

// ── getProducts Tests ────────────────────────────────────────────────────────

describe('ProductReadController - getProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated products with default pagination', async () => {
    const mockProducts = [
      {
        id: VALID_UUID,
        name: 'Netflix',
        platform: 'netflix',
        price: 10,
        toJSON: () => ({ id: VALID_UUID, name: 'Netflix' }),
      },
    ];
    (productService.getProductList as jest.Mock).mockResolvedValue({
      rows: mockProducts,
      count: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const req = makeReq({ query: {} });
    const res = makeRes();
    const next = jest.fn();
    await getProducts(req, res, next);

    expect(res._json).toMatchObject({
      success: true,
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it('returns paginated products with custom page and limit', async () => {
    (productService.getProductList as jest.Mock).mockResolvedValue({
      rows: [],
      count: 0,
      page: 2,
      limit: 10,
      totalPages: 0,
    });

    const req = makeReq({ query: { page: '2', limit: '10' } });
    const res = makeRes();
    const next = jest.fn();
    await getProducts(req, res, next);

    expect(productService.getProductList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 })
    );
  });

  it('caps limit at 100', async () => {
    (productService.getProductList as jest.Mock).mockResolvedValue({
      rows: [],
      count: 0,
      page: 1,
      limit: 100,
      totalPages: 0,
    });

    const req = makeReq({ query: { limit: '500' } });
    const res = makeRes();
    const next = jest.fn();
    await getProducts(req, res, next);

    expect(productService.getProductList).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 })
    );
  });

  it('filters by valid platform', async () => {
    (productService.getProductList as jest.Mock).mockResolvedValue({
      rows: [],
      count: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const req = makeReq({ query: { platform: 'netflix' } });
    const res = makeRes();
    const next = jest.fn();
    await getProducts(req, res, next);

    expect(productService.getProductList).toHaveBeenCalledWith(
      expect.objectContaining({ platform: 'netflix' })
    );
  });

  it('ignores invalid platform', async () => {
    (productService.getProductList as jest.Mock).mockResolvedValue({
      rows: [],
      count: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const req = makeReq({ query: { platform: 'invalid_platform' } });
    const res = makeRes();
    const next = jest.fn();
    await getProducts(req, res, next);

    expect(productService.getProductList).toHaveBeenCalledWith(
      expect.not.objectContaining({ platform: 'invalid_platform' })
    );
  });

  it('filters by valid product type', async () => {
    (productService.getProductList as jest.Mock).mockResolvedValue({
      rows: [],
      count: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const req = makeReq({ query: { type: 'subscription' } });
    const res = makeRes();
    const next = jest.fn();
    await getProducts(req, res, next);

    expect(productService.getProductList).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'subscription' })
    );
  });

  it('filters by stock range', async () => {
    (productService.getProductList as jest.Mock).mockResolvedValue({
      rows: [],
      count: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const req = makeReq({ query: { minStock: '5', maxStock: '20' } });
    const res = makeRes();
    const next = jest.fn();
    await getProducts(req, res, next);

    expect(productService.getProductList).toHaveBeenCalledWith(
      expect.objectContaining({ minStock: 5, maxStock: 20 })
    );
  });

  it('filters by search term', async () => {
    (productService.getProductList as jest.Mock).mockResolvedValue({
      rows: [],
      count: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    const req = makeReq({ query: { search: 'netflix' } });
    const res = makeRes();
    const next = jest.fn();
    await getProducts(req, res, next);

    expect(productService.getProductList).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'netflix' })
    );
  });
});

// ── getProductById Tests ─────────────────────────────────────────────────────

describe('ProductReadController - getProductById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns product by id with category', async () => {
    const mockProduct = {
      id: VALID_UUID,
      name: 'Netflix',
      platform: 'netflix',
      price: 10,
      currency: 'USD',
      isActive: true,
      category: {
        id: 'cat-1',
        name: 'Streaming',
        slug: 'streaming',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    (productService.findByIdWithCategory as jest.Mock).mockResolvedValue(mockProduct);

    const req = makeReq({ params: { id: VALID_UUID } });
    const res = makeRes();
    const next = jest.fn();
    await getProductById(req, res, next);

    expect(res._json).toMatchObject({
      success: true,
      data: expect.objectContaining({ id: VALID_UUID, name: 'Netflix' }),
    });
  });

  it('returns 400 for invalid UUID format', async () => {
    const req = makeReq({ params: { id: 'not-a-uuid' } });
    const res = makeRes();
    const next = jest.fn();
    await getProductById(req, res, next);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    });
  });

  it('returns 404 when product not found', async () => {
    (productService.findByIdWithCategory as jest.Mock).mockResolvedValue(null);

    const req = makeReq({ params: { id: VALID_UUID } });
    const res = makeRes();
    const next = jest.fn();
    await getProductById(req, res, next);

    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'PRODUCT_NOT_FOUND' }),
    });
  });
});

// ── createProduct Tests ───────────────────────────────────────────────────────

describe('ProductWriteController - createProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates product successfully', async () => {
    const mockProduct = {
      id: VALID_UUID,
      name: 'Spotify',
      platform: 'spotify',
      price: 5,
      toJSON: () => ({ id: VALID_UUID, name: 'Spotify' }),
    };
    (productService.create as jest.Mock).mockResolvedValue(mockProduct);

    const req = makeReq({
      body: { name: 'Spotify', platform: 'spotify', price: 5, currency: 'USD' },
    });
    const res = makeRes();
    const next = jest.fn();
    await createProduct(req, res, next);

    expect(res._status).toBe(201);
    expect(res._json).toMatchObject({ success: true });
  });

  it('creates product with all fields', async () => {
    const mockProduct = {
      id: VALID_UUID,
      name: 'Full Product',
      platform: 'other',
      price: 99,
      type: 'digital',
      sku: 'SKU-001',
      stock: 50,
      toJSON: () => ({ id: VALID_UUID, name: 'Full Product' }),
    };
    (productService.create as jest.Mock).mockResolvedValue(mockProduct);

    const req = makeReq({
      body: {
        name: 'Full Product',
        platform: 'other',
        price: 99,
        currency: 'USD',
        type: 'digital',
        sku: 'SKU-001',
        stock: 50,
      },
    });
    const res = makeRes();
    const next = jest.fn();
    await createProduct(req, res, next);

    expect(productService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Full Product',
        type: 'digital',
        sku: 'SKU-001',
        stock: 50,
      })
    );
  });
});

// ── updateProduct Tests ───────────────────────────────────────────────────────

describe('ProductWriteController - updateProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates product successfully', async () => {
    const mockProduct = {
      id: VALID_UUID,
      name: 'Netflix Updated',
      save: jest.fn(),
      toJSON: () => ({ id: VALID_UUID, name: 'Netflix Updated' }),
    };
    (productService.update as jest.Mock).mockResolvedValue(mockProduct);

    const req = makeReq({ params: { id: VALID_UUID }, body: { name: 'Netflix Updated' } });
    const res = makeRes();
    const next = jest.fn();
    await updateProduct(req, res, next);

    expect(productService.update).toHaveBeenCalledWith(
      VALID_UUID,
      expect.objectContaining({ name: 'Netflix Updated' })
    );
    expect(res._json).toMatchObject({ success: true });
  });

  it('updates product and returns success', async () => {
    const mockProduct = {
      id: VALID_UUID,
      name: 'Netflix Updated v2',
      save: jest.fn(),
      toJSON: () => ({ id: VALID_UUID, name: 'Netflix Updated v2' }),
    };
    (productService.update as jest.Mock).mockResolvedValue(mockProduct);

    const req = makeReq({ params: { id: VALID_UUID }, body: { name: 'Netflix Updated v2' } });
    const res = makeRes();
    const next = jest.fn();
    await updateProduct(req, res, next);

    expect(productService.update).toHaveBeenCalledWith(
      VALID_UUID,
      expect.objectContaining({ name: 'Netflix Updated v2' })
    );
    expect(res._json).toMatchObject({ success: true });
  });
});

// ── deleteProduct Tests ───────────────────────────────────────────────────────

describe('ProductWriteController - deleteProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes product successfully', async () => {
    (productService.delete as jest.Mock).mockResolvedValue(true);

    const req = makeReq({ params: { id: VALID_UUID } });
    const res = makeRes();
    const next = jest.fn();
    await deleteProduct(req, res, next);

    expect(productService.delete).toHaveBeenCalledWith(VALID_UUID);
    expect(res._json).toMatchObject({ success: true, data: { id: VALID_UUID } });
  });

  it('returns 404 when product not found', async () => {
    (productService.delete as jest.Mock).mockResolvedValue(false);

    const req = makeReq({ params: { id: VALID_UUID } });
    const res = makeRes();
    const next = jest.fn();
    await deleteProduct(req, res, next);

    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'PRODUCT_NOT_FOUND' }),
    });
  });
});

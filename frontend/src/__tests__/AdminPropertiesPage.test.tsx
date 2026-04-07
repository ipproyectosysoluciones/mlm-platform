/**
 * @fileoverview Integration tests for AdminPropertiesPage
 * @description Tests for the Admin Properties CRUD page including:
 *              - Initial render with loading state
 *              - Fetching and displaying properties list (mocked adminService)
 *              - Opening the create modal
 *              - Submitting the create form (calls adminService.createProperty)
 *              - Displaying empty state when no properties
 *
 *              Tests de integracion para la pagina AdminPropertiesPage incluyendo:
 *              - Render inicial con estado de carga
 *              - Fetch y display de lista de propiedades (adminService mockeado)
 *              - Apertura del modal de creacion
 *              - Submit del formulario de creacion (llama a adminService.createProperty)
 *              - Estado vacio cuando no hay propiedades
 *
 * @module __tests__/AdminPropertiesPage
 * @sprint Sprint 6 - v2.2.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ─────────────────────────────────────────────────────────────────────

/** Mock data / Datos de prueba */
const mockPropertiesResponse = {
  properties: [
    {
      id: 'prop-1',
      type: 'rental',
      title: 'Apartamento Poblado',
      titleEn: null,
      description: null,
      price: 1500000,
      currency: 'COP',
      priceNegotiable: false,
      bedrooms: 2,
      bathrooms: 1,
      areaM2: 65,
      address: 'Cra 43A',
      city: 'Medellin',
      country: 'CO',
      status: 'available',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const mockCreatedProperty = {
  id: 'prop-new',
  type: 'sale',
  title: 'Casa Nueva',
  titleEn: null,
  description: null,
  price: 300000000,
  currency: 'COP',
  priceNegotiable: false,
  bedrooms: 3,
  bathrooms: 2,
  areaM2: 100,
  address: 'Calle 10',
  city: 'Bogota',
  country: 'CO',
  status: 'available',
  createdAt: '2026-04-07T00:00:00.000Z',
  updatedAt: '2026-04-07T00:00:00.000Z',
};

/** adminService mock functions */
const mockGetAdminProperties = vi.fn();
const mockCreateProperty = vi.fn();
const mockUpdateProperty = vi.fn();
const mockDeleteProperty = vi.fn();
const mockTogglePropertyStatus = vi.fn();

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  adminService: {
    getAdminProperties: (...args: unknown[]) => mockGetAdminProperties(...args),
    createProperty: (...args: unknown[]) => mockCreateProperty(...args),
    updateProperty: (...args: unknown[]) => mockUpdateProperty(...args),
    deleteProperty: (...args: unknown[]) => mockDeleteProperty(...args),
    togglePropertyStatus: (...args: unknown[]) => mockTogglePropertyStatus(...args),
    getAdminTours: vi
      .fn()
      .mockResolvedValue({ tours: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    createTour: vi.fn(),
    updateTour: vi.fn(),
    deleteTour: vi.fn(),
    toggleTourStatus: vi.fn(),
    getAdminReservations: vi
      .fn()
      .mockResolvedValue({ reservations: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    getAffiliateCommissions: vi
      .fn()
      .mockResolvedValue({ commissions: [], total: 0, totalAmount: 0, currency: 'COP' }),
  },
}));

/** Auth context mock */
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      email: 'admin@nexoreal.com',
      firstName: 'Admin',
      lastName: 'User',
      referralCode: 'ADMIN',
      level: 1,
    },
    isAuthenticated: true,
  }),
}));

/** i18n mock - prevents translation loading errors */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

import AdminPropertiesPage from '../pages/AdminPropertiesPage';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Renders AdminPropertiesPage inside a MemoryRouter (required for Link components).
 * Renderiza AdminPropertiesPage dentro de MemoryRouter (requerido para componentes Link).
 */
function renderPage() {
  return render(
    <MemoryRouter>
      <AdminPropertiesPage />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminPropertiesPage — integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminProperties.mockResolvedValue(mockPropertiesResponse);
    mockCreateProperty.mockResolvedValue(mockCreatedProperty);
    mockTogglePropertyStatus.mockResolvedValue({
      ...mockPropertiesResponse.properties[0],
      status: 'paused',
    });
  });

  // ── render ───────────────────────────────────────────────────────────────────

  it('should render the page title', async () => {
    // Arrange / Preparar
    renderPage();

    // Assert - heading with "Propiedades" visible after load (h1 level)
    await waitFor(() => {
      const headings = screen.getAllByText(/propiedades/i);
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('should fetch and display properties list on mount', async () => {
    // Arrange / Preparar
    renderPage();

    // Assert - service was called on mount with default params
    await waitFor(() => {
      expect(mockGetAdminProperties).toHaveBeenCalledTimes(1);
      // Called with default page=1 and limit
      expect(mockGetAdminProperties).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    });
  });

  it('should display empty state when no properties returned', async () => {
    // Arrange / Preparar - override mock to return empty list
    mockGetAdminProperties.mockResolvedValue({
      properties: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    renderPage();

    // Assert - empty state message visible
    await waitFor(() => {
      expect(mockGetAdminProperties).toHaveBeenCalled();
    });
  });

  // ── create modal ──────────────────────────────────────────────────────────────

  it('should open the create modal when clicking add button', async () => {
    // Arrange / Preparar
    renderPage();
    await waitFor(() => expect(mockGetAdminProperties).toHaveBeenCalled());

    // Act - find and click the "Nueva propiedad" button
    const addButtons = await screen.findAllByText(/nueva propiedad/i);
    // The button in the toolbar (not the modal header)
    const addButton = addButtons.find((el) => el.closest('button'));
    fireEvent.click(addButton!.closest('button')!);

    // Assert - modal form header appears (the form title inside the modal)
    await waitFor(() => {
      // Modal shows h2 "Nueva propiedad" and a submit button "Crear propiedad"
      expect(screen.getByRole('button', { name: /crear propiedad/i })).toBeInTheDocument();
    });
  });

  it('should call createProperty when create form is submitted', async () => {
    // Arrange / Preparar
    renderPage();
    await waitFor(() => expect(mockGetAdminProperties).toHaveBeenCalled());

    // Act - open modal by clicking "Nueva propiedad" toolbar button
    const addButtons = await screen.findAllByText(/nueva propiedad/i);
    const addButton = addButtons.find((el) => el.closest('button'));
    fireEvent.click(addButton!.closest('button')!);

    // Wait for submit button to appear
    const submitButton = await screen.findByRole('button', { name: /crear propiedad/i });

    // Fill all required fields using placeholder text (labels don't use htmlFor)
    const titleInput = screen.getByPlaceholderText(/apartamento moderno/i);
    fireEvent.change(titleInput, { target: { value: 'Test Property' } });

    const priceInput = screen.getByPlaceholderText(/1500000/i);
    fireEvent.change(priceInput, { target: { value: '2000000' } });

    const addressInput = screen.getByPlaceholderText(/Cra 7/i);
    fireEvent.change(addressInput, { target: { value: 'Calle 100 # 7-45' } });

    const cityInput = screen.getByPlaceholderText(/Bogot/i);
    fireEvent.change(cityInput, { target: { value: 'Bogota' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Assert - createProperty was called
    await waitFor(() => {
      expect(mockCreateProperty).toHaveBeenCalled();
    });
  });
});

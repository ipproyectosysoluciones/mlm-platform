/**
 * @fileoverview MercadoPagoConnectCard component tests (B11 / FE-1)
 * @description Tests the vendor MercadoPago connection card states:
 *              - loading while fetching connection status
 *              - never connected → Conectar action that starts OAuth and redirects
 *              - connected → account info + Reconectar / Desconectar
 *              - expired token → expired state with Reconectar
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MercadoPagoConnectCard } from '../../components/vendor/MercadoPagoConnectCard';
import api from '../../services/api';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);

function mockStatus(status: string, extra: Record<string, unknown> = {}) {
  mockGet.mockImplementation(async (url: string) => {
    if (url.includes('/oauth/status')) {
      return { data: { success: true, data: { status, ...extra } } };
    }
    return {
      data: { success: true, data: { url: 'https://auth.mercadopago.com/foo', state: 'st' } },
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // The status endpoint is always fetched on mount
  mockStatus('never');
});

describe('MercadoPagoConnectCard', () => {
  it('shows a loading state while fetching the connection status', async () => {
    let release: (value: unknown) => void = () => {};
    mockGet.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );

    render(<MercadoPagoConnectCard />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    release({ data: { success: true, data: { status: 'never' } } });
    await screen.findByText('vendor.mpConnect.connect');
  });

  it('renders the connect action when the vendor has never connected', async () => {
    mockStatus('never');

    render(<MercadoPagoConnectCard />);

    expect(await screen.findByText('vendor.mpConnect.title')).toBeInTheDocument();
    expect(screen.getByText('vendor.mpConnect.connect')).toBeInTheDocument();
  });

  it('starts OAuth on connect: calls the authorize endpoint', async () => {
    mockStatus('never');

    render(<MercadoPagoConnectCard />);
    const connectButton = await screen.findByText('vendor.mpConnect.connect');
    fireEvent.click(connectButton);

    // jsdom does not implement navigation (window.location.href assignment),
    // so we assert the contract: authorize is called with the OAuth URL response
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/payment/mercadopago/oauth/authorize');
    });
  });

  it('shows connected info with Reconectar and Desconectar for a connected account', async () => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockStatus('connected', { mpUserId: 'MP-123', expiresAt });

    render(<MercadoPagoConnectCard />);

    expect(await screen.findByText('vendor.mpConnect.connectedTitle')).toBeInTheDocument();
    expect(screen.getByText('vendor.mpConnect.reconnect')).toBeInTheDocument();
    expect(screen.getByText('vendor.mpConnect.disconnect')).toBeInTheDocument();
  });

  it('disconnects the account when Desconectar is clicked', async () => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockStatus('connected', { mpUserId: 'MP-123', expiresAt });

    render(<MercadoPagoConnectCard />);
    fireEvent.click(await screen.findByText('vendor.mpConnect.disconnect'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/payment/mercadopago/oauth/disconnect');
    });
  });

  it('shows the expired state with Reconectar when the token has expired', async () => {
    const expiresAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    mockStatus('connected', { mpUserId: 'MP-123', expiresAt });

    render(<MercadoPagoConnectCard />);

    expect(await screen.findByText('vendor.mpConnect.expiredTitle')).toBeInTheDocument();
    expect(screen.getByText('vendor.mpConnect.reconnect')).toBeInTheDocument();
  });

  it('shows the connect action for a disconnected account', async () => {
    mockStatus('disconnected');

    render(<MercadoPagoConnectCard />);

    expect(await screen.findByText('vendor.mpConnect.connect')).toBeInTheDocument();
  });
});

import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    fbq: (action: string, event: string, params?: Record<string, unknown>) => void;
    _fbq: unknown;
  }
}

interface MetaPixelConfig {
  pixelId: string;
  autoPageView?: boolean;
}

interface TrackEventParams {
  event_name: string;
  custom_data?: Record<string, unknown>;
}

export function useMetaPixel(config: MetaPixelConfig) {
  useEffect(() => {
    if (!config.pixelId || typeof window === 'undefined') return;

    const initPixel = () => {
      if (typeof window.fbq === 'function') return;

      const fbq = function (action: string, event: string, params?: Record<string, unknown>) {
        fbq(action, event, params);
      };
      window.fbq = fbq;
      window._fbq = fbq;

      fbq('init', config.pixelId);
      fbq('track', 'PageView');
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onload = initPixel;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${config.pixelId}&ev=PageView&noscript=1" />`;
    document.head.appendChild(noscript);

    return () => {
      script.remove();
      noscript.remove();
    };
  }, [config.pixelId]);

  const trackEvent = useCallback(
    (params: TrackEventParams) => {
      if (!window.fbq || !config.pixelId) return;

      if (params.custom_data) {
        window.fbq('track', params.event_name, params.custom_data);
      } else {
        window.fbq('track', params.event_name);
      }
    },
    [config.pixelId]
  );

  const trackPageView = useCallback(() => {
    if (!window.fbq || !config.pixelId) return;
    window.fbq('track', 'PageView');
  }, [config.pixelId]);

  const trackLead = useCallback(
    (params?: {
      content_name?: string;
      content_category?: string;
      value?: number;
      currency?: string;
    }) => {
      if (!window.fbq || !config.pixelId) return;
      window.fbq('track', 'Lead', params);
    },
    [config.pixelId]
  );

  const trackCompleteRegistration = useCallback(
    (params?: { content_name?: string; status?: string }) => {
      if (!window.fbq || !config.pixelId) return;
      window.fbq('track', 'CompleteRegistration', params);
    },
    [config.pixelId]
  );

  const trackPurchase = useCallback(
    (params: {
      value: number;
      currency: string;
      content_ids?: string[];
      content_type?: string;
    }) => {
      if (!window.fbq || !config.pixelId) return;
      window.fbq('track', 'Purchase', params);
    },
    [config.pixelId]
  );

  const trackViewContent = useCallback(
    (params?: {
      content_name?: string;
      content_category?: string;
      content_ids?: string[];
      value?: number;
      currency?: string;
    }) => {
      if (!window.fbq || !config.pixelId) return;
      window.fbq('track', 'ViewContent', params);
    },
    [config.pixelId]
  );

  const trackInitiateCheckout = useCallback(
    (params?: {
      value?: number;
      currency?: string;
      content_ids?: string[];
      num_items?: number;
    }) => {
      if (!window.fbq || !config.pixelId) return;
      window.fbq('track', 'InitiateCheckout', params);
    },
    [config.pixelId]
  );

  return {
    trackEvent,
    trackPageView,
    trackLead,
    trackCompleteRegistration,
    trackPurchase,
    trackViewContent,
    trackInitiateCheckout,
  };
}

export function useLandingPagePixel(pixelId?: string) {
  const pixel = useMetaPixel({
    pixelId: pixelId || '',
    autoPageView: true,
  });

  const trackLandingPageView = useCallback(
    (landingPageSlug: string) => {
      pixel.trackViewContent({
        content_name: `Landing Page: ${landingPageSlug}`,
        content_category: 'Landing Page',
      });
    },
    [pixel]
  );

  const trackLandingPageConversion = useCallback(
    (landingPageSlug: string) => {
      pixel.trackLead({
        content_name: `Landing Page Conversion: ${landingPageSlug}`,
        content_category: 'Landing Page',
      });
    },
    [pixel]
  );

  return {
    ...pixel,
    trackLandingPageView,
    trackLandingPageConversion,
  };
}

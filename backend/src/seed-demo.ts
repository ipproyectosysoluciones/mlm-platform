/**
 * @fileoverview Demo Seed Data — Propiedades, Tours y Disponibilidad para Nexo Real
 * @description Datos enriquecidos de demostración para pitch de negocio.
 *              30 propiedades (Colombia + México + Argentina), 17 paquetes turísticos y
 *              disponibilidad de tours para los próximos 30 días.
 *
 * @description Rich demo data for business pitch preparation.
 *              30 properties (Colombia + México + Argentina), 17 tour packages and
 *              tour availability for the next 30 days.
 *
 * @module seed-demo
 * @author Nexo Real Development Team
 * @version 1.0.0
 *
 * @example
 * // ES: Importar y ejecutar desde seed.ts
 * import { seedDemoProperties, seedDemoTours, seedDemoTourAvailabilities } from './seed-demo';
 * await seedDemoProperties();
 * await seedDemoTours();
 * await seedDemoTourAvailabilities();
 *
 * // EN: Import and execute from seed.ts
 * import { seedDemoProperties, seedDemoTours, seedDemoTourAvailabilities } from './seed-demo';
 * await seedDemoProperties();
 * await seedDemoTours();
 * await seedDemoTourAvailabilities();
 */

import { Property, TourPackage, TourAvailability } from './models';
import type { PropertyCreationAttributes } from './models/Property';
import type { TourPackageCreationAttributes } from './models/TourPackage';
import type { TourAvailabilityCreationAttributes } from './models/TourAvailability';

// ─── IDs fijos para reproducibilidad ──────────────────────────────────────────
// Fixed IDs for seed reproducibility

/** IDs fijos para propiedades demo / Fixed IDs for demo properties */
const PROPERTY_IDS = {
  // Medellín
  MDE_01: '00000000-0000-0000-0001-000000000001',
  MDE_02: '00000000-0000-0000-0001-000000000002',
  // Cartagena
  CTG_01: '00000000-0000-0000-0001-000000000003',
  CTG_02: '00000000-0000-0000-0001-000000000004',
  // Santa Marta
  SMA_01: '00000000-0000-0000-0001-000000000005',
  SMA_02: '00000000-0000-0000-0001-000000000006',
  // Bogotá
  BOG_01: '00000000-0000-0000-0001-000000000007',
  BOG_02: '00000000-0000-0000-0001-000000000008',
  // San Andrés
  SAI_01: '00000000-0000-0000-0001-000000000009',
  SAI_02: '00000000-0000-0000-0001-000000000010',
  // Cancún
  CUN_01: '00000000-0000-0000-0001-000000000011',
  CUN_02: '00000000-0000-0000-0001-000000000012',
  // Puerto Vallarta
  PVR_01: '00000000-0000-0000-0001-000000000013',
  PVR_02: '00000000-0000-0000-0001-000000000014',
  // Monterrey
  MTY_01: '00000000-0000-0000-0001-000000000015',
  MTY_02: '00000000-0000-0000-0001-000000000016',
  // Guadalajara
  GDL_01: '00000000-0000-0000-0001-000000000017',
  GDL_02: '00000000-0000-0000-0001-000000000018',
  // Cozumel
  CZM_01: '00000000-0000-0000-0001-000000000019',
  CZM_02: '00000000-0000-0000-0001-000000000020',
  // Buenos Aires
  BUE_01: '00000000-0000-0000-0001-000000000021',
  BUE_02: '00000000-0000-0000-0001-000000000022',
  // Bariloche
  BRC_01: '00000000-0000-0000-0001-000000000023',
  BRC_02: '00000000-0000-0000-0001-000000000024',
  // Mendoza
  MDZ_01: '00000000-0000-0000-0001-000000000025',
  MDZ_02: '00000000-0000-0000-0001-000000000026',
  // Salta
  SLA_01: '00000000-0000-0000-0001-000000000027',
  SLA_02: '00000000-0000-0000-0001-000000000028',
  // Mar del Plata
  MDP_01: '00000000-0000-0000-0001-000000000029',
  MDP_02: '00000000-0000-0000-0001-000000000030',
} as const;

/** IDs fijos para paquetes turísticos demo / Fixed IDs for demo tour packages */
const TOUR_IDS = {
  TOUR_01: '00000000-0000-0000-0002-000000000001',
  TOUR_02: '00000000-0000-0000-0002-000000000002',
  TOUR_03: '00000000-0000-0000-0002-000000000003',
  TOUR_04: '00000000-0000-0000-0002-000000000004',
  TOUR_05: '00000000-0000-0000-0002-000000000005',
  TOUR_06: '00000000-0000-0000-0002-000000000006',
  TOUR_07: '00000000-0000-0000-0002-000000000007',
  TOUR_08: '00000000-0000-0000-0002-000000000008',
  TOUR_09: '00000000-0000-0000-0002-000000000009',
  TOUR_10: '00000000-0000-0000-0002-000000000010',
  TOUR_11: '00000000-0000-0000-0002-000000000011',
  TOUR_12: '00000000-0000-0000-0002-000000000012',
  TOUR_13: '00000000-0000-0000-0002-000000000013',
  TOUR_14: '00000000-0000-0000-0002-000000000014',
  TOUR_15: '00000000-0000-0000-0002-000000000015',
  TOUR_16: '00000000-0000-0000-0002-000000000016',
  TOUR_17: '00000000-0000-0000-0002-000000000017',
} as const;

/** IDs fijos para disponibilidad de tours / Fixed IDs for tour availability */
const AVAILABILITY_IDS = {
  AVAIL_01: '00000000-0000-0000-0003-000000000001',
  AVAIL_02: '00000000-0000-0000-0003-000000000002',
  AVAIL_03: '00000000-0000-0000-0003-000000000003',
  AVAIL_04: '00000000-0000-0000-0003-000000000004',
  AVAIL_05: '00000000-0000-0000-0003-000000000005',
  AVAIL_06: '00000000-0000-0000-0003-000000000006',
  AVAIL_07: '00000000-0000-0000-0003-000000000007',
  AVAIL_08: '00000000-0000-0000-0003-000000000008',
  AVAIL_09: '00000000-0000-0000-0003-000000000009',
  AVAIL_10: '00000000-0000-0000-0003-000000000010',
  AVAIL_11: '00000000-0000-0000-0003-000000000011',
  AVAIL_12: '00000000-0000-0000-0003-000000000012',
  AVAIL_13: '00000000-0000-0000-0003-000000000013',
  AVAIL_14: '00000000-0000-0000-0003-000000000014',
  AVAIL_15: '00000000-0000-0000-0003-000000000015',
  AVAIL_16: '00000000-0000-0000-0003-000000000016',
  AVAIL_17: '00000000-0000-0000-0003-000000000017',
  AVAIL_18: '00000000-0000-0000-0003-000000000018',
  AVAIL_19: '00000000-0000-0000-0003-000000000019',
  AVAIL_20: '00000000-0000-0000-0003-000000000020',
  AVAIL_21: '00000000-0000-0000-0003-000000000021',
  AVAIL_22: '00000000-0000-0000-0003-000000000022',
  AVAIL_23: '00000000-0000-0000-0003-000000000023',
  AVAIL_24: '00000000-0000-0000-0003-000000000024',
  AVAIL_25: '00000000-0000-0000-0003-000000000025',
  AVAIL_26: '00000000-0000-0000-0003-000000000026',
  AVAIL_27: '00000000-0000-0000-0003-000000000027',
  AVAIL_28: '00000000-0000-0000-0003-000000000028',
  AVAIL_29: '00000000-0000-0000-0003-000000000029',
  AVAIL_30: '00000000-0000-0000-0003-000000000030',
  AVAIL_31: '00000000-0000-0000-0003-000000000031',
  AVAIL_32: '00000000-0000-0000-0003-000000000032',
  AVAIL_33: '00000000-0000-0000-0003-000000000033',
  AVAIL_34: '00000000-0000-0000-0003-000000000034',
  AVAIL_35: '00000000-0000-0000-0003-000000000035',
  AVAIL_36: '00000000-0000-0000-0003-000000000036',
  AVAIL_37: '00000000-0000-0000-0003-000000000037',
  AVAIL_38: '00000000-0000-0000-0003-000000000038',
  AVAIL_39: '00000000-0000-0000-0003-000000000039',
  AVAIL_40: '00000000-0000-0000-0003-000000000040',
  AVAIL_41: '00000000-0000-0000-0003-000000000041',
  AVAIL_42: '00000000-0000-0000-0003-000000000042',
  AVAIL_43: '00000000-0000-0000-0003-000000000043',
  AVAIL_44: '00000000-0000-0000-0003-000000000044',
  AVAIL_45: '00000000-0000-0000-0003-000000000045',
  AVAIL_46: '00000000-0000-0000-0003-000000000046',
  AVAIL_47: '00000000-0000-0000-0003-000000000047',
  AVAIL_48: '00000000-0000-0000-0003-000000000048',
  AVAIL_49: '00000000-0000-0000-0003-000000000049',
  AVAIL_50: '00000000-0000-0000-0003-000000000050',
  AVAIL_51: '00000000-0000-0000-0003-000000000051',
} as const;

// ─── Helpers de imágenes ──────────────────────────────────────────────────────
// Image URL helpers

/** Base URL de Unsplash con formato crop / Unsplash base URL with crop format */
const unsplash = (photoId: string, w = 800, h = 600): string =>
  `https://images.unsplash.com/photo-${photoId}?w=${w}&h=${h}&fit=crop`;

// IDs reales de fotos Unsplash — Inmuebles / Real Unsplash photo IDs — Real estate
const IMG = {
  MODERN_APT: '1600596542815-ffad4c1539a9',
  LUXURY_INT: '1600585154340-be6161a56a0c',
  KITCHEN: '1600607687939-ce8a6c25118c',
  LIVING: '1600566753190-17f0baa2a6c0',
  BEDROOM: '1600585154526-990dced4db0d',
  POOL: '1512917774080-9991f1c4c750',
  OCEAN_VIEW: '1613490493805-039e3e03b6d5',
  BALCONY: '1600047509807-ba8f99d2cdde',
  COLONIAL: '1560448204771-d60f8d8b7392',
  TROPICAL: '1600573472591-ee6981cf35fb',
  BUILDING: '1582268611958-ebfd161ef9cf',
  ROOFTOP: '1600210492486-724fe5c67fb0',
  BATHROOM: '1600607687644-c7171b42498f',
  DINING: '1600585154084-4e7c8c5a13c4',
  BEACH_HOUSE: '1564013799919-ab6767e3e5a4',
  STUDIO: '1600566753086-00f18fb6b3ea',
  PENTHOUSE: '1600585153490-76fb20fd1d00',
  GARDEN: '1600210491369-e753d80a41f3',
  ENTRANCE: '1600607687920-4e03b0f3f0a8',
  CONDO_EXT: '1523217553220-27bbec67eb5d',
} as const;

// IDs reales de fotos Unsplash — Turismo / Real Unsplash photo IDs — Tourism
const TOUR_IMG = {
  BEACH_SUNSET: '1506905925346-21bda4d32df4',
  TROPICAL_BEACH: '1507003211169-0a1dd7228f2d',
  OCEAN: '1519046904884-53103b34b206',
  SCUBA: '1501785888108-6c792c0e2a49',
  CULTURAL_CITY: '1526392060635-9d6019884377',
  MOUNTAIN: '1568402102990-bc541580b59f',
  FOOD_MARKET: '1504214208698-ea1916a2195a',
  CENOTE: '1559128010-cd27cf0d77bc',
  COLONIAL_ST: '1566438480900-0609be27a4be',
  MAYAN_RUINS: '1587595431973-160d0d94add1',
  CATAMARAN: '1533106497176-45ae19e68ba2',
  SPA: '1544551763-46a013bb70d5',
} as const;

// ─── Helpers de fecha ─────────────────────────────────────────────────────────
// Date helpers

/**
 * Genera una fecha YYYY-MM-DD sumando días desde hoy.
 * Generates a YYYY-MM-DD date adding days from today.
 *
 * @param daysFromNow - Días a sumar / Days to add
 * @returns Fecha en formato DATEONLY / Date in DATEONLY format
 */
function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0] as string;
}

// ─── Datos de propiedades ─────────────────────────────────────────────────────
// Property demo data

/**
 * 30 propiedades demo — 2 por ciudad, mezcla de tipos (rental/sale/management).
 * 30 demo properties — 2 per city, mix of types (rental/sale/management).
 *
 * Ciudades / Cities:
 *   Colombia:  Medellín, Cartagena, Santa Marta, Bogotá, San Andrés
 *   México:    Cancún, Puerto Vallarta, Monterrey, Guadalajara, Cozumel
 *   Argentina: Buenos Aires, Bariloche, Mendoza, Salta, Mar del Plata
 */
const DEMO_PROPERTIES: PropertyCreationAttributes[] = [
  // ── Medellín ────────────────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.MDE_01,
    type: 'rental',
    title: 'Apartamento Moderno — El Poblado, Medellín',
    titleEn: 'Modern Apartment — El Poblado, Medellín',
    description:
      'Hermoso apartamento de 2 habitaciones en el corazón de El Poblado con vista panorámica a la ciudad. ' +
      'Cocina totalmente equipada, balcón amplio y acceso a piscina y gimnasio del edificio. ' +
      'Ideal para nómadas digitales o familias que buscan comfort y ubicación privilegiada.',
    descriptionEn:
      'Beautiful 2-bedroom apartment in the heart of El Poblado with panoramic city views. ' +
      'Fully equipped kitchen, spacious balcony and access to building pool and gym. ' +
      'Ideal for digital nomads or families seeking comfort and prime location.',
    price: 3_800_000,
    currency: 'COP',
    priceNegotiable: false,
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 85,
    address: 'Cra. 43A #7-50, El Poblado',
    city: 'Medellín',
    country: 'Colombia',
    lat: 6.2086,
    lng: -75.5695,
    amenities: [
      'WiFi',
      'Piscina',
      'Gimnasio',
      'Balcón',
      'Aire acondicionado',
      'Cocina equipada',
      'Parqueadero',
    ],
    images: [
      unsplash(IMG.MODERN_APT),
      unsplash(IMG.LIVING),
      unsplash(IMG.KITCHEN),
      unsplash(IMG.BALCONY),
      unsplash(IMG.POOL),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.MDE_02,
    type: 'sale',
    title: 'Penthouse de Lujo — Laureles, Medellín',
    titleEn: 'Luxury Penthouse — Laureles, Medellín',
    description:
      'Espectacular penthouse de 180 m² en Laureles con terraza privada y jacuzzi. ' +
      '3 habitaciones, 3 baños, doble altura en sala principal y acabados de primera. ' +
      'Zona tranquila a pocos pasos de la Calle 70 y parques emblemáticos.',
    descriptionEn:
      'Spectacular 180 m² penthouse in Laureles with private terrace and jacuzzi. ' +
      '3 bedrooms, 3 bathrooms, double-height living room and premium finishes. ' +
      'Quiet area steps from Calle 70 and iconic parks.',
    price: 850_000_000,
    currency: 'COP',
    priceNegotiable: true,
    bedrooms: 3,
    bathrooms: 3,
    areaM2: 180,
    address: 'Cra. 76 #48-12, Laureles',
    city: 'Medellín',
    country: 'Colombia',
    lat: 6.2466,
    lng: -75.5897,
    amenities: [
      'WiFi',
      'Jacuzzi',
      'Terraza privada',
      'Gimnasio',
      'Parqueadero',
      'Vista panorámica',
      'Seguridad 24h',
    ],
    images: [
      unsplash(IMG.PENTHOUSE),
      unsplash(IMG.LUXURY_INT),
      unsplash(IMG.ROOFTOP),
      unsplash(IMG.BEDROOM),
      unsplash(IMG.BATHROOM),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── Cartagena ───────────────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.CTG_01,
    type: 'rental',
    title: 'Casa Colonial Restaurada — Ciudad Amurallada, Cartagena',
    titleEn: 'Restored Colonial House — Walled City, Cartagena',
    description:
      'Casa colonial del siglo XVIII completamente restaurada en la Ciudad Amurallada. ' +
      '4 habitaciones con aire acondicionado, patio interior con fuente y terraza con vista al mar. ' +
      'Perfecta para hospedaje boutique o estancias largas de lujo.',
    descriptionEn:
      'Fully restored 18th-century colonial house in the Walled City. ' +
      '4 bedrooms with AC, interior courtyard with fountain and rooftop terrace with ocean views. ' +
      'Perfect for boutique hosting or luxury long-term stays.',
    price: 12_500_000,
    currency: 'COP',
    priceNegotiable: true,
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 220,
    address: 'Calle de la Iglesia #35-21, Centro Histórico',
    city: 'Cartagena',
    country: 'Colombia',
    lat: 10.4236,
    lng: -75.5494,
    amenities: [
      'WiFi',
      'Aire acondicionado',
      'Terraza',
      'Vista al mar',
      'Patio interior',
      'Cocina equipada',
      'Seguridad 24h',
    ],
    images: [
      unsplash(IMG.COLONIAL),
      unsplash(IMG.GARDEN),
      unsplash(IMG.ROOFTOP),
      unsplash(IMG.OCEAN_VIEW),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.CTG_02,
    type: 'management',
    title: 'Apartamento Frente al Mar — Bocagrande, Cartagena',
    titleEn: 'Beachfront Apartment — Bocagrande, Cartagena',
    description:
      'Apartamento de 2 habitaciones en primera línea de playa en Bocagrande. ' +
      'Edificio con piscina infinita, gimnasio y lobby con concierge. ' +
      'Ideal para inversión en renta turística con administración incluida.',
    descriptionEn:
      '2-bedroom apartment on the beachfront in Bocagrande. ' +
      'Building with infinity pool, gym and lobby with concierge. ' +
      'Ideal for tourism rental investment with property management included.',
    price: 5_200_000,
    currency: 'COP',
    priceNegotiable: false,
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 95,
    address: 'Cra. 2 #5-120, Bocagrande',
    city: 'Cartagena',
    country: 'Colombia',
    lat: 10.3982,
    lng: -75.5562,
    amenities: [
      'WiFi',
      'Piscina',
      'Gimnasio',
      'Vista al mar',
      'Concierge',
      'Aire acondicionado',
      'Parqueadero',
    ],
    images: [
      unsplash(IMG.BUILDING),
      unsplash(IMG.OCEAN_VIEW),
      unsplash(IMG.POOL),
      unsplash(IMG.LIVING),
      unsplash(IMG.BEDROOM),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── Santa Marta ─────────────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.SMA_01,
    type: 'sale',
    title: 'Villa Tropical con Piscina — Bello Horizonte, Santa Marta',
    titleEn: 'Tropical Villa with Pool — Bello Horizonte, Santa Marta',
    description:
      'Villa de 5 habitaciones con piscina privada y jardín tropical en Bello Horizonte. ' +
      'Construcción moderna con techos altos, ventilación cruzada y acabados en madera. ' +
      'A 10 minutos del Parque Tayrona y de las mejores playas de la costa.',
    descriptionEn:
      '5-bedroom villa with private pool and tropical garden in Bello Horizonte. ' +
      'Modern construction with high ceilings, cross ventilation and wood finishes. ' +
      '10 minutes from Tayrona Park and the best beaches on the coast.',
    price: 1_200_000_000,
    currency: 'COP',
    priceNegotiable: true,
    bedrooms: 5,
    bathrooms: 3,
    areaM2: 300,
    address: 'Km 4 Vía al Aeropuerto, Bello Horizonte',
    city: 'Santa Marta',
    country: 'Colombia',
    lat: 11.2044,
    lng: -74.1971,
    amenities: [
      'Piscina',
      'Jardín',
      'BBQ',
      'Parqueadero',
      'Seguridad privada',
      'Cocina equipada',
      'Aire acondicionado',
    ],
    images: [
      unsplash(IMG.TROPICAL),
      unsplash(IMG.POOL),
      unsplash(IMG.GARDEN),
      unsplash(IMG.ENTRANCE),
      unsplash(IMG.KITCHEN),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.SMA_02,
    type: 'rental',
    title: 'Cabaña Frente al Mar — Taganga, Santa Marta',
    titleEn: 'Beachfront Cabin — Taganga, Santa Marta',
    description:
      'Cabaña rústica-moderna de 1 habitación frente a la playa de Taganga. ' +
      'Hamaca en la terraza, ducha al aire libre y acceso directo al mar. ' +
      'Experiencia auténtica del Caribe colombiano para viajeros aventureros.',
    descriptionEn:
      'Rustic-modern 1-bedroom cabin on Taganga beach. ' +
      'Hammock on the terrace, outdoor shower and direct sea access. ' +
      'Authentic Colombian Caribbean experience for adventurous travelers.',
    price: 180_000,
    currency: 'COP',
    priceNegotiable: false,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 40,
    address: 'Playa Grande, Taganga',
    city: 'Santa Marta',
    country: 'Colombia',
    lat: 11.2684,
    lng: -74.1939,
    amenities: ['WiFi', 'Hamaca', 'Vista al mar', 'Cocina básica', 'Terraza'],
    images: [unsplash(IMG.BEACH_HOUSE), unsplash(IMG.OCEAN_VIEW), unsplash(IMG.BALCONY)],
    status: 'available',
    vendorId: null,
  },

  // ── Bogotá ──────────────────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.BOG_01,
    type: 'sale',
    title: 'Loft Industrial — Chapinero Alto, Bogotá',
    titleEn: 'Industrial Loft — Chapinero Alto, Bogotá',
    description:
      'Loft de diseño industrial de 120 m² en Chapinero Alto con techos de doble altura. ' +
      'Ladrillo expuesto, pisos de concreto pulido y amplia iluminación natural. ' +
      'Zona gastronómica y cultural a pasos de la Zona G y la Séptima.',
    descriptionEn:
      '120 m² industrial design loft in Chapinero Alto with double-height ceilings. ' +
      'Exposed brick, polished concrete floors and abundant natural light. ' +
      'Gastronomic and cultural area steps from Zona G and Séptima.',
    price: 620_000_000,
    currency: 'COP',
    priceNegotiable: true,
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 120,
    address: 'Calle 63 #7-15, Chapinero Alto',
    city: 'Bogotá',
    country: 'Colombia',
    lat: 4.6473,
    lng: -74.0603,
    amenities: [
      'WiFi',
      'Parqueadero',
      'Terraza compartida',
      'Portería 24h',
      'Cocina equipada',
      'Calefacción',
    ],
    images: [
      unsplash(IMG.STUDIO),
      unsplash(IMG.LUXURY_INT),
      unsplash(IMG.DINING),
      unsplash(IMG.ENTRANCE),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.BOG_02,
    type: 'management',
    title: 'Apartaestudio Premium — Usaquén, Bogotá',
    titleEn: 'Premium Studio Apartment — Usaquén, Bogotá',
    description:
      'Apartaestudio de 45 m² completamente amoblado en Usaquén. ' +
      'Cocina americana, zona de trabajo y cama queen. Edificio con lavandería y rooftop. ' +
      'Administración integral para Airbnb incluida — retorno estimado 8% anual.',
    descriptionEn:
      '45 m² fully furnished studio apartment in Usaquén. ' +
      'American kitchen, work area and queen bed. Building with laundry and rooftop. ' +
      'Comprehensive Airbnb management included — estimated 8% annual return.',
    price: 2_200_000,
    currency: 'COP',
    priceNegotiable: false,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 45,
    address: 'Cra. 6 #119-20, Usaquén',
    city: 'Bogotá',
    country: 'Colombia',
    lat: 4.6949,
    lng: -74.0317,
    amenities: [
      'WiFi',
      'Lavandería',
      'Rooftop',
      'Cocina equipada',
      'Zona de trabajo',
      'Portería 24h',
    ],
    images: [
      unsplash(IMG.STUDIO),
      unsplash(IMG.KITCHEN),
      unsplash(IMG.ROOFTOP),
      unsplash(IMG.BEDROOM),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── San Andrés ──────────────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.SAI_01,
    type: 'rental',
    title: 'Suite con Vista al Mar de 7 Colores — Centro, San Andrés',
    titleEn: 'Suite with Sea of Seven Colors View — Downtown, San Andrés',
    description:
      'Suite de lujo con balcón panorámico sobre el mar de 7 colores en el centro de San Andrés. ' +
      '1 habitación king, minibar, aire acondicionado y acceso a playa privada. ' +
      'Experiencia caribeña premium a minutos de North End y Spratt Bight.',
    descriptionEn:
      'Luxury suite with panoramic balcony over the Sea of Seven Colors in downtown San Andrés. ' +
      'King bedroom, minibar, AC and private beach access. ' +
      'Premium Caribbean experience minutes from North End and Spratt Bight.',
    price: 450_000,
    currency: 'COP',
    priceNegotiable: false,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 55,
    address: 'Av. Colombia #1-45, Centro',
    city: 'San Andrés',
    country: 'Colombia',
    lat: 12.5847,
    lng: -81.7006,
    amenities: ['WiFi', 'Vista al mar', 'Balcón', 'Minibar', 'Aire acondicionado', 'Playa privada'],
    images: [
      unsplash(IMG.OCEAN_VIEW),
      unsplash(IMG.BEACH_HOUSE),
      unsplash(IMG.BALCONY),
      unsplash(IMG.BEDROOM),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.SAI_02,
    type: 'sale',
    title: 'Casa Isleña con Jardín — La Loma, San Andrés',
    titleEn: 'Island House with Garden — La Loma, San Andrés',
    description:
      'Casa tradicional isleña de 3 habitaciones en La Loma con jardín tropical de 200 m². ' +
      'Construcción en madera típica, techos altos y brisa natural permanente. ' +
      'Oportunidad única de inversión en la zona más auténtica de la isla.',
    descriptionEn:
      'Traditional 3-bedroom island house in La Loma with 200 m² tropical garden. ' +
      'Typical wood construction, high ceilings and permanent natural breeze. ' +
      'Unique investment opportunity in the most authentic area of the island.',
    price: 380_000_000,
    currency: 'COP',
    priceNegotiable: true,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 150,
    address: 'La Loma, Sector El Cove',
    city: 'San Andrés',
    country: 'Colombia',
    lat: 12.5571,
    lng: -81.7148,
    amenities: [
      'Jardín',
      'BBQ',
      'Parqueadero',
      'Ventilación natural',
      'Cocina equipada',
      'Terraza',
    ],
    images: [
      unsplash(IMG.TROPICAL),
      unsplash(IMG.GARDEN),
      unsplash(IMG.ENTRANCE),
      unsplash(IMG.KITCHEN),
      unsplash(IMG.LIVING),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── Cancún, México ──────────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.CUN_01,
    type: 'rental',
    title: 'Condo de Lujo Frente al Mar — Zona Hotelera, Cancún',
    titleEn: 'Luxury Beachfront Condo — Hotel Zone, Cancún',
    description:
      'Condominio de 2 recámaras con vista directa al mar Caribe en la Zona Hotelera de Cancún. ' +
      'Alberca infinity, spa, acceso a playa privada y concierge 24/7. ' +
      'Ubicación premium entre Playa Delfines y La Isla Shopping Village.',
    descriptionEn:
      '2-bedroom condo with direct Caribbean Sea views in Cancún Hotel Zone. ' +
      'Infinity pool, spa, private beach access and 24/7 concierge. ' +
      'Premium location between Playa Delfines and La Isla Shopping Village.',
    price: 45_000,
    currency: 'MXN',
    priceNegotiable: false,
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 110,
    address: 'Blvd. Kukulcán Km 14.5, Zona Hotelera',
    city: 'Cancún',
    country: 'México',
    lat: 21.0891,
    lng: -86.7789,
    amenities: [
      'WiFi',
      'Piscina',
      'Spa',
      'Vista al mar',
      'Concierge',
      'Aire acondicionado',
      'Playa privada',
      'Gimnasio',
    ],
    images: [
      unsplash(IMG.CONDO_EXT),
      unsplash(IMG.OCEAN_VIEW),
      unsplash(IMG.POOL),
      unsplash(IMG.LUXURY_INT),
      unsplash(IMG.BALCONY),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.CUN_02,
    type: 'sale',
    title: 'Departamento con Cenote Privado — Puerto Cancún',
    titleEn: 'Apartment with Private Cenote — Puerto Cancún',
    description:
      'Exclusivo departamento de 3 recámaras en el desarrollo Puerto Cancún con acceso a cenote privado. ' +
      'Marina, campo de golf, club de playa y centro comercial a pasos. ' +
      'Inversión premium con plusvalía garantizada en zona de máximo crecimiento.',
    descriptionEn:
      'Exclusive 3-bedroom apartment in Puerto Cancún development with private cenote access. ' +
      'Marina, golf course, beach club and shopping center steps away. ' +
      'Premium investment with guaranteed appreciation in highest-growth zone.',
    price: 12_500_000,
    currency: 'MXN',
    priceNegotiable: true,
    bedrooms: 3,
    bathrooms: 3,
    areaM2: 195,
    address: 'Blvd. Puerto Cancún Lote 22, Puerto Cancún',
    city: 'Cancún',
    country: 'México',
    lat: 21.1619,
    lng: -86.8244,
    amenities: [
      'WiFi',
      'Cenote privado',
      'Marina',
      'Golf',
      'Club de playa',
      'Gimnasio',
      'Seguridad 24h',
      'Concierge',
    ],
    images: [
      unsplash(IMG.BUILDING),
      unsplash(IMG.LUXURY_INT),
      unsplash(IMG.POOL),
      unsplash(IMG.ROOFTOP),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── Puerto Vallarta, México ─────────────────────────────────────────────
  {
    id: PROPERTY_IDS.PVR_01,
    type: 'management',
    title: 'Villa con Vista a la Bahía — Conchas Chinas, Puerto Vallarta',
    titleEn: 'Bay View Villa — Conchas Chinas, Puerto Vallarta',
    description:
      'Villa de 4 recámaras con alberca infinity y vista espectacular a la Bahía de Banderas. ' +
      'Terraza de 80 m², cocina gourmet y acabados artesanales mexicanos. ' +
      'Servicio de administración integral con ocupación promedio del 75%.',
    descriptionEn:
      '4-bedroom villa with infinity pool and spectacular Bay of Banderas views. ' +
      '80 m² terrace, gourmet kitchen and artisanal Mexican finishes. ' +
      'Comprehensive management service with 75% average occupancy rate.',
    price: 85_000,
    currency: 'MXN',
    priceNegotiable: false,
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 260,
    address: 'Calle Sagitario 132, Conchas Chinas',
    city: 'Puerto Vallarta',
    country: 'México',
    lat: 20.603,
    lng: -105.2432,
    amenities: [
      'Piscina',
      'Vista a la bahía',
      'Terraza',
      'Cocina gourmet',
      'BBQ',
      'Parqueadero',
      'Servicio de limpieza',
    ],
    images: [
      unsplash(IMG.TROPICAL),
      unsplash(IMG.POOL),
      unsplash(IMG.OCEAN_VIEW),
      unsplash(IMG.KITCHEN),
      unsplash(IMG.BALCONY),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.PVR_02,
    type: 'rental',
    title: 'Estudio Bohemio — Zona Romántica, Puerto Vallarta',
    titleEn: 'Bohemian Studio — Romantic Zone, Puerto Vallarta',
    description:
      'Estudio artístico de 50 m² en la Zona Romántica con decoración ecléctica y terraza compartida. ' +
      'A dos cuadras del malecón y de los mejores restaurantes de la ciudad. ' +
      'Perfecto para parejas o viajeros que buscan autenticidad vallartense.',
    descriptionEn:
      '50 m² artistic studio in the Romantic Zone with eclectic decor and shared terrace. ' +
      "Two blocks from the malecón and the city's best restaurants. " +
      'Perfect for couples or travelers seeking authentic Vallarta vibes.',
    price: 18_000,
    currency: 'MXN',
    priceNegotiable: false,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 50,
    address: 'Calle Olas Altas 425, Zona Romántica',
    city: 'Puerto Vallarta',
    country: 'México',
    lat: 20.6171,
    lng: -105.2353,
    amenities: [
      'WiFi',
      'Terraza compartida',
      'Cocina equipada',
      'Aire acondicionado',
      'Lavandería',
    ],
    images: [unsplash(IMG.STUDIO), unsplash(IMG.LIVING), unsplash(IMG.ENTRANCE)],
    status: 'available',
    vendorId: null,
  },

  // ── Monterrey, México ───────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.MTY_01,
    type: 'sale',
    title: 'Departamento Ejecutivo — Valle Oriente, Monterrey',
    titleEn: 'Executive Apartment — Valle Oriente, Monterrey',
    description:
      'Departamento de 3 recámaras con vista al Cerro de la Silla en la zona más exclusiva de Monterrey. ' +
      'Torre corporativa con amenidades de primer nivel: business center, alberca climatizada y sky lounge. ' +
      'Conectividad directa con centros comerciales y la zona financiera.',
    descriptionEn:
      "3-bedroom apartment with Cerro de la Silla views in Monterrey's most exclusive area. " +
      'Corporate tower with first-class amenities: business center, heated pool and sky lounge. ' +
      'Direct connectivity with shopping centers and financial district.',
    price: 8_900_000,
    currency: 'MXN',
    priceNegotiable: true,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 145,
    address: 'Av. Lázaro Cárdenas 2400, Valle Oriente',
    city: 'Monterrey',
    country: 'México',
    lat: 25.6506,
    lng: -100.3352,
    amenities: [
      'WiFi',
      'Piscina climatizada',
      'Business center',
      'Sky lounge',
      'Gimnasio',
      'Parqueadero',
      'Seguridad 24h',
    ],
    images: [
      unsplash(IMG.BUILDING),
      unsplash(IMG.LUXURY_INT),
      unsplash(IMG.ROOFTOP),
      unsplash(IMG.LIVING),
      unsplash(IMG.KITCHEN),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.MTY_02,
    type: 'rental',
    title: 'Loft Moderno — Barrio Antiguo, Monterrey',
    titleEn: 'Modern Loft — Barrio Antiguo, Monterrey',
    description:
      'Loft renovado de 65 m² en el corazón del Barrio Antiguo con muros de cantera original. ' +
      'Techos altos, iluminación natural y decoración contemporánea. ' +
      'Rodeado de galerías, bares y la vida cultural más vibrante de Monterrey.',
    descriptionEn:
      'Renovated 65 m² loft in the heart of Barrio Antiguo with original stone walls. ' +
      'High ceilings, natural light and contemporary decor. ' +
      "Surrounded by galleries, bars and Monterrey's most vibrant cultural scene.",
    price: 22_000,
    currency: 'MXN',
    priceNegotiable: false,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 65,
    address: 'Calle Morelos 645 Ote, Barrio Antiguo',
    city: 'Monterrey',
    country: 'México',
    lat: 25.6699,
    lng: -100.3064,
    amenities: [
      'WiFi',
      'Aire acondicionado',
      'Cocina equipada',
      'Lavandería',
      'Terraza compartida',
    ],
    images: [unsplash(IMG.STUDIO), unsplash(IMG.COLONIAL), unsplash(IMG.DINING)],
    status: 'available',
    vendorId: null,
  },

  // ── Guadalajara, México ─────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.GDL_01,
    type: 'sale',
    title: 'Casa en Colonia Americana — Guadalajara',
    titleEn: 'House in Colonia Americana — Guadalajara',
    description:
      'Hermosa casa de estilo art déco de 4 recámaras en la icónica Colonia Americana. ' +
      'Jardín frontal, garage doble y acabados restaurados con respeto al patrimonio arquitectónico. ' +
      'Zona de cafés, galerías y el Parque México tapatío.',
    descriptionEn:
      'Beautiful 4-bedroom art deco house in the iconic Colonia Americana. ' +
      'Front garden, double garage and restored finishes respecting architectural heritage. ' +
      "Area of cafes, galleries and Guadalajara's Parque México.",
    price: 7_200_000,
    currency: 'MXN',
    priceNegotiable: true,
    bedrooms: 4,
    bathrooms: 2,
    areaM2: 210,
    address: 'Av. La Paz 1675, Col. Americana',
    city: 'Guadalajara',
    country: 'México',
    lat: 20.6722,
    lng: -103.3625,
    amenities: [
      'Jardín',
      'Garage doble',
      'Cocina equipada',
      'Cuarto de servicio',
      'Patrimonio arquitectónico',
    ],
    images: [
      unsplash(IMG.COLONIAL),
      unsplash(IMG.GARDEN),
      unsplash(IMG.LUXURY_INT),
      unsplash(IMG.ENTRANCE),
      unsplash(IMG.DINING),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.GDL_02,
    type: 'management',
    title: 'Departamento Nuevo — Providencia, Guadalajara',
    titleEn: 'New Apartment — Providencia, Guadalajara',
    description:
      'Departamento recién entregado de 2 recámaras en torre moderna en Providencia. ' +
      'Amenidades completas: alberca, coworking, roof garden y área de mascotas. ' +
      'Administración profesional para renta en plataformas con retorno estimado del 9%.',
    descriptionEn:
      'Newly delivered 2-bedroom apartment in modern tower in Providencia. ' +
      'Full amenities: pool, coworking, roof garden and pet area. ' +
      'Professional platform rental management with estimated 9% return.',
    price: 35_000,
    currency: 'MXN',
    priceNegotiable: false,
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 88,
    address: 'Av. Terranova 680, Providencia',
    city: 'Guadalajara',
    country: 'México',
    lat: 20.6879,
    lng: -103.3938,
    amenities: [
      'WiFi',
      'Piscina',
      'Coworking',
      'Roof garden',
      'Pet friendly',
      'Gimnasio',
      'Parqueadero',
    ],
    images: [
      unsplash(IMG.BUILDING),
      unsplash(IMG.ROOFTOP),
      unsplash(IMG.MODERN_APT),
      unsplash(IMG.LIVING),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── Cozumel, México ─────────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.CZM_01,
    type: 'rental',
    title: 'Casa de Playa con Muelle — Zona Norte, Cozumel',
    titleEn: 'Beach House with Dock — North Zone, Cozumel',
    description:
      'Casa frente al mar con muelle privado en la zona norte de Cozumel. ' +
      '3 recámaras, palapa en la playa y acceso directo al arrecife de coral. ' +
      'Perfecta para buceo, snorkel y experiencias acuáticas incomparables.',
    descriptionEn:
      'Beachfront house with private dock on the north side of Cozumel. ' +
      '3 bedrooms, palapa on the beach and direct access to the coral reef. ' +
      'Perfect for diving, snorkeling and unmatched aquatic experiences.',
    price: 55_000,
    currency: 'MXN',
    priceNegotiable: false,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 165,
    address: 'Carretera Costera Norte Km 4.5',
    city: 'Cozumel',
    country: 'México',
    lat: 20.522,
    lng: -86.9283,
    amenities: [
      'Muelle privado',
      'Palapa',
      'Vista al mar',
      'Snorkel',
      'Cocina equipada',
      'Aire acondicionado',
      'BBQ',
    ],
    images: [
      unsplash(IMG.BEACH_HOUSE),
      unsplash(IMG.OCEAN_VIEW),
      unsplash(IMG.TROPICAL),
      unsplash(IMG.POOL),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.CZM_02,
    type: 'sale',
    title: 'Penthouse con Rooftop — Centro, Cozumel',
    titleEn: 'Penthouse with Rooftop — Downtown, Cozumel',
    description:
      'Penthouse de 2 recámaras con rooftop privado y alberca en el centro de Cozumel. ' +
      'A una cuadra del malecón y del muelle de cruceros. ' +
      'Excelente inversión con alta demanda turística todo el año.',
    descriptionEn:
      '2-bedroom penthouse with private rooftop and pool in downtown Cozumel. ' +
      'One block from the malecón and cruise ship pier. ' +
      'Excellent investment with high tourist demand year-round.',
    price: 4_800_000,
    currency: 'MXN',
    priceNegotiable: true,
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 105,
    address: 'Calle 3 Sur #240, Centro',
    city: 'Cozumel',
    country: 'México',
    lat: 20.5073,
    lng: -86.9462,
    amenities: [
      'Rooftop privado',
      'Piscina',
      'WiFi',
      'Aire acondicionado',
      'Cocina equipada',
      'Vista al mar',
    ],
    images: [
      unsplash(IMG.PENTHOUSE),
      unsplash(IMG.ROOFTOP),
      unsplash(IMG.POOL),
      unsplash(IMG.BUILDING),
      unsplash(IMG.BALCONY),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── Buenos Aires, Argentina ───────────────────────────────────────────
  {
    id: PROPERTY_IDS.BUE_01,
    type: 'rental',
    title: 'Apartamento Moderno — Palermo Soho, Buenos Aires',
    titleEn: 'Modern Apartment — Palermo Soho, Buenos Aires',
    description:
      'Luminoso apartamento de 2 ambientes reciclado a nuevo en Palermo Soho. ' +
      'Piso de madera, balcón con parrilla, cocina integrada y lavarropas. ' +
      'Rodeado de bares, restaurantes y las mejores tiendas de diseño de autor.',
    descriptionEn:
      'Bright renovated 1-bedroom apartment in Palermo Soho. ' +
      'Hardwood floors, balcony with grill, open kitchen and washer. ' +
      'Surrounded by bars, restaurants and the best designer boutiques.',
    price: 850_000,
    currency: 'ARS',
    priceNegotiable: false,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 55,
    address: 'Honduras 4850, Palermo Soho',
    city: 'Buenos Aires',
    country: 'Argentina',
    lat: -34.5875,
    lng: -58.43,
    amenities: [
      'WiFi',
      'Balcón',
      'Parrilla',
      'Cocina equipada',
      'Lavarropas',
      'Aire acondicionado',
    ],
    images: [
      unsplash(IMG.MODERN_APT),
      unsplash(IMG.LIVING),
      unsplash(IMG.KITCHEN),
      unsplash(IMG.BALCONY),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.BUE_02,
    type: 'sale',
    title: 'Penthouse de Lujo — Puerto Madero, Buenos Aires',
    titleEn: 'Luxury Penthouse — Puerto Madero, Buenos Aires',
    description:
      'Espectacular penthouse de 200 m² en torre premium de Puerto Madero con vista al río y a la Reserva Ecológica. ' +
      '3 dormitorios en suite, terraza privada con jacuzzi y cochera doble. ' +
      'Amenities de primer nivel: pileta climatizada, gym, sauna y salón de eventos.',
    descriptionEn:
      'Spectacular 200 m² penthouse in premium Puerto Madero tower with river and Ecological Reserve views. ' +
      '3 en-suite bedrooms, private terrace with jacuzzi and double garage. ' +
      'First-class amenities: heated pool, gym, sauna and event room.',
    price: 450_000_000,
    currency: 'ARS',
    priceNegotiable: true,
    bedrooms: 3,
    bathrooms: 3,
    areaM2: 200,
    address: 'Olga Cossettini 1545, Puerto Madero',
    city: 'Buenos Aires',
    country: 'Argentina',
    lat: -34.6145,
    lng: -58.36,
    amenities: [
      'WiFi',
      'Pileta climatizada',
      'Gimnasio',
      'Jacuzzi',
      'Terraza privada',
      'Cochera doble',
      'Seguridad 24h',
      'Sauna',
    ],
    images: [
      unsplash(IMG.PENTHOUSE),
      unsplash(IMG.LUXURY_INT),
      unsplash(IMG.ROOFTOP),
      unsplash(IMG.POOL),
      unsplash(IMG.BEDROOM),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── Bariloche, Argentina ──────────────────────────────────────────────
  {
    id: PROPERTY_IDS.BRC_01,
    type: 'rental',
    title: 'Cabaña de Montaña — Cerro Catedral, Bariloche',
    titleEn: 'Mountain Cabin — Cerro Catedral, Bariloche',
    description:
      'Acogedora cabaña de troncos con chimenea a leña a 5 minutos de los medios de elevación de Cerro Catedral. ' +
      '2 dormitorios, living con vista al bosque de lengas y parrilla cubierta. ' +
      'Ideal para esquí en invierno y trekking en verano en plena Patagonia andina.',
    descriptionEn:
      'Cozy log cabin with wood-burning fireplace 5 minutes from Cerro Catedral ski lifts. ' +
      '2 bedrooms, living room with lenga forest views and covered grill area. ' +
      'Ideal for winter skiing and summer trekking in the Andean Patagonia.',
    price: 420_000,
    currency: 'ARS',
    priceNegotiable: false,
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 80,
    address: 'Av. de los Pioneros Km 18, Base Cerro Catedral',
    city: 'Bariloche',
    country: 'Argentina',
    lat: -41.1647,
    lng: -71.441,
    amenities: [
      'WiFi',
      'Chimenea',
      'Parrilla',
      'Estacionamiento',
      'Cocina equipada',
      'Vista al bosque',
      'Calefacción central',
    ],
    images: [
      unsplash(IMG.COLONIAL),
      unsplash(IMG.GARDEN),
      unsplash(IMG.LIVING),
      unsplash(IMG.KITCHEN),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.BRC_02,
    type: 'sale',
    title: 'Casa con Vista al Lago — Lago Nahuel Huapi, Bariloche',
    titleEn: 'Lake View House — Lago Nahuel Huapi, Bariloche',
    description:
      'Impresionante casa de 4 dormitorios con bajada privada al Lago Nahuel Huapi. ' +
      'Construcción en piedra y madera, living de doble altura con hogar a leña y deck sobre el lago. ' +
      'Jardín de 1500 m² con muelle propio y amarra para embarcación.',
    descriptionEn:
      'Stunning 4-bedroom house with private access to Lago Nahuel Huapi. ' +
      'Stone and wood construction, double-height living room with fireplace and lakefront deck. ' +
      '1500 m² garden with private dock and boat mooring.',
    price: 680_000_000,
    currency: 'ARS',
    priceNegotiable: true,
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 280,
    address: 'Av. Bustillo Km 12.5, Lago Nahuel Huapi',
    city: 'Bariloche',
    country: 'Argentina',
    lat: -41.106,
    lng: -71.3985,
    amenities: [
      'Chimenea',
      'Muelle privado',
      'Vista al lago',
      'Jardín',
      'Parrilla',
      'Estacionamiento',
      'Calefacción central',
      'Deck',
    ],
    images: [
      unsplash(IMG.TROPICAL),
      unsplash(IMG.OCEAN_VIEW),
      unsplash(IMG.GARDEN),
      unsplash(IMG.ENTRANCE),
      unsplash(IMG.LIVING),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── Mendoza, Argentina ────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.MDZ_01,
    type: 'sale',
    title: 'Finca con Viñedo — Chacras de Coria, Mendoza',
    titleEn: 'Estate with Vineyard — Chacras de Coria, Mendoza',
    description:
      'Exclusiva finca de 5 dormitorios en Chacras de Coria con viñedo propio de 2 hectáreas de Malbec. ' +
      'Casa principal con pileta, quincho gourmet y galería con vista a la Cordillera de los Andes. ' +
      'Bodega artesanal con capacidad para 5000 litros y sala de degustación.',
    descriptionEn:
      'Exclusive 5-bedroom estate in Chacras de Coria with 2-hectare Malbec vineyard. ' +
      'Main house with pool, gourmet covered grill area and gallery with Andes mountain views. ' +
      'Artisanal winery with 5000-liter capacity and tasting room.',
    price: 920_000_000,
    currency: 'ARS',
    priceNegotiable: true,
    bedrooms: 5,
    bathrooms: 4,
    areaM2: 350,
    address: 'Calle Viamonte 5200, Chacras de Coria',
    city: 'Mendoza',
    country: 'Argentina',
    lat: -32.9885,
    lng: -68.587,
    amenities: [
      'Viñedo',
      'Pileta',
      'Quincho',
      'Bodega',
      'Vista a la Cordillera',
      'Estacionamiento',
      'Jardín',
      'Sala de degustación',
    ],
    images: [
      unsplash(IMG.GARDEN),
      unsplash(IMG.POOL),
      unsplash(IMG.LUXURY_INT),
      unsplash(IMG.ENTRANCE),
      unsplash(IMG.DINING),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.MDZ_02,
    type: 'rental',
    title: 'Departamento Moderno — Ciudad de Mendoza',
    titleEn: 'Modern Apartment — Mendoza City',
    description:
      'Departamento de 2 ambientes a estrenar en el centro de Mendoza a cuadras de la Peatonal Sarmiento. ' +
      'Balcón con vista a la precordillera, cocina integrada y amenities del edificio. ' +
      'Ubicación ideal para visitar bodegas de Luján de Cuyo y Maipú.',
    descriptionEn:
      'Brand-new 1-bedroom apartment in downtown Mendoza blocks from Peatonal Sarmiento. ' +
      'Balcony with pre-Andean foothill views, open kitchen and building amenities. ' +
      'Ideal location to visit Luján de Cuyo and Maipú wineries.',
    price: 380_000,
    currency: 'ARS',
    priceNegotiable: false,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 50,
    address: 'Av. San Martín 1150, Ciudad de Mendoza',
    city: 'Mendoza',
    country: 'Argentina',
    lat: -32.8895,
    lng: -68.8458,
    amenities: [
      'WiFi',
      'Balcón',
      'Aire acondicionado',
      'Cocina equipada',
      'Pileta',
      'Gimnasio',
      'Lavarropas',
    ],
    images: [unsplash(IMG.MODERN_APT), unsplash(IMG.BALCONY), unsplash(IMG.KITCHEN)],
    status: 'available',
    vendorId: null,
  },

  // ── Salta, Argentina ──────────────────────────────────────────────────
  {
    id: PROPERTY_IDS.SLA_01,
    type: 'rental',
    title: 'Casa Colonial — Centro Histórico, Salta',
    titleEn: 'Colonial House — Historic Center, Salta',
    description:
      'Encantadora casa colonial de 3 dormitorios en el casco histórico de Salta la Linda. ' +
      'Techos con vigas de madera, patio interior con aljibe y galería con arcos coloniales. ' +
      'A pasos de la Plaza 9 de Julio, el MAAM y la Catedral.',
    descriptionEn:
      'Charming 3-bedroom colonial house in the historic center of Salta la Linda. ' +
      'Wooden beam ceilings, interior patio with well and colonial arched gallery. ' +
      'Steps from Plaza 9 de Julio, MAAM museum and the Cathedral.',
    price: 520_000,
    currency: 'ARS',
    priceNegotiable: false,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 160,
    address: 'Caseros 450, Centro Histórico',
    city: 'Salta',
    country: 'Argentina',
    lat: -24.7883,
    lng: -65.4106,
    amenities: [
      'WiFi',
      'Patio interior',
      'Cocina equipada',
      'Calefacción',
      'Galería',
      'Lavarropas',
    ],
    images: [
      unsplash(IMG.COLONIAL),
      unsplash(IMG.GARDEN),
      unsplash(IMG.DINING),
      unsplash(IMG.ENTRANCE),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.SLA_02,
    type: 'sale',
    title: 'Finca con Terreno — San Lorenzo, Salta',
    titleEn: 'Estate with Land — San Lorenzo, Salta',
    description:
      'Amplia finca de 4 dormitorios en la verde localidad de San Lorenzo, a 15 minutos del centro de Salta. ' +
      'Parque de 3000 m² con pileta, quincho y árboles frutales. Vista a los cerros verdes del Valle de Lerma. ' +
      'Construcción criolla con galerías amplias y pisos de baldosa calcárea.',
    descriptionEn:
      'Spacious 4-bedroom estate in the green town of San Lorenzo, 15 minutes from downtown Salta. ' +
      '3000 m² grounds with pool, covered grill and fruit trees. Green hillside views of Valle de Lerma. ' +
      'Traditional construction with wide galleries and limestone tile floors.',
    price: 350_000_000,
    currency: 'ARS',
    priceNegotiable: true,
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 240,
    address: 'Av. San Martín 2800, San Lorenzo',
    city: 'Salta',
    country: 'Argentina',
    lat: -24.7308,
    lng: -65.489,
    amenities: [
      'Pileta',
      'Quincho',
      'Jardín',
      'Parrilla',
      'Estacionamiento',
      'Vista a los cerros',
      'Árboles frutales',
    ],
    images: [
      unsplash(IMG.TROPICAL),
      unsplash(IMG.POOL),
      unsplash(IMG.GARDEN),
      unsplash(IMG.ENTRANCE),
      unsplash(IMG.LIVING),
    ],
    status: 'available',
    vendorId: null,
  },

  // ── Mar del Plata, Argentina ──────────────────────────────────────────
  {
    id: PROPERTY_IDS.MDP_01,
    type: 'rental',
    title: 'Departamento Frente al Mar — La Perla, Mar del Plata',
    titleEn: 'Beach Apartment — La Perla, Mar del Plata',
    description:
      'Luminoso departamento de 2 ambientes con vista directa al mar en el barrio La Perla. ' +
      'Balcón corrido, cochera cubierta y a 50 metros de la playa. ' +
      'Ideal para temporada de verano o escapadas de fin de semana todo el año.',
    descriptionEn:
      'Bright 1-bedroom apartment with direct ocean view in La Perla neighborhood. ' +
      'Wrap-around balcony, covered parking and 50 meters from the beach. ' +
      'Ideal for summer season or year-round weekend getaways.',
    price: 480_000,
    currency: 'ARS',
    priceNegotiable: false,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 48,
    address: 'Blvd. Marítimo P. Peralta Ramos 3500, La Perla',
    city: 'Mar del Plata',
    country: 'Argentina',
    lat: -38.0055,
    lng: -57.5426,
    amenities: [
      'WiFi',
      'Vista al mar',
      'Balcón',
      'Cochera',
      'Cocina equipada',
      'Calefacción',
      'Lavarropas',
    ],
    images: [
      unsplash(IMG.OCEAN_VIEW),
      unsplash(IMG.BALCONY),
      unsplash(IMG.LIVING),
      unsplash(IMG.BEDROOM),
    ],
    status: 'available',
    vendorId: null,
  },
  {
    id: PROPERTY_IDS.MDP_02,
    type: 'sale',
    title: 'Departamento Premium — Playa Grande, Mar del Plata',
    titleEn: 'Premium Condo — Playa Grande, Mar del Plata',
    description:
      'Departamento de 3 ambientes en edificio premium frente a Playa Grande con amenities completos. ' +
      'Pileta climatizada, gimnasio, SUM y seguridad 24h. Vista panorámica al mar. ' +
      'Zona exclusiva con acceso al Club Mar del Plata Golf y los mejores restaurantes.',
    descriptionEn:
      '2-bedroom condo in premium building facing Playa Grande with full amenities. ' +
      'Heated pool, gym, event room and 24h security. Panoramic ocean views. ' +
      'Exclusive area with access to Mar del Plata Golf Club and top restaurants.',
    price: 280_000_000,
    currency: 'ARS',
    priceNegotiable: true,
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 95,
    address: 'Blvd. Marítimo P. Peralta Ramos 5100, Playa Grande',
    city: 'Mar del Plata',
    country: 'Argentina',
    lat: -38.0215,
    lng: -57.5305,
    amenities: [
      'WiFi',
      'Vista al mar',
      'Pileta climatizada',
      'Gimnasio',
      'Seguridad 24h',
      'Cochera',
      'SUM',
    ],
    images: [
      unsplash(IMG.CONDO_EXT),
      unsplash(IMG.OCEAN_VIEW),
      unsplash(IMG.POOL),
      unsplash(IMG.LUXURY_INT),
      unsplash(IMG.BALCONY),
    ],
    status: 'available',
    vendorId: null,
  },
];

// ─── Datos de tours ───────────────────────────────────────────────────────────
// Tour package demo data

/**
 * 17 paquetes turísticos demo — mezcla de todos los tipos por destino.
 * 17 demo tour packages — mix of all types across destinations.
 *
 * Tipos / Types: adventure, cultural, relaxation, gastronomic, ecotourism, luxury
 */
const DEMO_TOURS: TourPackageCreationAttributes[] = [
  // ── 1. Aventura — Santa Marta (Colombia) ───────────────────────────────
  {
    id: TOUR_IDS.TOUR_01,
    type: 'adventure',
    title: 'Aventura en el Tayrona — Santa Marta',
    titleEn: 'Tayrona Adventure — Santa Marta',
    description:
      'Expedición de 3 días al Parque Nacional Natural Tayrona con senderismo por la selva tropical, ' +
      'acampada en playa Cabo San Juan y snorkel en arrecifes vírgenes. ' +
      'Guía indígena local que comparte saberes ancestrales de la Sierra Nevada. ' +
      'Incluye equipo de camping, alimentación y transporte desde Santa Marta.',
    descriptionEn:
      '3-day expedition to Tayrona National Natural Park with rainforest hiking, ' +
      'camping at Cabo San Juan beach and snorkeling in pristine reefs. ' +
      'Local indigenous guide sharing ancestral knowledge of the Sierra Nevada. ' +
      'Includes camping gear, meals and transport from Santa Marta.',
    destination: 'Santa Marta',
    country: 'Colombia',
    durationDays: 3,
    price: 280,
    currency: 'USD',
    priceIncludes: [
      'Transporte',
      'Guía indígena bilingüe',
      'Equipo de camping',
      'Alimentación completa',
      'Entrada al parque',
      'Snorkel',
    ],
    priceExcludes: ['Vuelos internacionales', 'Seguro de viaje', 'Propinas', 'Souvenirs'],
    images: [
      unsplash(TOUR_IMG.MOUNTAIN),
      unsplash(TOUR_IMG.TROPICAL_BEACH),
      unsplash(TOUR_IMG.OCEAN),
    ],
    maxCapacity: 12,
    minGroupSize: 2,
    status: 'active',
    vendorId: null,
  },

  // ── 2. Cultural — Cartagena (Colombia) ──────────────────────────────────
  {
    id: TOUR_IDS.TOUR_02,
    type: 'cultural',
    title: 'Herencia Colonial — Ciudad Amurallada, Cartagena',
    titleEn: 'Colonial Heritage — Walled City, Cartagena',
    description:
      'Recorrido de día completo por la Ciudad Amurallada de Cartagena con historiador local. ' +
      'Visita al Castillo San Felipe, Palacio de la Inquisición, iglesias coloniales y calles empedradas. ' +
      'Incluye taller de preparación de cocadas y degustación de frutas tropicales. ' +
      'Finaliza con atardecer en el Café del Mar sobre la muralla.',
    descriptionEn:
      "Full-day tour through Cartagena's Walled City with local historian. " +
      'Visit to San Felipe Castle, Inquisition Palace, colonial churches and cobblestone streets. ' +
      'Includes cocada-making workshop and tropical fruit tasting. ' +
      'Ends with sunset at Café del Mar on the city wall.',
    destination: 'Cartagena',
    country: 'Colombia',
    durationDays: 1,
    price: 95,
    currency: 'USD',
    priceIncludes: [
      'Guía historiador bilingüe',
      'Entradas a museos y castillos',
      'Taller de cocadas',
      'Degustación de frutas',
      'Transporte interno',
    ],
    priceExcludes: ['Vuelos internacionales', 'Almuerzo', 'Propinas', 'Seguro de viaje'],
    images: [
      unsplash(TOUR_IMG.COLONIAL_ST),
      unsplash(TOUR_IMG.CULTURAL_CITY),
      unsplash(TOUR_IMG.BEACH_SUNSET),
    ],
    maxCapacity: 15,
    minGroupSize: 1,
    status: 'active',
    vendorId: null,
  },

  // ── 3. Relajación — San Andrés (Colombia) ───────────────────────────────
  {
    id: TOUR_IDS.TOUR_03,
    type: 'relaxation',
    title: 'Bienestar Caribeño — San Andrés Isla',
    titleEn: 'Caribbean Wellness — San Andrés Island',
    description:
      'Retiro de bienestar de 4 días en San Andrés con sesiones de yoga al amanecer frente al mar, ' +
      'tratamientos de spa con productos naturales del Caribe y meditación guiada. ' +
      'Incluye excursión en catamarán a Johnny Cay y cena gourmet en restaurante sobre el agua. ' +
      'Alojamiento en hotel boutique eco-friendly con vista al mar de 7 colores.',
    descriptionEn:
      '4-day wellness retreat in San Andrés with sunrise yoga sessions facing the sea, ' +
      'spa treatments with natural Caribbean products and guided meditation. ' +
      'Includes catamaran excursion to Johnny Cay and gourmet dinner at overwater restaurant. ' +
      'Eco-friendly boutique hotel accommodation with Sea of Seven Colors view.',
    destination: 'San Andrés',
    country: 'Colombia',
    durationDays: 4,
    price: 650,
    currency: 'USD',
    priceIncludes: [
      'Alojamiento boutique',
      'Yoga diario',
      'Spa (2 sesiones)',
      'Catamarán a Johnny Cay',
      'Cena gourmet',
      'Transporte local',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Impuesto turístico de isla',
      'Propinas',
      'Seguro de viaje',
    ],
    images: [
      unsplash(TOUR_IMG.SPA),
      unsplash(TOUR_IMG.CATAMARAN),
      unsplash(TOUR_IMG.TROPICAL_BEACH),
      unsplash(TOUR_IMG.BEACH_SUNSET),
    ],
    maxCapacity: 10,
    minGroupSize: 1,
    status: 'active',
    vendorId: null,
  },

  // ── 4. Gastronómico — Bogotá (Colombia) ─────────────────────────────────
  {
    id: TOUR_IDS.TOUR_04,
    type: 'gastronomic',
    title: 'Sabores de Colombia — Bogotá Gastronómica',
    titleEn: 'Flavors of Colombia — Bogotá Food Tour',
    description:
      'Tour gastronómico de 2 días por los mercados y restaurantes más auténticos de Bogotá. ' +
      'Recorrido por Paloquemao, La Perseverancia y los mejores restaurantes de la Candelaria. ' +
      'Incluye clase de cocina colombiana con chef local y cena en restaurante de alta cocina bogotana. ' +
      'Degustación de café de origen, chocolate santafereño y frutas exóticas.',
    descriptionEn:
      "2-day food tour through Bogotá's most authentic markets and restaurants. " +
      'Visit Paloquemao, La Perseverancia and the best restaurants in La Candelaria. ' +
      'Includes Colombian cooking class with local chef and dinner at top Bogotá fine dining. ' +
      'Tasting of origin coffee, Santafereño chocolate and exotic fruits.',
    destination: 'Bogotá',
    country: 'Colombia',
    durationDays: 2,
    price: 185,
    currency: 'USD',
    priceIncludes: [
      'Guía gastronómico bilingüe',
      'Todas las degustaciones',
      'Clase de cocina',
      'Cena gourmet',
      'Transporte interno',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Alojamiento',
      'Bebidas alcohólicas extra',
      'Propinas',
    ],
    images: [
      unsplash(TOUR_IMG.FOOD_MARKET),
      unsplash(TOUR_IMG.CULTURAL_CITY),
      unsplash(TOUR_IMG.COLONIAL_ST),
    ],
    maxCapacity: 10,
    minGroupSize: 2,
    status: 'active',
    vendorId: null,
  },

  // ── 5. Ecoturismo — Medellín (Colombia) ─────────────────────────────────
  {
    id: TOUR_IDS.TOUR_05,
    type: 'ecotourism',
    title: 'Reserva Natural Río Claro — Antioquia',
    titleEn: 'Río Claro Nature Reserve — Antioquia',
    description:
      'Escapada de 2 días a la Reserva Natural Cañón del Río Claro desde Medellín. ' +
      'Rafting por aguas cristalinas, senderismo por cuevas de mármol y avistamiento de aves. ' +
      'Alojamiento en eco-lodge con sonido del río y cena orgánica. ' +
      'Experiencia de conexión profunda con la biodiversidad antioqueña.',
    descriptionEn:
      '2-day getaway to Río Claro Canyon Nature Reserve from Medellín. ' +
      'Rafting through crystal waters, marble cave hiking and bird watching. ' +
      'Eco-lodge accommodation with river sounds and organic dinner. ' +
      "Deep connection experience with Antioquia's biodiversity.",
    destination: 'Medellín',
    country: 'Colombia',
    durationDays: 2,
    price: 220,
    currency: 'USD',
    priceIncludes: [
      'Transporte ida y vuelta',
      'Eco-lodge',
      'Rafting',
      'Senderismo guiado',
      'Alimentación completa',
      'Seguro de actividades',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Propinas',
      'Equipo fotográfico',
      'Bebidas alcohólicas',
    ],
    images: [
      unsplash(TOUR_IMG.MOUNTAIN),
      unsplash(TOUR_IMG.OCEAN),
      unsplash(TOUR_IMG.TROPICAL_BEACH),
      unsplash(TOUR_IMG.CATAMARAN),
    ],
    maxCapacity: 14,
    minGroupSize: 4,
    status: 'active',
    vendorId: null,
  },

  // ── 6. Lujo — Cartagena (Colombia) ──────────────────────────────────────
  {
    id: TOUR_IDS.TOUR_06,
    type: 'luxury',
    title: 'Islas del Rosario VIP — Cartagena',
    titleEn: 'Rosario Islands VIP — Cartagena',
    description:
      'Experiencia de lujo de día completo en las Islas del Rosario en yate privado. ' +
      'Snorkel en arrecifes de coral, almuerzo gourmet de mariscos frescos en isla privada. ' +
      'Champagne, DJ a bordo y servicio de fotografía profesional incluido. ' +
      'Regreso al atardecer con vista a la muralla de Cartagena iluminada.',
    descriptionEn:
      'Full-day luxury experience at the Rosario Islands on a private yacht. ' +
      'Coral reef snorkeling, fresh seafood gourmet lunch on a private island. ' +
      'Champagne, onboard DJ and professional photography service included. ' +
      'Sunset return with view of illuminated Cartagena city walls.',
    destination: 'Cartagena',
    country: 'Colombia',
    durationDays: 1,
    price: 450,
    currency: 'USD',
    priceIncludes: [
      'Yate privado',
      'Almuerzo gourmet',
      'Snorkel',
      'Champagne',
      'DJ',
      'Fotografía profesional',
      'Transporte hotel-muelle',
    ],
    priceExcludes: ['Propinas', 'Seguro de viaje', 'Souvenirs'],
    images: [
      unsplash(TOUR_IMG.CATAMARAN),
      unsplash(TOUR_IMG.OCEAN),
      unsplash(TOUR_IMG.TROPICAL_BEACH),
      unsplash(TOUR_IMG.BEACH_SUNSET),
    ],
    maxCapacity: 20,
    minGroupSize: 4,
    status: 'active',
    vendorId: null,
  },

  // ── 7. Aventura — Cancún (México) ───────────────────────────────────────
  {
    id: TOUR_IDS.TOUR_07,
    type: 'adventure',
    title: 'Cenotes Secretos y Tirolesas — Riviera Maya',
    titleEn: 'Secret Cenotes & Ziplines — Riviera Maya',
    description:
      'Expedición de día completo a cenotes subterráneos secretos de la Riviera Maya. ' +
      'Circuito de tirolesas sobre la selva, nado en cenote de aguas cristalinas y rappel en caverna. ' +
      'Almuerzo tradicional maya preparado por comunidad local. ' +
      'Guía certificado con conocimiento de la cosmovisión maya y la geología de cenotes.',
    descriptionEn:
      'Full-day expedition to secret underground cenotes of the Riviera Maya. ' +
      'Zipline circuit over the jungle, swimming in crystal-clear cenote and cave rappelling. ' +
      'Traditional Mayan lunch prepared by local community. ' +
      'Certified guide with knowledge of Mayan cosmology and cenote geology.',
    destination: 'Cancún',
    country: 'México',
    durationDays: 1,
    price: 120,
    currency: 'USD',
    priceIncludes: [
      'Transporte hotel-cenotes',
      'Guía certificado bilingüe',
      'Equipo de rappel y tirolesa',
      'Almuerzo maya',
      'Entrada a cenotes',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Propinas',
      'Fotos profesionales (opcional)',
      'Seguro de viaje',
    ],
    images: [
      unsplash(TOUR_IMG.CENOTE),
      unsplash(TOUR_IMG.MOUNTAIN),
      unsplash(TOUR_IMG.TROPICAL_BEACH),
    ],
    maxCapacity: 12,
    minGroupSize: 2,
    status: 'active',
    vendorId: null,
  },

  // ── 8. Cultural — Cancún/Riviera Maya (México) ─────────────────────────
  {
    id: TOUR_IDS.TOUR_08,
    type: 'cultural',
    title: 'Chichén Itzá y Valladolid — Yucatán',
    titleEn: 'Chichén Itzá & Valladolid — Yucatán',
    description:
      'Tour de día completo a Chichén Itzá, una de las Nuevas 7 Maravillas del Mundo. ' +
      'Visita guiada a la pirámide de Kukulkán, Templo de los Guerreros y Cenote Sagrado. ' +
      'Parada en la colonial Valladolid para almuerzo en hacienda henequenera restaurada. ' +
      'Nado en cenote Zací y recorrido por el centro histórico de Valladolid.',
    descriptionEn:
      'Full-day tour to Chichén Itzá, one of the New 7 Wonders of the World. ' +
      'Guided visit to Kukulkán Pyramid, Temple of the Warriors and Sacred Cenote. ' +
      'Stop at colonial Valladolid for lunch at restored henequen hacienda. ' +
      "Swim at Cenote Zací and tour of Valladolid's historic center.",
    destination: 'Cancún',
    country: 'México',
    durationDays: 1,
    price: 85,
    currency: 'USD',
    priceIncludes: [
      'Transporte climatizado',
      'Guía arqueólogo bilingüe',
      'Entrada a Chichén Itzá',
      'Almuerzo buffet',
      'Entrada a Cenote Zací',
    ],
    priceExcludes: ['Vuelos internacionales', 'Propinas', 'Seguro de viaje', 'Souvenirs'],
    images: [
      unsplash(TOUR_IMG.MAYAN_RUINS),
      unsplash(TOUR_IMG.CENOTE),
      unsplash(TOUR_IMG.COLONIAL_ST),
      unsplash(TOUR_IMG.CULTURAL_CITY),
    ],
    maxCapacity: 18,
    minGroupSize: 1,
    status: 'active',
    vendorId: null,
  },

  // ── 9. Gastronómico — Puerto Vallarta (México) ─────────────────────────
  {
    id: TOUR_IDS.TOUR_09,
    type: 'gastronomic',
    title: 'Ruta del Tequila y Gastronomía Jalisciense — Puerto Vallarta',
    titleEn: 'Tequila Route & Jalisco Cuisine — Puerto Vallarta',
    description:
      'Tour de 2 días desde Puerto Vallarta al pueblo mágico de Tequila, Jalisco. ' +
      'Visita a destilería artesanal con cata de 5 tequilas, recorrido por campos de agave azul. ' +
      'Clase de cocina jalisciense: birria, tortas ahogadas y pozole. ' +
      'Cena maridaje en restaurante panorámico con vista a los campos de agave.',
    descriptionEn:
      '2-day tour from Puerto Vallarta to the magical town of Tequila, Jalisco. ' +
      'Visit to artisanal distillery with 5-tequila tasting, blue agave field tour. ' +
      'Jalisco cooking class: birria, tortas ahogadas and pozole. ' +
      'Pairing dinner at panoramic restaurant overlooking agave fields.',
    destination: 'Puerto Vallarta',
    country: 'México',
    durationDays: 2,
    price: 210,
    currency: 'USD',
    priceIncludes: [
      'Transporte ida y vuelta',
      'Alojamiento 1 noche',
      'Cata de tequilas',
      'Clase de cocina',
      'Cena maridaje',
      'Guía bilingüe',
    ],
    priceExcludes: ['Vuelos internacionales', 'Propinas', 'Compras de tequila', 'Seguro de viaje'],
    images: [
      unsplash(TOUR_IMG.FOOD_MARKET),
      unsplash(TOUR_IMG.CULTURAL_CITY),
      unsplash(TOUR_IMG.COLONIAL_ST),
      unsplash(TOUR_IMG.BEACH_SUNSET),
    ],
    maxCapacity: 10,
    minGroupSize: 2,
    status: 'active',
    vendorId: null,
  },

  // ── 10. Ecoturismo — Cozumel (México) ───────────────────────────────────
  {
    id: TOUR_IDS.TOUR_10,
    type: 'ecotourism',
    title: 'Arrecifes y Manglares — Cozumel Eco',
    titleEn: 'Reefs & Mangroves — Cozumel Eco',
    description:
      'Tour ecológico de día completo explorando el arrecife mesoamericano y los manglares de Cozumel. ' +
      'Snorkel guiado en Palancar y Colombia (sitios de buceo de clase mundial). ' +
      'Kayak por los manglares con avistamiento de aves y cocodrilos. ' +
      'Charla educativa sobre conservación del arrecife y almuerzo orgánico.',
    descriptionEn:
      'Full-day ecological tour exploring the Mesoamerican Reef and Cozumel mangroves. ' +
      'Guided snorkeling at Palancar and Colombia (world-class dive sites). ' +
      'Mangrove kayaking with bird and crocodile spotting. ' +
      'Educational talk on reef conservation and organic lunch.',
    destination: 'Cozumel',
    country: 'México',
    durationDays: 1,
    price: 110,
    currency: 'USD',
    priceIncludes: [
      'Transporte marítimo',
      'Equipo de snorkel',
      'Kayak',
      'Guía biólogo bilingüe',
      'Almuerzo orgánico',
      'Entrada a reserva',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Propinas',
      'Fotografía submarina',
      'Seguro de viaje',
    ],
    images: [unsplash(TOUR_IMG.SCUBA), unsplash(TOUR_IMG.OCEAN), unsplash(TOUR_IMG.TROPICAL_BEACH)],
    maxCapacity: 8,
    minGroupSize: 2,
    status: 'active',
    vendorId: null,
  },

  // ── 11. Lujo — Cancún (México) ──────────────────────────────────────────
  {
    id: TOUR_IDS.TOUR_11,
    type: 'luxury',
    title: 'Experiencia Holbox Premium — Isla Holbox',
    titleEn: 'Holbox Premium Experience — Holbox Island',
    description:
      'Escapada de lujo de 3 días a Isla Holbox con vuelo privado en avioneta desde Cancún. ' +
      'Alojamiento en villa sobre el agua, nado con tiburón ballena (en temporada) o bioluminiscencia. ' +
      'Masaje en la playa, cenas privadas con chef y tour de atardecer en flamingos. ' +
      'Experiencia exclusiva limitada a 6 personas para máxima privacidad.',
    descriptionEn:
      '3-day luxury getaway to Holbox Island with private charter flight from Cancún. ' +
      'Overwater villa accommodation, whale shark swimming (in season) or bioluminescence. ' +
      'Beach massage, private chef dinners and sunset flamingo tour. ' +
      'Exclusive experience limited to 6 guests for maximum privacy.',
    destination: 'Cancún',
    country: 'México',
    durationDays: 3,
    price: 1_200,
    currency: 'USD',
    priceIncludes: [
      'Vuelo privado ida y vuelta',
      'Villa sobre el agua',
      'Chef privado',
      'Masaje en playa',
      'Tour tiburón ballena / bioluminiscencia',
      'Transporte local',
    ],
    priceExcludes: ['Vuelos internacionales a Cancún', 'Propinas', 'Seguro de viaje'],
    images: [
      unsplash(TOUR_IMG.BEACH_SUNSET),
      unsplash(TOUR_IMG.TROPICAL_BEACH),
      unsplash(TOUR_IMG.SPA),
      unsplash(TOUR_IMG.CATAMARAN),
    ],
    maxCapacity: 6,
    minGroupSize: 2,
    status: 'active',
    vendorId: null,
  },

  // ── 12. Relajación — Puerto Vallarta (México) ──────────────────────────
  {
    id: TOUR_IDS.TOUR_12,
    type: 'relaxation',
    title: 'Retiro de Yoga y Surf — Sayulita, Nayarit',
    titleEn: 'Yoga & Surf Retreat — Sayulita, Nayarit',
    description:
      'Retiro holístico de 5 días en el pueblo mágico de Sayulita con sesiones diarias de yoga y surf. ' +
      'Alojamiento en eco-hotel boutique rodeado de selva tropical y a pasos de la playa. ' +
      'Clases de surf para todos los niveles, meditación al atardecer y alimentación plant-based. ' +
      'Excursión a las Islas Marietas (Playa Escondida) incluida.',
    descriptionEn:
      '5-day holistic retreat in the magical town of Sayulita with daily yoga and surf sessions. ' +
      'Boutique eco-hotel accommodation surrounded by tropical jungle, steps from the beach. ' +
      'Surf classes for all levels, sunset meditation and plant-based meals. ' +
      'Excursion to the Marietas Islands (Hidden Beach) included.',
    destination: 'Puerto Vallarta',
    country: 'México',
    durationDays: 5,
    price: 890,
    currency: 'USD',
    priceIncludes: [
      'Alojamiento eco-hotel',
      'Yoga diario',
      'Clases de surf',
      'Alimentación plant-based',
      'Excursión Islas Marietas',
      'Transporte local',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Propinas',
      'Seguro de viaje',
      'Equipo de surf personal',
    ],
    images: [
      unsplash(TOUR_IMG.SPA),
      unsplash(TOUR_IMG.BEACH_SUNSET),
      unsplash(TOUR_IMG.TROPICAL_BEACH),
      unsplash(TOUR_IMG.OCEAN),
    ],
    maxCapacity: 12,
    minGroupSize: 1,
    status: 'active',
    vendorId: null,
  },

  // ── 13. Cultural — Buenos Aires (Argentina) ─────────────────────────────
  {
    id: TOUR_IDS.TOUR_13,
    type: 'cultural',
    title: 'Tango, Arte y Gastronomía — Buenos Aires',
    titleEn: 'Tango, Art & Gastronomy — Buenos Aires',
    description:
      'Experiencia cultural de 2 días recorriendo los barrios más emblemáticos de Buenos Aires. ' +
      'San Telmo: mercado de antigüedades, milonga y clase de tango. La Boca: Caminito y arte urbano. ' +
      'Recoleta: cementerio monumental, MALBA y librerías icónicas. ' +
      'Culmina con cena-show de tango en una milonga tradicional de San Telmo.',
    descriptionEn:
      "2-day cultural experience through Buenos Aires' most iconic neighborhoods. " +
      'San Telmo: antique market, milonga and tango class. La Boca: Caminito and street art. ' +
      'Recoleta: monumental cemetery, MALBA museum and iconic bookstores. ' +
      'Culminates with a tango dinner-show at a traditional San Telmo milonga.',
    destination: 'Buenos Aires',
    country: 'Argentina',
    durationDays: 2,
    price: 160,
    currency: 'USD',
    priceIncludes: [
      'Guía cultural bilingüe',
      'Clase de tango',
      'Cena-show de tango',
      'Entradas a museos',
      'Transporte interno',
    ],
    priceExcludes: ['Vuelos internacionales', 'Alojamiento', 'Propinas', 'Seguro de viaje'],
    images: [
      unsplash(TOUR_IMG.CULTURAL_CITY),
      unsplash(TOUR_IMG.COLONIAL_ST),
      unsplash(TOUR_IMG.FOOD_MARKET),
    ],
    maxCapacity: 14,
    minGroupSize: 1,
    status: 'active',
    vendorId: null,
  },

  // ── 14. Aventura — Bariloche (Argentina) ────────────────────────────────
  {
    id: TOUR_IDS.TOUR_14,
    type: 'adventure',
    title: 'Travesía de los Lagos — Bariloche',
    titleEn: 'Lake Crossing Adventure — Bariloche',
    description:
      'Expedición de aventura de 3 días en la Patagonia andina desde Bariloche. ' +
      'Día 1: Circuito Chico, mirador Punto Panorámico y Cerro Campanario. ' +
      'Día 2: Trekking a Refugio Frey y ascenso a Cerro Catedral con vista a los lagos. ' +
      'Día 3: Kayak en el brazo Blest del Lago Nahuel Huapi y bosque de arrayanes.',
    descriptionEn:
      '3-day adventure expedition in the Andean Patagonia from Bariloche. ' +
      'Day 1: Circuito Chico, Punto Panorámico viewpoint and Cerro Campanario. ' +
      'Day 2: Trekking to Refugio Frey and Cerro Catedral ascent with lake views. ' +
      "Day 3: Kayaking in Lago Nahuel Huapi's Brazo Blest and arrayanes forest.",
    destination: 'Bariloche',
    country: 'Argentina',
    durationDays: 3,
    price: 240,
    currency: 'USD',
    priceIncludes: [
      'Transporte 4x4',
      'Guía de montaña bilingüe',
      'Equipo de kayak',
      'Almuerzo de montaña (3 días)',
      'Entrada a Parque Nacional',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Alojamiento',
      'Propinas',
      'Seguro de viaje',
      'Equipo de trekking personal',
    ],
    images: [
      unsplash(TOUR_IMG.MOUNTAIN),
      unsplash(TOUR_IMG.OCEAN),
      unsplash(TOUR_IMG.CATAMARAN),
      unsplash(TOUR_IMG.TROPICAL_BEACH),
    ],
    maxCapacity: 10,
    minGroupSize: 2,
    status: 'active',
    vendorId: null,
  },

  // ── 15. Gastronómico — Mendoza (Argentina) ──────────────────────────────
  {
    id: TOUR_IDS.TOUR_15,
    type: 'gastronomic',
    title: 'Ruta del Vino — Mendoza',
    titleEn: 'Wine Route — Mendoza',
    description:
      'Tour enológico y gastronómico de 2 días por las mejores bodegas de Mendoza. ' +
      'Día 1: Luján de Cuyo — visita a 3 bodegas boutique con cata de Malbec reserva y almuerzo maridaje. ' +
      'Día 2: Valle de Uco — Tupungato y Vista Flores, bodegas de alta gama y asado de bodega. ' +
      'Incluye sommelier dedicado y transporte entre viñedos con vista a los Andes.',
    descriptionEn:
      "2-day wine and gastronomy tour through Mendoza's finest wineries. " +
      'Day 1: Luján de Cuyo — visit 3 boutique wineries with reserve Malbec tasting and pairing lunch. ' +
      'Day 2: Valle de Uco — Tupungato and Vista Flores, premium wineries and winery barbecue. ' +
      'Includes dedicated sommelier and vineyard transport with Andes views.',
    destination: 'Mendoza',
    country: 'Argentina',
    durationDays: 2,
    price: 195,
    currency: 'USD',
    priceIncludes: [
      'Transporte entre bodegas',
      'Sommelier bilingüe',
      'Catas en 6 bodegas',
      'Almuerzo maridaje',
      'Asado de bodega',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Alojamiento',
      'Compras de vinos',
      'Propinas',
      'Seguro de viaje',
    ],
    images: [
      unsplash(TOUR_IMG.FOOD_MARKET),
      unsplash(TOUR_IMG.MOUNTAIN),
      unsplash(TOUR_IMG.CULTURAL_CITY),
      unsplash(TOUR_IMG.COLONIAL_ST),
    ],
    maxCapacity: 10,
    minGroupSize: 2,
    status: 'active',
    vendorId: null,
  },

  // ── 16. Ecoturismo — Salta (Argentina) ──────────────────────────────────
  {
    id: TOUR_IDS.TOUR_16,
    type: 'ecotourism',
    title: 'Quebrada de Humahuaca — Salta',
    titleEn: 'Humahuaca Gorge — Salta',
    description:
      'Expedición de 3 días por la Quebrada de Humahuaca, Patrimonio de la Humanidad. ' +
      'Día 1: Purmamarca y el Cerro de los 7 Colores, Paseo de los Colorados al atardecer. ' +
      'Día 2: Tilcara (Pucará y jardín botánico), taller de tejido con artesanos locales. ' +
      'Día 3: Humahuaca, el Monumento a la Independencia y Serranía del Hornocal (14 colores).',
    descriptionEn:
      '3-day expedition through the Quebrada de Humahuaca, a UNESCO World Heritage Site. ' +
      'Day 1: Purmamarca and the Hill of 7 Colors, Paseo de los Colorados at sunset. ' +
      'Day 2: Tilcara (Pucará ruins and botanical garden), weaving workshop with local artisans. ' +
      'Day 3: Humahuaca, Independence Monument and Serranía del Hornocal (14 colors).',
    destination: 'Salta',
    country: 'Argentina',
    durationDays: 3,
    price: 210,
    currency: 'USD',
    priceIncludes: [
      'Transporte 4x4',
      'Guía bilingüe',
      'Alojamiento 2 noches',
      'Desayunos y almuerzos regionales',
      'Taller de tejido',
      'Entradas a sitios',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Cenas',
      'Propinas',
      'Seguro de viaje',
      'Souvenirs artesanales',
    ],
    images: [
      unsplash(TOUR_IMG.MOUNTAIN),
      unsplash(TOUR_IMG.COLONIAL_ST),
      unsplash(TOUR_IMG.CULTURAL_CITY),
    ],
    maxCapacity: 12,
    minGroupSize: 2,
    status: 'active',
    vendorId: null,
  },

  // ── 17. Relajación — Mar del Plata (Argentina) ─────────────────────────
  {
    id: TOUR_IDS.TOUR_17,
    type: 'relaxation',
    title: 'Costa Atlántica — Mar del Plata',
    titleEn: 'Atlantic Coast — Mar del Plata',
    description:
      'Escapada de relax de 2 días en la costa atlántica argentina. ' +
      'Día 1: Circuito costero por Playa Grande, spa termal con masaje y cena gourmet de mariscos en el Puerto. ' +
      'Día 2: Visita a la colonia de lobos marinos en Banquina de Pescadores, ' +
      'paseo por la Rambla y tarde libre en playas del sur con servicio de carpa VIP.',
    descriptionEn:
      '2-day relaxation getaway on the Argentine Atlantic coast. ' +
      'Day 1: Coastal circuit through Playa Grande, thermal spa with massage and gourmet seafood dinner at the Port. ' +
      'Day 2: Visit to the sea lion colony at Banquina de Pescadores, ' +
      'Rambla promenade and free afternoon at southern beaches with VIP beach tent service.',
    destination: 'Mar del Plata',
    country: 'Argentina',
    durationDays: 2,
    price: 145,
    currency: 'USD',
    priceIncludes: [
      'Transporte costero',
      'Sesión de spa y masaje',
      'Cena gourmet de mariscos',
      'Carpa VIP de playa',
      'Guía bilingüe',
    ],
    priceExcludes: [
      'Vuelos internacionales',
      'Alojamiento',
      'Propinas',
      'Seguro de viaje',
      'Bebidas alcohólicas',
    ],
    images: [
      unsplash(TOUR_IMG.BEACH_SUNSET),
      unsplash(TOUR_IMG.SPA),
      unsplash(TOUR_IMG.OCEAN),
      unsplash(TOUR_IMG.FOOD_MARKET),
    ],
    maxCapacity: 12,
    minGroupSize: 1,
    status: 'active',
    vendorId: null,
  },
];

// ─── Datos de disponibilidad ──────────────────────────────────────────────────
// Tour availability demo data

/**
 * Genera 51 registros de disponibilidad — 3 fechas por cada tour en los próximos 30 días.
 * Generates 51 availability records — 3 dates per tour within the next 30 days.
 */
function buildTourAvailabilities(): TourAvailabilityCreationAttributes[] {
  const tourIds = Object.values(TOUR_IDS);
  const availIds = Object.values(AVAILABILITY_IDS);
  const records: TourAvailabilityCreationAttributes[] = [];

  /**
   * Offset de días por tour para distribución realista.
   * Day offsets per tour for realistic distribution.
   * 3 fechas por tour, espaciadas para cubrir los 30 días.
   */
  const dateOffsets: ReadonlyArray<readonly [number, number, number]> = [
    [3, 12, 25], // Tour 01
    [2, 14, 27], // Tour 02
    [5, 15, 28], // Tour 03
    [1, 10, 22], // Tour 04
    [4, 16, 29], // Tour 05
    [6, 13, 24], // Tour 06
    [2, 11, 23], // Tour 07
    [3, 17, 26], // Tour 08
    [7, 18, 30], // Tour 09
    [1, 9, 21], // Tour 10
    [5, 14, 25], // Tour 11
    [4, 12, 28], // Tour 12
    [3, 11, 24], // Tour 13 — Buenos Aires
    [6, 15, 27], // Tour 14 — Bariloche
    [2, 13, 26], // Tour 15 — Mendoza
    [4, 16, 29], // Tour 16 — Salta
    [1, 10, 22], // Tour 17 — Mar del Plata
  ];

  /**
   * Capacidad y reservas parciales para realismo.
   * Capacity and partial bookings for realism.
   */
  const spotsConfig: ReadonlyArray<readonly [number, number]> = [
    [10, 2],
    [12, 0],
    [8, 3], // Tour 01 dates
    [14, 1],
    [14, 0],
    [14, 2], // Tour 02 dates
    [8, 0],
    [10, 1],
    [8, 2], // Tour 03 dates
    [9, 3],
    [10, 0],
    [10, 1], // Tour 04 dates
    [12, 0],
    [14, 2],
    [12, 1], // Tour 05 dates
    [15, 3],
    [18, 0],
    [20, 2], // Tour 06 dates
    [10, 1],
    [12, 0],
    [10, 3], // Tour 07 dates
    [15, 2],
    [18, 1],
    [15, 0], // Tour 08 dates
    [8, 0],
    [10, 2],
    [8, 1], // Tour 09 dates
    [6, 2],
    [8, 0],
    [6, 1], // Tour 10 dates
    [5, 1],
    [6, 0],
    [5, 2], // Tour 11 dates
    [10, 0],
    [12, 1],
    [10, 3], // Tour 12 dates
    [12, 1],
    [14, 0],
    [12, 3], // Tour 13 dates — Buenos Aires
    [8, 2],
    [10, 0],
    [8, 1], // Tour 14 dates — Bariloche
    [9, 0],
    [10, 2],
    [8, 1], // Tour 15 dates — Mendoza
    [10, 1],
    [12, 0],
    [10, 2], // Tour 16 dates — Salta
    [10, 0],
    [12, 2],
    [10, 1], // Tour 17 dates — Mar del Plata
  ];

  let configIdx = 0;

  for (let tourIdx = 0; tourIdx < tourIds.length; tourIdx++) {
    const tourId = tourIds[tourIdx] as string;
    const offsets = dateOffsets[tourIdx] as readonly [number, number, number];

    for (let dateIdx = 0; dateIdx < 3; dateIdx++) {
      const availId = availIds[configIdx] as string;
      const [available, booked] = spotsConfig[configIdx] as readonly [number, number];
      const dayOffset = offsets[dateIdx] as number;

      records.push({
        id: availId,
        tourPackageId: tourId,
        date: futureDate(dayOffset),
        availableSpots: available,
        bookedSpots: booked,
        isBlocked: false,
        notes: null,
      });

      configIdx++;
    }
  }

  return records;
}

// ─── Funciones de seed exportadas ─────────────────────────────────────────────
// Exported seed functions

/**
 * Inserta las 30 propiedades demo en la base de datos.
 * Inserts the 30 demo properties into the database.
 *
 * Idempotente: omite propiedades que ya existen por ID.
 * Idempotent: skips properties that already exist by ID.
 */
export async function seedDemoProperties(): Promise<void> {
  console.log('\n🏠 Seeding demo properties (30 — Colombia + México + Argentina)...');

  for (const prop of DEMO_PROPERTIES) {
    const exists = await Property.findByPk(prop.id as string);
    if (!exists) {
      await Property.create(prop);
      console.log(`  ✅ ${prop.title}`);
    } else {
      console.log(`  ⏭️  Ya existe: ${prop.title}`);
    }
  }

  console.log('✅ Demo properties seeded (30 total)');
}

/**
 * Inserta los 17 paquetes turísticos demo en la base de datos.
 * Inserts the 17 demo tour packages into the database.
 *
 * Idempotente: omite tours que ya existen por ID.
 * Idempotent: skips tours that already exist by ID.
 */
export async function seedDemoTours(): Promise<void> {
  console.log('\n✈️  Seeding demo tour packages (17 — Colombia + México + Argentina)...');

  for (const tour of DEMO_TOURS) {
    const exists = await TourPackage.findByPk(tour.id as string);
    if (!exists) {
      await TourPackage.create(tour);
      console.log(`  ✅ ${tour.title}`);
    } else {
      console.log(`  ⏭️  Ya existe: ${tour.title}`);
    }
  }

  console.log('✅ Demo tour packages seeded (17 total)');
}

/**
 * Inserta las 51 disponibilidades de tour (3 fechas × 17 tours) en la base de datos.
 * Inserts the 51 tour availabilities (3 dates × 17 tours) into the database.
 *
 * Idempotente: omite registros que ya existen por ID.
 * Idempotent: skips records that already exist by ID.
 */
export async function seedDemoTourAvailabilities(): Promise<void> {
  console.log('\n📅 Seeding tour availabilities (51 — 3 dates × 17 tours)...');

  const availabilities = buildTourAvailabilities();

  for (const avail of availabilities) {
    const exists = await TourAvailability.findByPk(avail.id as string);
    if (!exists) {
      await TourAvailability.create(avail);
      console.log(
        `  ✅ Tour ${avail.tourPackageId.slice(-3)} → ${avail.date}  (${avail.availableSpots} spots, ${avail.bookedSpots} booked)`
      );
    } else {
      console.log(`  ⏭️  Ya existe: ${avail.tourPackageId.slice(-3)} → ${avail.date}`);
    }
  }

  console.log('✅ Tour availabilities seeded (51 total)');
}

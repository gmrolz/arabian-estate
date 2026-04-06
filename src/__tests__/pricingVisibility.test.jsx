import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PropertyCard from '../components/PropertyCard';
import { ListingPreviewCard } from '../components/ListingPreviewCard';
import { LocaleProvider } from '../context/LocaleContext';
import { SiteProvider } from '../context/SiteContext';

// Mock data for testing
const baseListing = {
  id: 1,
  unit_code: 'TEST-001',
  title_ar: 'شقة فاخرة',
  title_en: 'Luxury Apartment',
  developer: 'Developer',
  developer_ar: 'المطور',
  developer_en: 'Developer',
  project: 'New Capital',
  project_ar: 'العاصمة الإدارية',
  project_en: 'New Capital',
  location: 'Cairo',
  unit_type: 'Apartment',
  area: 150,
  rooms: 2,
  toilets: 2,
  downpayment: '500000',
  monthly_inst: '5000',
  annual_payment: '60000',
  price: '2000000',
  finishing: 'Fully Finished',
  delivery: 'Ready to Move',
  images: [],
  featured: false,
  site_id: 'test-site',
};

describe('Pricing Visibility Logic', () => {
  const wrapper = ({ children }) => (
    <SiteProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </SiteProvider>
  );

  describe('PropertyCard - Frontend Display', () => {
    it('should show all pricing options when all visibility flags are true', () => {
      const listing = {
        ...baseListing,
        show_price: true,
        show_downpayment: true,
        show_monthly: true,
        show_full_price: true,
        show_annual: true,
      };

      render(<PropertyCard listing={listing} />, { wrapper });

      // Check that pricing is displayed
      expect(screen.getByText(/Pay Now|الدفعة الأولى/)).toBeInTheDocument();
      expect(screen.getByText(/Monthly|الشهري/)).toBeInTheDocument();
      expect(screen.getByText(/Full Unit Price|السعر الاجمالي/)).toBeInTheDocument();
    });

    it('should show only Pay Now and Monthly by default (Full Price and Annual unchecked)', () => {
      const listing = {
        ...baseListing,
        show_price: true,
        show_downpayment: true,
        show_monthly: true,
        show_full_price: false,
        show_annual: false,
      };

      render(<PropertyCard listing={listing} />, { wrapper });

      // Should show Pay Now and Monthly
      expect(screen.getByText(/Pay Now|الدفعة الأولى/)).toBeInTheDocument();
      expect(screen.getByText(/Monthly|الشهري/)).toBeInTheDocument();

      // Should NOT show Full Price or Annual
      expect(screen.queryByText(/Full Unit Price|السعر الاجمالي/)).not.toBeInTheDocument();
    });

    it('should show "استعلم عن السعر" when all pricing options are hidden', () => {
      const listing = {
        ...baseListing,
        show_price: true,
        show_downpayment: false,
        show_monthly: false,
        show_full_price: false,
        show_annual: false,
      };

      render(<PropertyCard listing={listing} />, { wrapper });

      // Should show "Ask for Price" button
      expect(screen.getByText(/استعلم عن السعر|Ask for Price/)).toBeInTheDocument();
    });

    it('should hide pricing section when show_price is false', () => {
      const listing = {
        ...baseListing,
        show_price: false,
        show_downpayment: true,
        show_monthly: true,
        show_full_price: true,
        show_annual: true,
      };

      render(<PropertyCard listing={listing} />, { wrapper });

      // Should NOT show any pricing
      expect(screen.queryByText(/Pay Now|الدفعة الأولى/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Monthly|الشهري/)).not.toBeInTheDocument();
    });

    it('should show only selected pricing options', () => {
      const listing = {
        ...baseListing,
        show_price: true,
        show_downpayment: false,
        show_monthly: true,
        show_full_price: true,
        show_annual: false,
      };

      render(<PropertyCard listing={listing} />, { wrapper });

      // Should show Monthly and Full Price
      expect(screen.getByText(/Monthly|الشهري/)).toBeInTheDocument();
      expect(screen.getByText(/Full Unit Price|السعر الاجمالي/)).toBeInTheDocument();

      // Should NOT show Pay Now or Annual
      expect(screen.queryByText(/Pay Now|الدفعة الأولى/)).not.toBeInTheDocument();
    });
  });

  describe('ListingPreviewCard - Admin Preview', () => {
    it('should sync with PropertyCard logic - show Pay Now and Monthly by default', () => {
      const listing = {
        ...baseListing,
        show_price: true,
        show_downpayment: true,
        show_monthly: true,
        show_full_price: false,
        show_annual: false,
      };

      render(<ListingPreviewCard listing={listing} />, { wrapper });

      // Should show Pay Now and Monthly
      expect(screen.getByText(/Pay Now|الدفعة الأولى/)).toBeInTheDocument();
      expect(screen.getByText(/Monthly|الشهري/)).toBeInTheDocument();

      // Should NOT show Full Price or Annual
      expect(screen.queryByText(/Full Unit Price|السعر الاجمالي/)).not.toBeInTheDocument();
    });

    it('should show "استعلم عن السعر" when all pricing options are hidden', () => {
      const listing = {
        ...baseListing,
        show_price: true,
        show_downpayment: false,
        show_monthly: false,
        show_full_price: false,
        show_annual: false,
      };

      render(<ListingPreviewCard listing={listing} />, { wrapper });

      // Should show "Ask for Price"
      expect(screen.getByText(/استعلم عن السعر|Ask for Price/)).toBeInTheDocument();
    });

    it('should display all pricing options when all flags are true', () => {
      const listing = {
        ...baseListing,
        show_price: true,
        show_downpayment: true,
        show_monthly: true,
        show_full_price: true,
        show_annual: true,
      };

      render(<ListingPreviewCard listing={listing} />, { wrapper });

      // Should show all pricing
      expect(screen.getByText(/Pay Now|الدفعة الأولى/)).toBeInTheDocument();
      expect(screen.getByText(/Monthly|الشهري/)).toBeInTheDocument();
      expect(screen.getByText(/Full Unit Price|السعر الاجمالي/)).toBeInTheDocument();
      expect(screen.getByText(/Annual|دفعة سنويه/)).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('should have correct default visibility values', () => {
      // Test that defaults match requirements:
      // - show_price: true (default)
      // - show_downpayment: true (default)
      // - show_monthly: true (default)
      // - show_full_price: false (default)
      // - show_annual: false (default)

      const listing = {
        ...baseListing,
        // Omit visibility flags to test defaults
      };

      render(<PropertyCard listing={listing} />, { wrapper });

      // With defaults, should show Pay Now and Monthly
      expect(screen.getByText(/Pay Now|الدفعة الأولى/)).toBeInTheDocument();
      expect(screen.getByText(/Monthly|الشهري/)).toBeInTheDocument();
    });
  });
});

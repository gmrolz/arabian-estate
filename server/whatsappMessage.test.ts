import { describe, it, expect } from 'vitest';

// Helper to extract WhatsApp message from encoded URL
function extractMessageFromWALink(waLink) {
    const match = waLink.match(/\?text=(.+)$/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
}

// Helper to format number (simulating formatNumberReadable)
function formatNumberReadable(num) {
    if (!num) return '0';
    const str = String(num).replace(/,/g, '');
    const n = parseInt(str, 10);
    if (isNaN(n)) return String(num);
    return n.toLocaleString('en-US');
}

// Simulate the WhatsApp message generation logic
function generateWAMessage(listing) {
    const {
        id: listingId,
        title_ar, title_en,
        project_ar, project_en,
        developer_ar, developer_en,
        location,
        area, rooms, toilets,
        finishing,
        delivery,
        price, downpayment, monthly_inst, annual_payment,
    } = listing;

    const isAr = true; // Default to Arabic for testing
    const title = isAr ? title_ar : title_en;
    const project = isAr ? project_ar : project_en;
    const developer = isAr ? developer_ar : developer_en;

    // Calculate payment duration in years
    const monthlyPaymentDuration = monthly_inst && price && downpayment 
        ? Math.round((price - downpayment) / monthly_inst / 12)
        : null;

    const message = [
        `*Unit Inquiry – Arabian Estate*`,
        `*Listing ID: ${listingId}*`,
        ``,
        `*${title || project}*`,
        `Project: ${project}`,
        `Developer: ${developer}`,
        `Location: ${location}`,
        ``,
        `*Unit Specifications:*`,
        `Area: ${area} m²`,
        `Bedrooms: ${rooms}`,
        `Bathrooms: ${toilets}`,
        `Finishing: ${finishing}`,
        `Delivery: ${delivery}`,
        ``,
        `*Pricing Details:*`,
        `Total Price: EGP ${formatNumberReadable(price)}`,
        `Down Payment: EGP ${formatNumberReadable(downpayment)}`,
        `Monthly Installment: EGP ${formatNumberReadable(monthly_inst)}`,
        ...(monthlyPaymentDuration ? [`Payment Duration: ${monthlyPaymentDuration} years`] : []),
        ...(annual_payment ? [`Annual Payment Option: EGP ${formatNumberReadable(annual_payment)}`] : []),
        ``,
        `Please send me more details and available payment plans. Thank you!`
    ].join('\n');

    return message;
}

describe('WhatsApp Message Generation', () => {
    it('should include listing ID in the message', () => {
        const listing = {
            id: 8,
            title_ar: 'شقة 3 غرف',
            title_en: '3BR Apartment',
            project_ar: 'تيرا',
            project_en: 'Tierra',
            developer_ar: 'SED',
            developer_en: 'SED',
            location: '6th Settlement',
            area: 150,
            rooms: 3,
            toilets: 3,
            finishing: 'Semi-Finished',
            delivery: '4 Years',
            price: '8800000',
            downpayment: '220000',
            monthly_inst: '75000',
            annual_payment: null,
        };

        const message = generateWAMessage(listing);
        expect(message).toContain('*Listing ID: 8*');
    });

    it('should include full pricing details', () => {
        const listing = {
            id: 8,
            title_ar: 'شقة 3 غرف',
            title_en: '3BR Apartment',
            project_ar: 'تيرا',
            project_en: 'Tierra',
            developer_ar: 'SED',
            developer_en: 'SED',
            location: '6th Settlement',
            area: 150,
            rooms: 3,
            toilets: 3,
            finishing: 'Semi-Finished',
            delivery: '4 Years',
            price: '8800000',
            downpayment: '220000',
            monthly_inst: '75000',
            annual_payment: null,
        };

        const message = generateWAMessage(listing);
        expect(message).toContain('Total Price: EGP 8,800,000');
        expect(message).toContain('Down Payment: EGP 220,000');
        expect(message).toContain('Monthly Installment: EGP 75,000');
    });

    it('should calculate payment duration correctly', () => {
        const listing = {
            id: 8,
            title_ar: 'شقة 3 غرف',
            title_en: '3BR Apartment',
            project_ar: 'تيرا',
            project_en: 'Tierra',
            developer_ar: 'SED',
            developer_en: 'SED',
            location: '6th Settlement',
            area: 150,
            rooms: 3,
            toilets: 3,
            finishing: 'Semi-Finished',
            delivery: '4 Years',
            price: '8800000',
            downpayment: '220000',
            monthly_inst: '75000',
            annual_payment: null,
        };

        const message = generateWAMessage(listing);
        // (8,800,000 - 220,000) / 75,000 / 12 = 8,580,000 / 75,000 / 12 = 114.4 / 12 ≈ 9.53 years → rounds to 10 years
        // Actually: 8580000 / 75000 = 114.4 months = 9.53 years → rounds to 10
        expect(message).toContain('Payment Duration: 10 years');
    });

    it('should include annual payment option when available', () => {
        const listing = {
            id: 10,
            title_ar: 'شقة 2 غرف',
            title_en: '2BR Apartment',
            project_ar: 'نول',
            project_en: 'Noll',
            developer_ar: 'Kleek',
            developer_en: 'Kleek',
            location: '6th Settlement',
            area: 120,
            rooms: 2,
            toilets: 2,
            finishing: 'Fully Finished',
            delivery: '3 Years',
            price: '5500000',
            downpayment: '555000',
            monthly_inst: '70000',
            annual_payment: '840000',
        };

        const message = generateWAMessage(listing);
        expect(message).toContain('Annual Payment Option: EGP 840,000');
    });

    it('should not include payment duration if monthly_inst is missing', () => {
        const listing = {
            id: 12,
            title_ar: 'شقة',
            title_en: 'Apartment',
            project_ar: 'مشروع',
            project_en: 'Project',
            developer_ar: 'Developer',
            developer_en: 'Developer',
            location: 'Location',
            area: 100,
            rooms: 2,
            toilets: 2,
            finishing: 'Finished',
            delivery: '2 Years',
            price: '5000000',
            downpayment: '500000',
            monthly_inst: null,
            annual_payment: null,
        };

        const message = generateWAMessage(listing);
        expect(message).not.toContain('Payment Duration:');
    });

    it('should include unit specifications', () => {
        const listing = {
            id: 8,
            title_ar: 'شقة 3 غرف',
            title_en: '3BR Apartment',
            project_ar: 'تيرا',
            project_en: 'Tierra',
            developer_ar: 'SED',
            developer_en: 'SED',
            location: '6th Settlement',
            area: 150,
            rooms: 3,
            toilets: 3,
            finishing: 'Semi-Finished',
            delivery: '4 Years',
            price: '8800000',
            downpayment: '220000',
            monthly_inst: '75000',
            annual_payment: null,
        };

        const message = generateWAMessage(listing);
        expect(message).toContain('Area: 150 m²');
        expect(message).toContain('Bedrooms: 3');
        expect(message).toContain('Bathrooms: 3');
        expect(message).toContain('Finishing: Semi-Finished');
        expect(message).toContain('Delivery: 4 Years');
    });

    it('should format large numbers with commas', () => {
        const listing = {
            id: 1,
            title_ar: 'فيلا',
            title_en: 'Villa',
            project_ar: 'مشروع فاخر',
            project_en: 'Luxury Project',
            developer_ar: 'Developer',
            developer_en: 'Developer',
            location: 'New Cairo',
            area: 500,
            rooms: 5,
            toilets: 4,
            finishing: 'Luxury Finished',
            delivery: '1 Year',
            price: '25000000',
            downpayment: '5000000',
            monthly_inst: '200000',
            annual_payment: '2400000',
        };

        const message = generateWAMessage(listing);
        expect(message).toContain('Total Price: EGP 25,000,000');
        expect(message).toContain('Down Payment: EGP 5,000,000');
        expect(message).toContain('Annual Payment Option: EGP 2,400,000');
    });
});

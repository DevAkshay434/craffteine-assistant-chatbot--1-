import type { Order } from '../types';

export interface ShopifyCredentials {
    domain: string;
    accessToken: string;
}

// In a real application, you cannot call the Shopify Admin API directly from the browser
// due to CORS security policies and the risk of exposing your secret access token.
// This API call must be made from a secure backend server.
// To allow you to test the 'Modify Order' flow, we are returning mock data here.
const MOCK_ORDERS: Order[] = [
    {
        id: 'gid://shopify/Order/1234567890123',
        name: '#1001',
        date: new Date('2023-10-26T10:00:00Z').toISOString(),
        formula: 'Capsule, 150mg, Citrus Zing, Medium',
    },
    {
        id: 'gid://shopify/Order/2345678901234',
        name: '#1002',
        date: new Date('2023-10-27T11:30:00Z').toISOString(),
        formula: 'Stick Pack, 200mg, Berry Blast, High',
    },
    {
        id: 'gid://shopify/Order/3456789012345',
        name: '#1003',
        date: new Date('2023-10-28T09:15:00Z').toISOString(),
        formula: 'Pod, 100mg, Tropical Fusion, Low',
    },
];


export const getCustomerOrders = async (credentials: ShopifyCredentials): Promise<Order[]> => {
    console.log("Using mock data for Shopify orders. A real implementation requires a backend proxy.");

    // Simulate network delay to make the experience feel real
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return the mock data instead of making a failing API call
    return Promise.resolve(MOCK_ORDERS);
};

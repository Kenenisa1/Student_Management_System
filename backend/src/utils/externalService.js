import axios from 'axios';
import axiosRetry from 'axios-retry';
import CircuitBreaker from 'opossum';

// Retry with Exponential Backoff
const apiClient = axios.create({
    timeout: 3000,
});

axiosRetry(apiClient, { 
    retries: 3, 
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500;
    }
});

/**
 * Simulate an external service call (e.g., payment gateway, SMS provider)
 */
const makeExternalCall = async (endpoint, data) => {
    // Replace with real external service URL
    const response = await apiClient.post(`https://jsonplaceholder.typicode.com${endpoint}`, data);
    return response.data;
};

// Circuit Breaker options
const breakerOptions = {
    timeout: 4000,               // If function takes longer than 4 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 10000          // Wait 10 seconds before trying again
};

export const externalServiceBreaker = new CircuitBreaker(makeExternalCall, breakerOptions);

externalServiceBreaker.on('open', () => console.warn('[CircuitBreaker] OPEN: External service is down.'));
externalServiceBreaker.on('halfOpen', () => console.warn('[CircuitBreaker] HALF-OPEN: Testing if external service is back.'));
externalServiceBreaker.on('close', () => console.log('[CircuitBreaker] CLOSED: External service is stable.'));

export const callExternalAPI = async (endpoint, data) => {
    try {
        const result = await externalServiceBreaker.fire(endpoint, data);
        return result;
    } catch (error) {
        if (error.code === 'EOPENBREAKER') {
            throw new Error('Service is currently unavailable due to high failure rate. Please try again later.');
        }
        throw error;
    }
};

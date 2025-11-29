/**
 * Risk Management Service
 * Handles API requests for risk management features
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Create a stop-loss order
 * 
 * @param {Object} orderData - Order data
 * @param {string} orderData.symbol - Stock symbol
 * @param {number} orderData.quantity - Number of shares
 * @param {number} orderData.triggerPrice - Price at which to trigger the stop-loss
 * @param {string} orderData.timeInForce - Time constraint for the order (GTC, IOC, FOK)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Created order
 */
export const createStopLossOrder = async (orderData, token) => {
  try {
    const response = await fetch(`${API_URL}/api/risk-management/stop-loss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create stop-loss order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating stop-loss order:', error);
    throw error;
  }
};

/**
 * Create a take-profit order
 * 
 * @param {Object} orderData - Order data
 * @param {string} orderData.symbol - Stock symbol
 * @param {number} orderData.quantity - Number of shares
 * @param {number} orderData.targetPrice - Price at which to take profit
 * @param {string} orderData.timeInForce - Time constraint for the order (GTC, IOC, FOK)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Created order
 */
export const createTakeProfitOrder = async (orderData, token) => {
  try {
    const response = await fetch(`${API_URL}/api/risk-management/take-profit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create take-profit order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating take-profit order:', error);
    throw error;
  }
};

/**
 * Create a trailing stop order
 * 
 * @param {Object} orderData - Order data
 * @param {string} orderData.symbol - Stock symbol
 * @param {number} orderData.quantity - Number of shares
 * @param {number} orderData.trailAmount - Trail amount (price or percentage)
 * @param {string} orderData.trailType - Trail type (PRICE or PERCENTAGE)
 * @param {string} orderData.timeInForce - Time constraint for the order (GTC, IOC, FOK)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Created order
 */
export const createTrailingStopOrder = async (orderData, token) => {
  try {
    const response = await fetch(`${API_URL}/api/risk-management/trailing-stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create trailing stop order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating trailing stop order:', error);
    throw error;
  }
};

/**
 * Create a stop-limit order
 * 
 * @param {Object} orderData - Order data
 * @param {string} orderData.symbol - Stock symbol
 * @param {number} orderData.quantity - Number of shares
 * @param {number} orderData.stopPrice - Price at which to trigger the stop
 * @param {number} orderData.limitPrice - Maximum/minimum price at which to execute
 * @param {string} orderData.timeInForce - Time constraint for the order (GTC, IOC, FOK)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Created order
 */
export const createStopLimitOrder = async (orderData, token) => {
  try {
    const response = await fetch(`${API_URL}/api/risk-management/stop-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create stop-limit order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating stop-limit order:', error);
    throw error;
  }
};

/**
 * Get all risk management orders
 * 
 * @param {string} token - Authentication token
 * @returns {Promise<Array>} - List of orders
 */
export const getRiskManagementOrders = async (token) => {
  try {
    const response = await fetch(`${API_URL}/api/risk-management/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch risk management orders');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching risk management orders:', error);
    throw error;
  }
};

/**
 * Cancel a risk management order
 * 
 * @param {string} orderId - Order ID to cancel
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Cancellation result
 */
export const cancelRiskManagementOrder = async (orderId, token) => {
  try {
    const response = await fetch(`${API_URL}/api/risk-management/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling order:', error);
    throw error;
  }
}; 
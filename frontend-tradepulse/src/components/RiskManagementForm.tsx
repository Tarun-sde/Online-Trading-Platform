'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { 
  createStopLossOrder, 
  createTakeProfitOrder, 
  createTrailingStopOrder, 
  createStopLimitOrder 
} from '@/services/riskManagement.service';

interface RiskManagementFormProps {
  symbol: string;
  currentPrice: number;
  onOrderCreated?: (order: any) => void;
}

type OrderType = 'stop-loss' | 'take-profit' | 'trailing-stop' | 'stop-limit';

const RiskManagementForm = ({ symbol, currentPrice, onOrderCreated }: RiskManagementFormProps) => {
  const { user } = useAuth();
  const [orderType, setOrderType] = useState<OrderType>('stop-loss');
  const [quantity, setQuantity] = useState<string>('1');
  const [triggerPrice, setTriggerPrice] = useState<string>(currentPrice ? (currentPrice * 0.95).toFixed(2) : '');
  const [targetPrice, setTargetPrice] = useState<string>(currentPrice ? (currentPrice * 1.05).toFixed(2) : '');
  const [trailAmount, setTrailAmount] = useState<string>('2');
  const [trailType, setTrailType] = useState<'PRICE' | 'PERCENTAGE'>('PERCENTAGE');
  const [stopPrice, setStopPrice] = useState<string>(currentPrice ? (currentPrice * 0.95).toFixed(2) : '');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice ? (currentPrice * 0.94).toFixed(2) : '');
  const [timeInForce, setTimeInForce] = useState<string>('GTC');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update prices when current price changes
  if (currentPrice !== parseFloat(triggerPrice) / 0.95) {
    setTriggerPrice((currentPrice * 0.95).toFixed(2));
    setTargetPrice((currentPrice * 1.05).toFixed(2));
    setStopPrice((currentPrice * 0.95).toFixed(2));
    setLimitPrice((currentPrice * 0.94).toFixed(2));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create orders');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      let order;
      
      switch (orderType) {
        case 'stop-loss':
          order = await createStopLossOrder({
            symbol,
            quantity: parseFloat(quantity),
            triggerPrice: parseFloat(triggerPrice),
            timeInForce
          }, 'mock-token'); // In a real app, this would be user.token
          setSuccessMessage(`Stop-loss order created at $${triggerPrice}`);
          break;
          
        case 'take-profit':
          order = await createTakeProfitOrder({
            symbol,
            quantity: parseFloat(quantity),
            targetPrice: parseFloat(targetPrice),
            timeInForce
          }, 'mock-token');
          setSuccessMessage(`Take-profit order created at $${targetPrice}`);
          break;
          
        case 'trailing-stop':
          order = await createTrailingStopOrder({
            symbol,
            quantity: parseFloat(quantity),
            trailAmount: parseFloat(trailAmount),
            trailType,
            timeInForce
          }, 'mock-token');
          setSuccessMessage(`Trailing stop order created (${trailAmount}${trailType === 'PERCENTAGE' ? '%' : ' USD'})`);
          break;
          
        case 'stop-limit':
          order = await createStopLimitOrder({
            symbol,
            quantity: parseFloat(quantity),
            stopPrice: parseFloat(stopPrice),
            limitPrice: parseFloat(limitPrice),
            timeInForce
          }, 'mock-token');
          setSuccessMessage(`Stop-limit order created (Stop: $${stopPrice}, Limit: $${limitPrice})`);
          break;
      }
      
      if (onOrderCreated && order) {
        onOrderCreated(order);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
      <h2 className="text-xl font-bold text-white mb-4">Risk Management</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-md">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-800 rounded-md">
          <p className="text-sm text-green-300">{successMessage}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Order Type
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              type="button"
              className={`py-2 px-3 text-sm font-medium rounded-lg ${
                orderType === 'stop-loss'
                  ? 'bg-red-800 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setOrderType('stop-loss')}
            >
              Stop Loss
            </button>
            <button
              type="button"
              className={`py-2 px-3 text-sm font-medium rounded-lg ${
                orderType === 'take-profit'
                  ? 'bg-green-800 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setOrderType('take-profit')}
            >
              Take Profit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`py-2 px-3 text-sm font-medium rounded-lg ${
                orderType === 'trailing-stop'
                  ? 'bg-indigo-800 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setOrderType('trailing-stop')}
            >
              Trailing Stop
            </button>
            <button
              type="button"
              className={`py-2 px-3 text-sm font-medium rounded-lg ${
                orderType === 'stop-limit'
                  ? 'bg-blue-800 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setOrderType('stop-limit')}
            >
              Stop Limit
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-1">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            min="0.01"
            step="0.01"
            className="bg-gray-800 border border-gray-700 text-white rounded-lg w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        
        {orderType === 'stop-loss' && (
          <div className="mb-4">
            <label htmlFor="triggerPrice" className="block text-sm font-medium text-gray-300 mb-1">
              Trigger Price
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
              <input
                type="number"
                id="triggerPrice"
                min="0.01"
                step="0.01"
                className="bg-gray-800 border border-gray-700 text-white rounded-lg w-full p-2.5 pl-8 focus:ring-blue-500 focus:border-blue-500"
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(e.target.value)}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Current price: ${currentPrice.toFixed(2)}
            </p>
          </div>
        )}
        
        {orderType === 'take-profit' && (
          <div className="mb-4">
            <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-300 mb-1">
              Target Price
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
              <input
                type="number"
                id="targetPrice"
                min="0.01"
                step="0.01"
                className="bg-gray-800 border border-gray-700 text-white rounded-lg w-full p-2.5 pl-8 focus:ring-blue-500 focus:border-blue-500"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Current price: ${currentPrice.toFixed(2)}
            </p>
          </div>
        )}
        
        {orderType === 'trailing-stop' && (
          <div className="mb-4">
            <label htmlFor="trailAmount" className="block text-sm font-medium text-gray-300 mb-1">
              Trail Amount
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                id="trailAmount"
                min="0.01"
                step="0.01"
                className="bg-gray-800 border border-gray-700 text-white rounded-lg w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={trailAmount}
                onChange={(e) => setTrailAmount(e.target.value)}
                required
              />
              <select
                className="bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                value={trailType}
                onChange={(e) => setTrailType(e.target.value as 'PRICE' | 'PERCENTAGE')}
              >
                <option value="PERCENTAGE">%</option>
                <option value="PRICE">USD</option>
              </select>
            </div>
          </div>
        )}
        
        {orderType === 'stop-limit' && (
          <>
            <div className="mb-4">
              <label htmlFor="stopPrice" className="block text-sm font-medium text-gray-300 mb-1">
                Stop Price
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                <input
                  type="number"
                  id="stopPrice"
                  min="0.01"
                  step="0.01"
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg w-full p-2.5 pl-8 focus:ring-blue-500 focus:border-blue-500"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="limitPrice" className="block text-sm font-medium text-gray-300 mb-1">
                Limit Price
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                <input
                  type="number"
                  id="limitPrice"
                  min="0.01"
                  step="0.01"
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg w-full p-2.5 pl-8 focus:ring-blue-500 focus:border-blue-500"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Current price: ${currentPrice.toFixed(2)}
              </p>
            </div>
          </>
        )}
        
        <div className="mb-4">
          <label htmlFor="timeInForce" className="block text-sm font-medium text-gray-300 mb-1">
            Time In Force
          </label>
          <select
            id="timeInForce"
            className="bg-gray-800 border border-gray-700 text-white rounded-lg w-full p-2.5 focus:ring-blue-500 focus:border-blue-500"
            value={timeInForce}
            onChange={(e) => setTimeInForce(e.target.value)}
          >
            <option value="GTC">Good Till Canceled (GTC)</option>
            <option value="IOC">Immediate or Cancel (IOC)</option>
            <option value="FOK">Fill or Kill (FOK)</option>
            <option value="DAY">Day Order</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !user}
          className={`w-full bg-gradient-to-r ${
            orderType === 'stop-loss' ? 'from-red-600 to-red-700' :
            orderType === 'take-profit' ? 'from-green-600 to-green-700' :
            orderType === 'trailing-stop' ? 'from-indigo-600 to-indigo-700' :
            'from-blue-600 to-blue-700'
          } text-white font-medium rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoading || !user ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
          }`}
        >
          {isLoading ? 'Creating Order...' : 'Create Order'}
        </button>
        
        {!user && (
          <p className="mt-2 text-xs text-center text-yellow-500">
            You must be logged in to create orders
          </p>
        )}
      </form>
    </div>
  );
};

export default RiskManagementForm; 
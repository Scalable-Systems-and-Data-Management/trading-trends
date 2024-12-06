// src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback } from "react";

interface WebSocketConfig {
  // For APIs that require authentication
  apiKey?: string;
  // For APIs that require subscription messages
  subscribeMessage?: any;
  // For connection options
  protocols?: string | string[];
  // Reconnection settings
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface WebSocketHookReturn<T> {
  data: T | null;
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: any) => void;
}

export function useWebSocket<T>(
  url: string,
  config: WebSocketConfig = {}
): WebSocketHookReturn<T> {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const {
    apiKey,
    subscribeMessage,
    protocols,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 5000,
  } = config;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url, protocols);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setReconnectCount(0);

        // If API requires authentication
        if (apiKey) {
          ws.send(JSON.stringify({ type: "auth", apiKey }));
        }

        // If API requires subscription message
        if (subscribeMessage) {
          ws.send(JSON.stringify(subscribeMessage));
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (e) {
          setError("Failed to parse message data");
        }
      };

      ws.onerror = (event) => {
        setError("WebSocket error occurred");
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setError("WebSocket connection closed");

        // Implement reconnection logic
        if (reconnect && reconnectCount < reconnectAttempts) {
          setTimeout(() => {
            setReconnectCount((prev) => prev + 1);
            connect();
          }, reconnectInterval * Math.pow(2, reconnectCount)); // Exponential backoff
        }
      };

      setSocket(ws);
    } catch (error) {
      setError(`Failed to create WebSocket connection: ${error}`);
    }
  }, [
    url,
    protocols,
    apiKey,
    subscribeMessage,
    reconnect,
    reconnectAttempts,
    reconnectInterval,
    reconnectCount,
  ]);

  const sendMessage = useCallback(
    (message: any) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        setError("WebSocket is not connected");
      }
    },
    [socket]
  );

  useEffect(() => {
    connect();
    return () => {
      socket?.close();
    };
  }, [connect]);

  return { data, isConnected, error, sendMessage };
}

// Example usages:

// 1. Binance WebSocket API
export function useBinanceWebSocket(symbol: string = "btcusdt") {
  return useWebSocket<any>(`wss://stream.binance.com:9443/ws/${symbol}@trade`, {
    subscribeMessage: {
      method: "SUBSCRIBE",
      params: [`${symbol}@trade`],
      id: 1,
    },
  });
}

// 2. Kraken WebSocket API
export function useKrakenWebSocket(pairs: string[] = ["XBT/USD"]) {
  return useWebSocket<any>("wss://ws.kraken.com", {
    subscribeMessage: {
      event: "subscribe",
      pair: pairs,
      subscription: { name: "ticker" },
    },
  });
}

// 3. Coinbase WebSocket API
export function useCoinbaseWebSocket(products: string[] = ["BTC-USD"]) {
  return useWebSocket<any>("wss://ws-feed.pro.coinbase.com", {
    subscribeMessage: {
      type: "subscribe",
      product_ids: products,
      channels: ["ticker"],
    },
  });
}

// 4. Generic authenticated WebSocket
export function useAuthenticatedWebSocket<T>(url: string, apiKey: string) {
  return useWebSocket<T>(url, {
    apiKey,
    reconnect: true,
    reconnectAttempts: 3,
    reconnectInterval: 3000,
  });
}

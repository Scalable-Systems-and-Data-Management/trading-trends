import React from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MarketData {
  timestamp: string;
  data: {
    [symbol: string]: {
      price: number;
      volume: number;
      change: number;
    };
  };
}

export const Display = () => {
  const { data, isConnected, error } = useWebSocket<MarketData>(
    "ws://localhost:8000/status"
  );

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Market Data</h1>
        <Badge variant={isConnected ? "success" : "secondary"}>
          {isConnected ? "Live" : "Connecting..."}
        </Badge>
      </div>

      {!data && isConnected && (
        <div className="text-center text-muted-foreground">
          Waiting for data...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data &&
          Object.entries(data.data).map(([symbol, stockData]) => (
            <Card key={symbol} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>{symbol}</span>
                  <Badge
                    variant={stockData.change >= 0 ? "default" : "destructive"}
                  >
                    <span className="flex items-center gap-1">
                      {stockData.change >= 0 ? (
                        <ArrowUpIcon className="h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4" />
                      )}
                      {stockData.change.toFixed(2)}%
                    </span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    ${stockData.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Volume: {stockData.volume.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {data && (
        <div className="mt-6 text-sm text-muted-foreground text-center">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default Display;

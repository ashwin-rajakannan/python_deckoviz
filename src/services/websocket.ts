import { WebSocketData } from '../types/websocket';

const WS_URL = 'wss://api.deckoviz.com/ws/917d9043-e457-402b-9130-fccf1e7b5677';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(onMessage: (data: WebSocketData) => void) {
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket Connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketData;
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket Disconnected');
        this.reconnect(onMessage);
      };
    } catch (error) {
      console.error('WebSocket Connection Error:', error);
    }
  }

  private reconnect(onMessage: (data: WebSocketData) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect(onMessage);
      }, 3000);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new WebSocketService(); 
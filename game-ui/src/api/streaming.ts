import { API_BASE_URL } from './client';

export interface StreamMessage {
  type: 'start' | 'stop' | 'frame' | 'error';
  room_id?: string;
  data?: any;
}

class StreamingManager {
  private ws: WebSocket | null = null;
  private room_id: string = '';

  async connect(roomId: string, token: string): Promise<void> {
    this.room_id = roomId;
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
    const wsEndpoint = `${wsUrl}/api/stream/${roomId}?token=${token}`;
    this.ws = new WebSocket(wsEndpoint);
    this.ws.onopen = () => console.log('Stream connected');
  }

  startStream(): void {
    if (this.ws) this.ws.send(JSON.stringify({ type: 'start', room_id: this.room_id }));
  }

  stopStream(): void {
    if (this.ws) this.ws.send(JSON.stringify({ type: 'stop', room_id: this.room_id }));
  }

  disconnect(): void {
    if (this.ws) this.ws.close();
  }
}

export const streamingManager = new StreamingManager();

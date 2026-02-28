import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';

export interface ChatMessage {
    user_id: string; // Add explicit user_id
    sender: string;
    message: string;
    timestamp: string;
    isSelf: boolean;
}

export const useGameWebSocket = () => {
    const { groupId, userId } = useGame();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!groupId) return;

        // Determine WS URL based on API URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
        // Remove protocol to get host
        const host = apiUrl.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}//${host}/room/ws/${groupId}?userId=${userId}`;

        console.log(`🔌 Connecting WS: ${wsUrl}`);
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('Chat Connected');
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Transform backend message format to frontend format
                // Backend usually sends: { sender: "id", message: "text", ... }
                setMessages((prev) => [...prev, {
                    user_id: data.user_id || data.sender, // Capture user_id
                    sender: data.sender || 'Unknown',
                    message: data.message,
                    timestamp: new Date().toLocaleTimeString(),
                    isSelf: data.sender === userId
                }]);
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        return () => {
            ws.current?.close();
        };
    }, [groupId, userId]);

    const sendMessage = (text: string) => {
        try {
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ message: text }));
            } else {
                console.warn("WebSocket is not open. Current state:", ws.current?.readyState);
            }
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    return { messages, sendMessage };
};

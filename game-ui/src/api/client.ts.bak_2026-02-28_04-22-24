import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Force logout on 401
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export interface StartGameResponse {
    ok: boolean;
    session_id: string;
    group_id: string;
    state: any;
}

export interface GameState {
    // Generic state wrapper
    [key: string]: any;
}

// SHARED SLUG MAP
// Keys: Frontend friendly slugs (used in GameLobby)
// Values: Backend router prefixes (defined in main.py)
const slugMap: { [key: string]: string } = {
    'story-weaver': 'the-story-weaver',
    'world-builders': 'world-builders',
    'truth-layer': 'truth-and-layer',
    'memory-mosaic': 'memory-mosaic',
    'alignment-game': 'the-alignment-game',
    'myth-maker': 'myth-maker-arena',
    'compass-game': 'the-compass-game',
    'echoes': 'echoes-and-expressions',
    'serendipity': 'serendipity-strings',
    'long-quest': 'the-long-quest'
};

const getBackendSlug = (frontendSlug: string): string => {
    return slugMap[frontendSlug] || frontendSlug;
};

export const startGame = async (gameSlug: string, userId: string): Promise<StartGameResponse> => {
    const backendSlug = getBackendSlug(gameSlug);
    const targetUrl = `/games/${backendSlug}/start`;
    console.log(`Starting game: ${gameSlug} -> ${backendSlug} [${targetUrl}]`);

    const response = await apiClient.post(targetUrl, { user_id: userId, ai_enabled: true });
    return response.data;
};

export const sendAction = async (gameSlug: string, sessionId: string, userId: string, action: string, content: string): Promise<any> => {
    const backendSlug = getBackendSlug(gameSlug);
    const targetUrl = `/games/${backendSlug}/action`;

    const response = await apiClient.post(targetUrl, {
        session_id: sessionId,
        user_id: userId,
        action: action,
        content: content
    });
    return response.data;
};

export const joinGame = async (gameSlug: string, sessionId: string, userId: string): Promise<any> => {
    const backendSlug = getBackendSlug(gameSlug);
    const targetUrl = `/games/${backendSlug}/join`;

    const response = await apiClient.post(targetUrl, { session_id: sessionId, user_id: userId });
    return response.data;
}

// Multiplayer Room Functions
export const createRoom = async (gameSlug: string, userId?: string, maxPlayers: number = 5): Promise<any> => {
    // Ensure we use the backend-recognized slug
    const backendSlug = getBackendSlug(gameSlug);
    const response = await apiClient.post(`/games/multiplayer/create`, {
        game_slug: backendSlug,
        user_id: userId,
        max_players: maxPlayers
    });
    return response.data;
};

export const joinRoom = async (roomCode: string, userId?: string): Promise<any> => {
    const response = await apiClient.post(`/games/multiplayer/join`, { room_code: roomCode, user_id: userId });
    return response.data;
};

export const toggleReady = async (sessionId: string, isReady: boolean, userId?: string, truthAnalysisEnabled?: boolean, persona?: string): Promise<any> => {
    const response = await apiClient.post(`/games/multiplayer/ready`, {
        session_id: sessionId,
        user_id: userId,
        is_ready: isReady,
        truth_analysis_enabled: truthAnalysisEnabled,
        persona: persona
    });
    return response.data;
};

export const startGameMulti = async (sessionId: string): Promise<any> => {
    const response = await apiClient.post(`/games/multiplayer/start/${sessionId}`);
    return response.data;
};

export const getRoomDetails = async (sessionId: string): Promise<any> => {
    const response = await apiClient.get(`/games/multiplayer/session/${sessionId}`);
    return response.data;
};

export const getMyGames = async (userId: string): Promise<any> => {
    // If guest, pass as query param. valid auth token header handled by interceptor.
    const response = await apiClient.get(`/games/multiplayer/my-games?user_id=${userId}`);
    return response.data;
};

export const getAllGames = async (): Promise<any> => {
    const response = await apiClient.get(`/games/multiplayer/list`);
    return response.data;
};

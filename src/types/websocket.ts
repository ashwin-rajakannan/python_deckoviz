export interface Artwork {
  id: string;
  imageUrl: string;
  title: string;
}

export interface WebSocketData {
  artworks: Artwork[];
} 
export interface GalleryImage {
  id: string;
  file: string;
  music?: string;
  title?: string;
}

export interface GalleryResponse {
  results: GalleryImage[];
} 
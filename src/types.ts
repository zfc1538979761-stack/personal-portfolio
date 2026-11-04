export type MediaBase = {
  id: string;
  src: string;
  caption: string;
  width: number;
  height: number;
  sourceNote?: string;
};
export type ImageMedia = MediaBase & {
  kind: "image";
  displaySrc?: string;
  alt: string;
  sourceIndex?: number;
  metrics?: { likes: number; likesLabel?: string; plays: string; collections: string };
};
export type VideoMedia = MediaBase & { kind: "video"; poster: string };
export type Media = ImageMedia | VideoMedia;
export type Destination = { id: string; name: string; photos: ImageMedia[] };

export type PhotoSource = 'library' | 'camera';
export type PhotoErrorCode =
  | 'unsupported_heic' | 'unsupported_format' | 'too_large' | 'permission_denied'
  | 'decode_failed' | 'aborted' | 'unavailable';

export class PhotoError extends Error {
  readonly code: PhotoErrorCode;
  constructor(code: PhotoErrorCode) {
    super(code);
    this.name = 'PhotoError';
    this.code = code;
  }
}

export interface PreparedPhotoVariant {
  bytes: Uint8Array;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  size: number;
}

/** Only normalized copies. No filename, EXIF, GPS or original URI reaches the uploader. */
export interface PreparedPhoto {
  main: PreparedPhotoVariant;
  thumbnail: PreparedPhotoVariant;
  previewUri: string;
  /** Call on cancel, replacement, logout, successful upload, and component unmount. */
  dispose(): void;
}

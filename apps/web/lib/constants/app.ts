export const APP_NAME = "Couple Space" as const;

export const APP_DESCRIPTION =
  "A private realtime space designed for two people." as const;

export const MAX_ROOM_PARTICIPANTS = 2 as const;

export const CANVAS = {
  MAX_ELEMENTS: 2_000,
  MAX_TEXT_LENGTH: 10_000,
  MAX_STICKY_LENGTH: 2_000,
  MAX_DRAWING_POINTS: 10_000,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024
} as const;

export const USER = {
  MAX_DISPLAY_NAME_LENGTH: 40
} as const;
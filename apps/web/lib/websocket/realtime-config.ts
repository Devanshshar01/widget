import {
  REALTIME
} from "@/lib/constants/realtime";

export const REALTIME_CONFIG = {
  connectionTimeoutMs:
    REALTIME.CONNECTION_TIMEOUT_MS,

  heartbeatIntervalMs:
    REALTIME.HEARTBEAT_INTERVAL_MS,

  reconnectInitialDelayMs:
    REALTIME.RECONNECT.INITIAL_DELAY_MS,

  reconnectMaxDelayMs:
    REALTIME.RECONNECT.MAX_DELAY_MS,

  reconnectBackoffMultiplier:
    REALTIME.RECONNECT.BACKOFF_MULTIPLIER,

  reconnectJitterRatio:
    REALTIME.RECONNECT.JITTER_RATIO,

  maxReconnectAttempts:
    REALTIME.RECONNECT.MAX_ATTEMPTS
} as const;
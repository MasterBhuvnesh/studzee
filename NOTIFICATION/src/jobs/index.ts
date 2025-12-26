import { startHeartbeatJob } from "./heartbeat";
import { startTokenCleanupJob } from "./cleanupTokens";

export const startAllJobs = () => {
  startHeartbeatJob();
  startTokenCleanupJob();
};

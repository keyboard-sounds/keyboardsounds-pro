import mixpanel from 'mixpanel-browser';
import { GetVersion } from '../../wailsjs/go/main/wailsConfig';

import { GetAnalyticsID, GetAnalyticsLastPingTimeMS, UpdateAnalyticsLastPingTime } from '../../wailsjs/go/main/App';

const MIXPANEL_TOKEN = 'd0a9ab37f1c8ec0c085ea203f89cb312';
const STORAGE_KEYS = {
  ANALYTICS_ID: 'kbs_analytics_id',
  LAST_PING_TIME: 'kbs_last_ping_time',
};

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize Mixpanel
mixpanel.init(MIXPANEL_TOKEN, {
  debug: true,
  protocol: 'https',
  persistence: 'localStorage',
});

// Track the current timeout so we can clear it if needed
let nextPingTimeout = null;

/**
 * Checks if 24 hours have passed since the last ping
 * @returns {Promise<boolean>} True if 24 hours have passed or if never pinged
 */
async function shouldSendPing() {
  const lastPingTime = await GetAnalyticsLastPingTimeMS();
  
  if (lastPingTime === null) {
    // Never pinged before, should send
    return true;
  }
  
  const now = Date.now();
  const timeSinceLastPing = now - lastPingTime;
  
  return timeSinceLastPing >= TWENTY_FOUR_HOURS_MS;
}

/**
 * Gets the application version
 * @returns {Promise<string>} The app version
 */
async function getAppVersion() {
  try {
    return await GetVersion();
  } catch (error) {
    console.error('Failed to get app version:', error);
    return 'unknown';
  }
}

/**
 * Calculates the time until the next ping should be sent
 * @returns {Promise<number>} Milliseconds until next ping (0 if should ping now)
 */
async function getTimeUntilNextPing() {
  const lastPingTime = await GetAnalyticsLastPingTimeMS();
  
  if (lastPingTime === null) {
    // Never pinged before, should ping now
    return 0;
  }
  
  const now = Date.now();
  const timeSinceLastPing = now - lastPingTime;
  const timeUntilNextPing = TWENTY_FOUR_HOURS_MS - timeSinceLastPing;
  
  // If 24 hours have already passed, ping now
  return Math.max(0, timeUntilNextPing);
}

/**
 * Schedules the next ping check
 */
async function scheduleNextPing() {
  // Clear any existing timeout
  if (nextPingTimeout !== null) {
    clearTimeout(nextPingTimeout);
    nextPingTimeout = null;
  }
  
  const timeUntilNextPing = await getTimeUntilNextPing();
  
  if (timeUntilNextPing === 0) {
    // Should ping immediately
    track();
  } else {
    // Schedule the next ping
    nextPingTimeout = setTimeout(() => {
      track();
    }, timeUntilNextPing);
    
    const totalMinutes = Math.floor(timeUntilNextPing / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    console.log(`Next analytics ping scheduled in ${hours} hours, ${minutes} minutes`);
  }
}

/**
 * Tracks an "Application Ping" event to Mixpanel
 * Only sends if 24 hours have passed since the last ping
 * After sending, schedules the next ping
 * @returns {Promise<void>}
 */
async function track() {
  // Check if we should send a ping
  const shouldSend = await shouldSendPing();
  if (!shouldSend) {
    console.log('Skipping analytics ping - 24 hours have not passed since last ping');
    // Still schedule the next ping even if we're skipping this one
    await scheduleNextPing();
    return;
  }
  
  try {
    const analyticsId = await GetAnalyticsID();
    const appVersion = await getAppVersion();
    
    // Send the event
    mixpanel.track('Application Ping', {
      distinct_id: analyticsId,
      app_version: appVersion,
    });
    
    // Update the last ping time
    await UpdateAnalyticsLastPingTime();
    
    console.log('Analytics ping sent successfully');
    
    // Schedule the next ping (24 hours from now)
    await scheduleNextPing();
  } catch (error) {
    console.error('Failed to send analytics ping:', error);
    // Still try to schedule the next ping even if this one failed
    await scheduleNextPing();
  }
}

/**
 * Initializes analytics tracking and schedules the first ping
 * Should be called when the app starts
 */
export async function initializeAnalytics() {
  // Check if we should ping immediately, otherwise schedule it
  await scheduleNextPing();
}


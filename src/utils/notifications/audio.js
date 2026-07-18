// Audio utility for notification sounds
// Handles browser audio unlock and playback

let notificationAudio = null;
let audioUnlocked = false;
let soundEnabled = false;

/**
 * Initialize audio - must be called on user interaction
 * This unlocks the audio context for future playback
 * Returns a promise that resolves to true if successful
 */
export const enableNotificationSound = () => {
  try {
    // Create audio instance if it doesn't exist
    if (!notificationAudio) {
      notificationAudio = new Audio('/assets/sounds/notifications.wav');
      notificationAudio.preload = 'auto';
      notificationAudio.volume = 1;
    }

    // Unlock audio by playing once silently (required by browsers)
    notificationAudio.volume = 0;
    return notificationAudio.play()
      .then(() => {
        notificationAudio.pause();
        notificationAudio.currentTime = 0;
        notificationAudio.volume = 1;
        audioUnlocked = true;
        soundEnabled = true;
        localStorage.setItem('notification_sound_enabled', 'true');
        console.log('🔓 Notification sound enabled and unlocked');
        return true;
      })
      .catch(err => {
        console.error('❌ Audio unlock failed:', err);
        audioUnlocked = false;
        soundEnabled = false;
        localStorage.setItem('notification_sound_enabled', 'false');
        return false;
      });
  } catch (error) {
    console.error('❌ Error enabling notification sound:', error);
    audioUnlocked = false;
    soundEnabled = false;
    return Promise.resolve(false);
  }
};

/**
 * Disable notification sound
 */
export const disableNotificationSound = () => {
  soundEnabled = false;
  localStorage.setItem('notification_sound_enabled', 'false');
  console.log('🔇 Notification sound disabled');
};

/**
 * Toggle notification sound on/off
 * Returns a promise that resolves to the new state
 */
export const toggleNotificationSound = () => {
  if (soundEnabled) {
    disableNotificationSound();
    return Promise.resolve(false);
  } else {
    return enableNotificationSound();
  }
};

/**
 * Check if sound is enabled
 */
export const isSoundEnabled = () => {
  // Check localStorage first
  const storedPreference = localStorage.getItem('notification_sound_enabled');
  if (storedPreference === 'true') {
    soundEnabled = true;
  }
  return soundEnabled && audioUnlocked;
};

/**
 * Play notification sound
 * Only plays if sound is enabled and audio is unlocked
 */
export const playNotificationSound = () => {
  try {
    // Check if sound is enabled
    if (!isSoundEnabled()) {
      console.log('🔇 Sound is disabled, skipping playback');
      return;
    }

    // Check if audio is unlocked
    if (!audioUnlocked || !notificationAudio) {
      console.warn('⚠️ Audio not unlocked yet, cannot play sound');
      return;
    }

    // Reset audio to beginning and play
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(err => {
      console.warn('⚠️ Sound playback blocked:', err.message);
      // If playback fails, try to unlock again
      if (err.name === 'NotAllowedError' || err.name === 'NotSupportedError') {
        console.log('🔄 Attempting to re-unlock audio...');
        audioUnlocked = false;
      }
    });
  } catch (error) {
    console.error('❌ Error playing notification sound:', error);
  }
};

/**
 * Initialize audio on page load if preference is enabled
 * Note: This won't unlock audio (requires user interaction)
 * but it will prepare the audio object
 */
export const initializeNotificationAudio = () => {
  try {
    const storedPreference = localStorage.getItem('notification_sound_enabled');
    if (storedPreference === 'true') {
      soundEnabled = true;
      // Create audio instance but don't unlock yet
      if (!notificationAudio) {
        notificationAudio = new Audio('/assets/sounds/notifications.wav');
        notificationAudio.preload = 'auto';
        notificationAudio.volume = 1;
        console.log('🔔 Notification audio initialized (unlock required on first interaction)');
      }
    }
  } catch (error) {
    console.error('❌ Error initializing notification audio:', error);
  }
};

// Initialize on module load
initializeNotificationAudio();


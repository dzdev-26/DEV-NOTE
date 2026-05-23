import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dzgaming.notepad',
  appName: 'DEV NOTE',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
<<<<<<< HEAD
<<<<<<< HEAD
      launchShowDuration: 2000,
      backgroundColor: '#1a1c1e',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
=======
      launchShowDuration: 2500,
      backgroundColor: '#F5C518',
      showSpinner: false,
      androidScaleType: 'CENTER_INSIDE',
      splashFullScreen: true,
      splashImmersive: true,
>>>>>>> 8dc3ba2 (update debug-0.1.5)
=======
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
>>>>>>> 8bb4503 (update debug-0.1.5)
    }
  }
};

export default config;

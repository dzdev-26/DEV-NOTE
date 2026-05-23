import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dzgaming.notepad',
  appName: 'DEV NOTE',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#1c1b1f',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    }
  }
};

export default config;
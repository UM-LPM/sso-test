
let
  pkgs = import <nixpkgs> {
     system = "x86_64-linux";
    config.allowUnfree = true;
    config.android_sdk.accept_license = true;
  };
  android = pkgs.androidenv.composeAndroidPackages {
    toolsVersion = "26.1.1";
    platformToolsVersion = "33.0.3";
    buildToolsVersions = [ "30.0.3" ];
    #includeEmulator = false;
    #emulatorVersion = "30.3.4";
    platformVersions = ["28" "29" "30" "31"];
    #includeSources = false;
    #includeSystemImages = false;
    #systemImageTypes = [ "google_apis_playstore" ];
    #abiVersions = [ "armeabi-v7a" "arm64-v8a" ];
    #cmakeVersions = [ "3.10.2" ];

    includeNDK = true;
    #ndkVersions = ["22.0.7026061"];
    #useGoogleAPIs = false;
    #useGoogleTVAddOns = false;
    #includeExtras = [
    #  "extras;google;gcm"
    #];
  };
in
pkgs.mkShell rec {
  buildInputs = [pkgs.flutter android.platform-tools pkgs.jdk11 pkgs.dart ];

  ANDROID_SDK_ROOT = "${android.androidsdk}/libexec/android-sdk";
  ANDROID_NDK_ROOT = "${ANDROID_SDK_ROOT}/ndk-bundle";
  JAVA_HOME = pkgs.jdk11;

  #GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${ANDROID_SDK_ROOT}/build-tools/30.0.3/aapt2";
}

  #ANDROID_HOME = "${android.androidsdk}/libexec/android-sdk";
  #JAVA_HOME = pkgs.jdk;
  #ANDROID_AVD_HOME = (toString ./.) + "/.android/avd";

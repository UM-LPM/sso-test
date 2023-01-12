let
  pkgs = import <nixpkgs> {
    config.allowUnfree = true;
    config.android_sdk.accept_license = true;
  };
  android = pkgs.androidenv.composeAndroidPackages {
    toolsVersion = "26.1.1";
    platformToolsVersion = "33.0.3";
    buildToolsVersions = [ "30.0.3" ];
    includeEmulator = false;
    platformVersions = ["30" "31"];
    includeSources = false;
    includeSystemImages = false;
    abiVersions = [ "armeabi-v7a" "arm64-v8a" ];
    cmakeVersions = ["3.10.2"];
    includeNDK = true;
    ndkVersions = ["25.1.8937393"];
    useGoogleAPIs = false;
    useGoogleTVAddOns = false;
  };
  gradle = pkgs.gradle.override { java = pkgs.jdk11;};
in
pkgs.mkShell rec {
  buildInputs = [pkgs.flutter android.platform-tools pkgs.jdk11 gradle pkgs.dart];

  ANDROID_SDK_ROOT = "${android.androidsdk}/libexec/android-sdk";
  ANDROID_NDK_ROOT = "${ANDROID_SDK_ROOT}/ndk-bundle";
  JAVA_HOME = pkgs.jdk11;

  shellHook = ''
    rm -rf /tmp/gradle &> /dev/null
    mkdir /tmp/gradle 
    export GRADLE_USER_HOME="/tmp/gradle" 
    echo "org.gradle.java.home=${pkgs.jdk11}/lib/openjdk" > /tmp/gradle/gradle.properties
  '';
}

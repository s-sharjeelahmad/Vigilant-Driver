/**
 * with-onnx-package.js
 *
 * Expo Config Plugin that patches MainApplication.kt after prebuild
 * to manually register OnnxruntimePackage.
 *
 * This is necessary because onnxruntime-react-native uses a legacy JSI
 * bridge pattern (install(jsi::Runtime&)) that fails to autolink correctly
 * under React Native's New Architecture. The OnnxruntimePackage must be
 * explicitly added to the package list.
 *
 * Usage: add "\"./plugins/with-onnx-package\"" to the plugins array in app.json
 */

const { withMainApplication } = require('@expo/config-plugins');

const ONNX_IMPORT = 'import ai.onnxruntime.reactnative.OnnxruntimePackage;';

// The line we want to insert after (the apply { opening brace area)
const PACKAGES_APPLY_OPEN = 'PackageList(this).packages.apply {';

const ONNX_REGISTRATION = `              // OnnxruntimePackage must be manually registered — its legacy JSI
              // install() path is not auto-linked under New Architecture.
              if (none { it is OnnxruntimePackage }) {
                add(OnnxruntimePackage())
              }`;

module.exports = function withOnnxPackage(config) {
  return withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;

    // 1. Add the import if it's not already there
    if (!contents.includes(ONNX_IMPORT)) {
      // Insert after the last React Native import block
      contents = contents.replace(
        'import expo.modules.ApplicationLifecycleDispatcher',
        `${ONNX_IMPORT}\nimport expo.modules.ApplicationLifecycleDispatcher`
      );
    }

    // 2. Add the package registration if not already there
    if (!contents.includes('OnnxruntimePackage()')) {
      contents = contents.replace(
        `${PACKAGES_APPLY_OPEN}\n              // Packages that cannot be autolinked yet can be added manually here, for example:\n              // add(MyReactNativePackage())\n            }`,
        `${PACKAGES_APPLY_OPEN}\n${ONNX_REGISTRATION}\n            }`
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
};

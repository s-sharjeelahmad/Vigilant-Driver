/**
 * react-native.config.js
 *
 * Explicitly tells the React Native autolinking system where to find
 * OnnxruntimePackage. This is required because onnxruntime-react-native
 * uses a legacy JSI bridge that fails to autolink under New Architecture
 * without this hint.
 */
module.exports = {
  dependencies: {
    'onnxruntime-react-native': {
      platforms: {
        android: {
          packageImportPath: 'import ai.onnxruntime.reactnative.OnnxruntimePackage;',
          packageInstance: 'new OnnxruntimePackage()',
        },
      },
    },
  },
};

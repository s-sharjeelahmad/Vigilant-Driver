import { Platform } from "react-native";
import RNFS from "react-native-fs";

const MODEL_FILENAME = "vigilant_driver_model.onnx";
const DATA_FILENAME = "vigilant_driver_model.onnx.data";

// Keep both files in the Metro asset graph so they are bundled for native runtime access.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _onnxModelAsset = require("../../assets/models/vigilant_driver_model.onnx");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _onnxDataAsset = require("../../assets/models/vigilant_driver_model.onnx.data");
void _onnxModelAsset;
void _onnxDataAsset;

export async function ensureModelExists(): Promise<string> {
  const cachedModelPath = `${RNFS.CachesDirectoryPath}/${MODEL_FILENAME}`;
  const cachedDataPath = `${RNFS.CachesDirectoryPath}/${DATA_FILENAME}`;

  const modelExists = await RNFS.exists(cachedModelPath);
  const dataExists = await RNFS.exists(cachedDataPath);

  // If either file is missing, we need to copy them
  if (!modelExists || !dataExists) {
    if (Platform.OS === "android") {
      console.log('[ONNX] Copying model and weights from Android assets...');
      if (!modelExists) await RNFS.copyFileAssets(MODEL_FILENAME, cachedModelPath);
      if (!dataExists) await RNFS.copyFileAssets(DATA_FILENAME, cachedDataPath);
    } else if (Platform.OS === "ios") {
      console.log('[ONNX] Copying model and weights from iOS bundle...');
      const bundledModelPath = `${RNFS.MainBundlePath}/${MODEL_FILENAME}`;
      const bundledDataPath = `${RNFS.MainBundlePath}/${DATA_FILENAME}`;
      if (!modelExists) await RNFS.copyFile(bundledModelPath, cachedModelPath);
      if (!dataExists) await RNFS.copyFile(bundledDataPath, cachedDataPath);
    } else {
      throw new Error(`Unsupported platform for ONNX model loading: ${Platform.OS}`);
    }
  }

  // Always return the path to the .onnx file (ORT will automatically find the .data file next to it)
  return cachedModelPath;
}
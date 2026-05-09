import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

const MODEL_FILENAME = "vigilant_driver_lstm.onnx";
const DATA_FILENAME = "vigilant_driver_lstm.onnx.data";
const VERSION_FILENAME = "model_version.txt";
export const MODEL_VERSION = "v2_bilstm_may2026";
const MIN_MODEL_BYTES = 500_000; // Guard against corrupt zero-byte caches

async function clearCachedModel(
  cachedModelPath: string,
  cachedDataPath: string,
  cachedVersionPath: string
): Promise<void> {
  await Promise.all([
    FileSystem.deleteAsync(cachedModelPath, { idempotent: true }),
    FileSystem.deleteAsync(cachedDataPath, { idempotent: true }),
    FileSystem.deleteAsync(cachedVersionPath, { idempotent: true }),
  ]);
}

async function readCachedVersion(cachedVersionPath: string): Promise<string | null> {
  const versionInfo = await FileSystem.getInfoAsync(cachedVersionPath);
  if (!versionInfo.exists) return null;
  return FileSystem.readAsStringAsync(cachedVersionPath);
}

async function writeCachedVersion(cachedVersionPath: string): Promise<void> {
  await FileSystem.writeAsStringAsync(cachedVersionPath, MODEL_VERSION);
}

export async function ensureModelExists(): Promise<string> {
  console.log('[ONNX] Checking cache for models...');

  const cachedModelPath = `${FileSystem.cacheDirectory}${MODEL_FILENAME}`;
  const cachedDataPath = `${FileSystem.cacheDirectory}${DATA_FILENAME}`;
  const cachedVersionPath = `${FileSystem.cacheDirectory}${VERSION_FILENAME}`;

  const attemptEnsure = async (retry: boolean): Promise<string> => {
    try {
      const [modelInfo, dataInfo] = await Promise.all([
        FileSystem.getInfoAsync(cachedModelPath),
        FileSystem.getInfoAsync(cachedDataPath),
      ]);

      const cachedVersion = await readCachedVersion(cachedVersionPath);
      const isVersionStale = cachedVersion !== MODEL_VERSION;
      const isDataTooSmall = dataInfo.exists && (dataInfo.size ?? 0) < MIN_MODEL_BYTES;
      const isSizeInvalid = isDataTooSmall;

      if (isVersionStale || isSizeInvalid) {
        console.warn('[ONNX] Cache invalidated — clearing stale model files.');
        await clearCachedModel(cachedModelPath, cachedDataPath, cachedVersionPath);
      }

      const needsExtract =
        isVersionStale ||
        isSizeInvalid ||
        !modelInfo.exists ||
        !dataInfo.exists;

      if (needsExtract) {
        console.log('[ONNX] Extracting models from Expo bundle...');

        // This strictly forces Metro to bundle your files from the assets folder
        const modelAsset = Asset.fromModule(require('../../assets/models/vigilant_driver_lstm.onnx'));
        const dataAsset = Asset.fromModule(require('../../assets/models/vigilant_driver_lstm.onnx.data'));

        await Promise.all([modelAsset.downloadAsync(), dataAsset.downloadAsync()]);

        if (modelAsset.localUri) {
          await FileSystem.copyAsync({ from: modelAsset.localUri, to: cachedModelPath });
        }

        if (dataAsset.localUri) {
          await FileSystem.copyAsync({ from: dataAsset.localUri, to: cachedDataPath });
        }

        await writeCachedVersion(cachedVersionPath);
      }

      console.log('[ONNX] Models successfully cached.');
      // Return the path for ONNX (your monitoring.tsx already strips the file:// prefix)
      return cachedModelPath;
    } catch (error) {
      console.warn('[ONNX] Cache validation failed — clearing and retrying once.', error);
      await clearCachedModel(cachedModelPath, cachedDataPath, cachedVersionPath);
      if (retry) {
        return attemptEnsure(false);
      }
      throw error;
    }
  };

  return attemptEnsure(true);
}
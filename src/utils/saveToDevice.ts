import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import type { GeneratedAsset } from '../types';

const ALBUM = 'AI Studio';

/** Android 9 and older need the storage permission; newer versions save via MediaStore. */
async function ensureAndroidPermission() {
  if (Platform.OS !== 'android' || Number(Platform.Version) >= 29) return;
  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  if (await PermissionsAndroid.check(permission)) return;
  const result = await PermissionsAndroid.request(permission);
  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('Storage permission is needed to save to your gallery');
  }
}

const extensionFor = (asset: GeneratedAsset) =>
  asset.url.match(/\.(jpe?g|png|webp|mp4)(?:$|\?)/i)?.[1].toLowerCase() ??
  (asset.type === 'video' ? 'mp4' : 'jpg');

/**
 * Downloads a generated image or video to a temporary file and saves it to the
 * device gallery in an "AI Studio" album. The temporary file is removed afterwards.
 */
export async function saveToDevice(asset: GeneratedAsset) {
  if (asset.local) {
    throw new Error('Demo items are placeholders and cannot be saved');
  }
  await ensureAndroidPermission();

  const download = await ReactNativeBlobUtil.config({
    fileCache: true,
    appendExt: extensionFor(asset),
  }).fetch('GET', asset.url);

  try {
    const status = download.info().status;
    if (status >= 400) throw new Error(`Download failed (${status})`);
    await CameraRoll.saveAsset(`file://${download.path()}`, {
      type: asset.type === 'video' ? 'video' : 'photo',
      album: ALBUM,
    });
  } finally {
    await download.flush();
  }
}

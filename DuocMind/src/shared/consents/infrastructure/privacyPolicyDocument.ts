import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

// El PDF va dentro de la app, por lo que se abre también sin conexión.
const privacyPolicy = require('../../../../assets/privacy-consents.pdf') as number;

/** Abre el documento de consentimientos; lanza si no hay dónde mostrarlo. */
export async function openPrivacyPolicy(): Promise<void> {
  const asset = Asset.fromModule(privacyPolicy);
  await asset.downloadAsync();

  // La previsualización web sirve el archivo por URL; Android necesita un archivo local para entregarlo a un visor.
  if (Platform.OS === 'web') {
    await Linking.openURL(asset.uri);
    return;
  }
  if (!asset.localUri) throw new Error('El documento no está disponible.');
  if (!(await Sharing.isAvailableAsync())) throw new Error('No hay una aplicación para abrir el documento.');
  await Sharing.shareAsync(asset.localUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Política de privacidad y consentimientos',
  });
}

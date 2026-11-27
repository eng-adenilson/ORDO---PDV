import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { XLSX_MIME } from './xlsx';

/** Salva o .xlsx na pasta de documentos do app e devolve o arquivo (a tela mostra o nome e oferece compartilhar). */
export async function saveXlsx(fileName: string, bytes: Uint8Array): Promise<{ uri: string; name: string; size: number }> {
  const file = new File(Paths.document, fileName);
  file.create({ overwrite: true });
  await file.write(bytes);
  return { uri: file.uri, name: fileName, size: bytes.length };
}

export async function shareXlsx(uri: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: XLSX_MIME, dialogTitle: 'Compartilhar planilha', UTI: 'org.openxmlformats.spreadsheetml.sheet' });
  return true;
}

export const stampName = (prefix: string, d = new Date()) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${prefix}-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.xlsx`;
};

export type BarcodeType =
  | 'aztec'
  | 'codabar'
  | 'code39'
  | 'code93'
  | 'code128'
  | 'datamatrix'
  | 'ean8'
  | 'ean13'
  | 'itf14'
  | 'pdf417'
  | 'qr'
  | 'upc_a'
  | 'upc_e';

export const BARCODE_TYPE_LABELS: Record<BarcodeType, string> = {
  aztec: 'Aztec',
  codabar: 'Codabar',
  code39: 'Code 39',
  code93: 'Code 93',
  code128: 'Code 128',
  datamatrix: 'Data Matrix',
  ean8: 'EAN-8',
  ean13: 'EAN-13',
  itf14: 'ITF-14',
  pdf417: 'PDF417',
  qr: 'QR Code',
  upc_a: 'UPC-A',
  upc_e: 'UPC-E',
};

export const ALL_BARCODE_TYPES: BarcodeType[] = Object.keys(BARCODE_TYPE_LABELS) as BarcodeType[];

export interface ScannedBarcode {
  id: string;
  value: string;
  type: BarcodeType;
  timestamp: number;
}

export interface AppSettings {
  enabledBarcodeTypes: BarcodeType[];
  autoResume: boolean;
  autoResumeDelaySeconds: number;
  autoCopyToClipboard: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  enabledBarcodeTypes: [...ALL_BARCODE_TYPES],
  autoResume: false,
  autoResumeDelaySeconds: 3,
  autoCopyToClipboard: true,
};

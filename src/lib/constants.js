export const JOB_TYPES = [
  'Residential Installation',
  'Commercial Installation',
  'Panel Upgrade',
  'Generator Installation',
  'EV Charger Installation',
  'Lighting Installation',
  'Wiring & Rewiring',
  'Electrical Inspection',
  'Emergency Repair',
  'Solar Installation',
  'Other',
]

export const JOB_STATUSES = ['Active', 'Completed', 'On Hold', 'Cancelled']

export const STATUS_COLORS = {
  Active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  Completed: 'bg-blue-100 text-blue-700 border-blue-200',
  'On Hold': 'bg-amber-100 text-amber-700 border-amber-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export const SECTIONS = [
  { key: 'photos',    label: 'Photos',           icon: 'Image',     accept: 'image/*' },
  { key: 'invoices',  label: 'Invoices',          icon: 'FileText',  accept: '.pdf,.doc,.docx,.xls,.xlsx' },
  { key: 'contracts', label: 'Contracts',         icon: 'FileCheck', accept: '.pdf,.doc,.docx' },
  { key: 'permits',   label: 'Permits',           icon: 'ShieldCheck', accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png' },
  { key: 'other',     label: 'Other Documents',   icon: 'File',      accept: '*' },
  { key: 'cad',       label: 'CAD Files',         icon: 'Layers',    accept: '.dwg,.dxf,.dwf' },
  { key: 'videos',    label: 'Videos',            icon: 'Video',     accept: '.mp4,.mov,.avi,.mkv' },
]

// Used by the smart drag-drop zone
export const EXT_TO_SECTION = {
  dwg: 'cad', dxf: 'cad', dwf: 'cad',
  mp4: 'videos', mov: 'videos', avi: 'videos', mkv: 'videos',
  jpg: 'photos', jpeg: 'photos', png: 'photos', gif: 'photos',
  heic: 'photos', webp: 'photos',
}

export const NAME_KEYWORDS_TO_SECTION = {
  invoices:  ['invoice', 'factura', 'receipt', 'recibo', 'billing'],
  contracts: ['contract', 'contrato', 'agreement', 'acuerdo'],
  permits:   ['permit', 'permiso', 'license', 'licencia', 'inspection'],
}

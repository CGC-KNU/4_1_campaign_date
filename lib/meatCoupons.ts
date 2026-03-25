export type CouponDayBundle = {
  limited: string
  basic: [string, string, string, string]
  rare: string
  legend: string
}

const COUPON_SCHEDULE: Record<string, CouponDayBundle> = {
  '03-26': {
    limited: 'MINYEOL',
    basic: ['JAEMIN', 'EUNJIN', 'CHAERIN', 'AHYOON'],
    rare: 'MINGOO',
    legend: 'YUNJI',
  },
  '04-01': {
    limited: 'BRAVENIX',
    basic: ['WEXILARD', 'XERABOLT', 'NARQOLIN', 'LEXARION'],
    rare: 'RIMTOVAX',
    legend: 'GEXILORA',
  },
  '04-02': {
    limited: 'LOPATERN',
    basic: ['NOPHARET', 'MONTERAQ', 'JOVEMARK', 'DURNAVOX'],
    rare: 'QORLAVEN',
    legend: 'CANTROVE',
  },
  '04-03': {
    limited: 'ZEMQUARK',
    basic: ['BIRLONAQ', 'RIXELAND', 'QUILTARO', 'VEXILORN'],
    rare: 'FANTERIX',
    legend: 'PAVERNIQ',
  },
  '04-04': {
    limited: 'TOLVAREN',
    basic: ['CAVORENT', 'VANTORIC', 'PANDERIX', 'KAMERINT'],
    rare: 'WEXMORAL',
    legend: 'LUXAROTE',
  },
  '04-05': {
    limited: 'MEXILORD',
    basic: ['HUXILORA', 'SELQORIN', 'HAVORNEX', 'BOLTAREN'],
    rare: 'LORQANIT',
    legend: 'JANTORIM',
  },
  '04-06': {
    limited: 'QANERBIT',
    basic: ['YANTERVO', 'BAXTERON', 'MIRALTON', 'XANIVORE'],
    rare: 'SANTEVOR',
    legend: 'ROVEXLAN',
  },
  '04-07': {
    limited: 'ROVELTAN',
    basic: ['FOLKARIN', 'KORVEMIT', 'CORTAVEN', 'JEROLAND'],
    rare: 'KOVARLIX',
    legend: 'VELQATON',
  },
  '04-08': {
    limited: 'SIPLORAN',
    basic: ['GREMALTO', 'LUNAFORD', 'YEXPLORA', 'NEXIPORT'],
    rare: 'DEMPRATO',
    legend: 'NOMERLIX',
  },
  '04-09': {
    limited: 'DAKEMITH',
    basic: ['PEXORIAN', 'TEMPRAVI', 'GANTEROL', 'TALVORIN'],
    rare: 'YOLTERIN',
    legend: 'XANTEROL',
  },
  '04-10': {
    limited: 'VORLANEX',
    basic: ['LINQARET', 'ZORLACEN', 'RAVELQIN', 'MERQALIX'],
    rare: 'BRENQALO',
    legend: 'DORVEMAX',
  },
  '04-11': {
    limited: 'JUPRAVEN',
    basic: ['DOVEMARK', 'WINTAROX', 'TROMELIX', 'PELTORAN'],
    rare: 'TAVERNIX',
    legend: 'FALQORIN',
  },
  '04-12': {
    limited: 'KELTOMIR',
    basic: ['TARLONIX', 'FEXILANT', 'SOVANDEL', 'ZAVENLOR'],
    rare: 'MORTELAQ',
    legend: 'ZEMTARON',
  },
}

const FALLBACK_TEST_BUNDLE_KEY = '03-26'

export function getCouponBundleForDayKey(dayKey: string) {
  return COUPON_SCHEDULE[dayKey.slice(5)] ?? COUPON_SCHEDULE[FALLBACK_TEST_BUNDLE_KEY] ?? null
}

// Bikram Sambat (BS) Date Utility for SajiloBiz
// Bikram Sambat is approximately 56 years, 8 months ahead of standard AD calendar.
// This utility handles conversion for years relevant to modern business records (2020 AD - 2030 AD).

interface YearMapping {
  adStart: string; // The Date in AD when Baisakh 1 of this BS year starts
  monthsDays: number[]; // Number of days in each of the 12 BS months
}

// Precision data of BS year month lengths from 2079 BS to 2087 BS
const BS_CALENDAR_DATA: { [key: number]: YearMapping } = {
  2079: {
    adStart: '2022-04-14',
    monthsDays: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  },
  2080: {
    adStart: '2023-04-14',
    monthsDays: [31, 32, 31, 31, 31, 31, 29, 30, 29, 30, 30, 30],
  },
  2081: {
    adStart: '2024-04-13',
    monthsDays: [31, 31, 32, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  },
  2082: {
    adStart: '2025-04-14',
    monthsDays: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30],
  },
  2083: {
    adStart: '2026-04-14',
    monthsDays: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 29, 30],
  },
  2084: {
    adStart: '2027-04-14',
    monthsDays: [31, 32, 31, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  },
  2085: {
    adStart: '2028-04-13',
    monthsDays: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 30],
  },
};

export const NEP_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const NEP_MONTHS_NP = [
  'वैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कात्तिक',
  'मंसिर',
  'पुस',
  'माघ',
  'फागुन',
  'चैत',
];

/**
 * Converts standard JavaScript Date (or ISO date string) to Bikram Sambat YYYY-MM-DD
 */
export function convertADtoBS(dateInput: Date | string): string {
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) {
    return '2083-02-05'; // Fallback to current BS date approximate
  }

  // Find the appropriate BS year
  let bsYear = 2083; // Base default
  let yearData = BS_CALENDAR_DATA[bsYear];

  // Search the matching BS year
  for (const yearStr of Object.keys(BS_CALENDAR_DATA)) {
    const yr = parseInt(yearStr);
    const startAD = new Date(BS_CALENDAR_DATA[yr].adStart);
    // Next year's start
    const nextYr = yr + 1;
    const endAD = BS_CALENDAR_DATA[nextYr] 
      ? new Date(BS_CALENDAR_DATA[nextYr].adStart)
      : new Date(new Date(BS_CALENDAR_DATA[yr].adStart).getTime() + 365 * 24 * 60 * 60 * 1000);

    if (dateObj >= startAD && dateObj < endAD) {
      bsYear = yr;
      yearData = BS_CALENDAR_DATA[yr];
      break;
    }
  }

  // Calculate difference in days from Baisakh 1
  const baisakh1 = new Date(yearData.adStart);
  const diffTime = dateObj.getTime() - baisakh1.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // If date is before Baisakh 1 of the earliest yr in our records, fallback
    return `${bsYear - 1}-12-30`;
  }

  let remainingDays = diffDays;
  let bsMonth = 1;
  let bsDay = 1;

  for (let m = 0; m < 12; m++) {
    const daysInMonth = yearData.monthsDays[m];
    if (remainingDays < daysInMonth) {
      bsMonth = m + 1;
      bsDay = remainingDays + 1;
      break;
    }
    remainingDays -= daysInMonth;
  }

  const mm = bsMonth.toString().padStart(2, '0');
  const dd = bsDay.toString().padStart(2, '0');

  return `${bsYear}-${mm}-${dd}`;
}

/**
 * Converts Bikram Sambat YYYY-MM-DD back to standard JavaScript Date
 */
export function convertBStoAD(bsDateString: string): Date {
  if (!bsDateString || !bsDateString.includes('-')) return new Date();
  const parts = bsDateString.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();

  const yearData = BS_CALENDAR_DATA[year];
  if (!yearData) {
    // Basic approximate offset of 56.7 years
    const estYear = year - 57;
    return new Date(`${estYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
  }

  const baisakh1 = new Date(yearData.adStart);
  let totalDaysOffset = 0;
  for (let m = 0; m < month - 1; m++) {
    totalDaysOffset += yearData.monthsDays[m];
  }
  totalDaysOffset += (day - 1);

  const adDate = new Date(baisakh1.getTime() + totalDaysOffset * 24 * 60 * 60 * 1000);
  return adDate;
}

/**
 * Strips YYYY-MM-DD string into formatted readable string like "Jestha 5, 2083" or "वैशाख १०, २०८१"
 */
export function formatBSDate(bsDateString: string, nepaliScript = false): string {
  if (!bsDateString || !bsDateString.includes('-')) return bsDateString;
  const parts = bsDateString.split('-');
  if (parts.length !== 3) return bsDateString;

  const year = parseInt(parts[0]);
  const monthIdx = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);

  if (monthIdx < 0 || monthIdx > 11) return bsDateString;

  if (nepaliScript) {
    const nepMonths = NEP_MONTHS_NP;
    // Map digits to Nepali glyphs
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const toNepaliDigits = (num: number) => 
      num.toString().split('').map(digit => devanagariDigits[parseInt(digit)] || digit).join('');
    
    return `${nepMonths[monthIdx]} ${toNepaliDigits(day)}, ${toNepaliDigits(year)}`;
  } else {
    return `${NEP_MONTHS_EN[monthIdx]} ${day}, ${year} BS`;
  }
}

/**
 * Get current system date in BS
 */
export function getTodayBS(): string {
  return convertADtoBS(new Date());
}

/**
 * Get Fiscal Year for a given BS Date (YYYY-MM-DD)
 * In Nepal, Fiscal Year starts from Shrawan 1 (Month 4) and ends on Ashadh last (Month 3 of the next year).
 * E.g. 2080-04-01 is in FY 2080/81.
 * E.g. 2081-03-30 is in FY 2080/81.
 */
export function getFiscalYear(bsDateString: string): string {
  if (!bsDateString || !bsDateString.includes('-')) return '';
  const parts = bsDateString.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  if (isNaN(year) || isNaN(month)) return '';
  
  if (month >= 4) {
    const nextYearShort = (year + 1) % 100;
    return `${year}/${nextYearShort.toString().padStart(2, '0')}`;
  } else {
    const prevYear = year - 1;
    const currentYearShort = year % 100;
    return `${prevYear}/${currentYearShort.toString().padStart(2, '0')}`;
  }
}

export const FISCAL_YEAR_OPTIONS = ['All', '2079/80', '2080/81', '2081/82', '2082/83', '2083/84', '2084/85'];

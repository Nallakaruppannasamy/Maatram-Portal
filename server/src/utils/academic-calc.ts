/**
 * @file src/utils/academic-calc.ts
 * @description Helper functions to calculate academic year and semester from batch.
 */

export const calculateAcademicStatus = (
  batch: string,
  currentDate: Date = new Date()
): { academicYear: string; semester: string } => {
  // Batch format is either "YYYY" or "YYYY-YYYY"
  const match = batch.match(/^\d{4}/);
  if (!match) {
    return { academicYear: '1', semester: '1' };
  }
  const startYear = parseInt(match[0]);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (0 = Jan, 5 = June, 11 = Dec)

  let academicYear = 1;
  let isOddSemester = true;

  if (currentMonth >= 5) {
    // June to December
    academicYear = currentYear - startYear + 1;
    // June to November is odd, December is even
    isOddSemester = currentMonth <= 10;
  } else {
    // January to May
    academicYear = currentYear - startYear;
    isOddSemester = false;
  }

  // Cap academicYear at 1 minimum
  if (academicYear < 1) {
    academicYear = 1;
  }

  const semesterNumber = isOddSemester
    ? (academicYear - 1) * 2 + 1
    : academicYear * 2;

  return {
    academicYear: String(academicYear),
    semester: String(semesterNumber),
  };
};

export type CollegeProgram = { value: string; label: string };

export const COLLEGE_PROGRAMS: CollegeProgram[] = [
  { value: 'BSBA', label: 'Bachelor of Science in Business Administration' },
  { value: 'BSA', label: 'Bachelor of Science in Accountancy' },
  { value: 'COELA', label: 'College of Education and Liberal Arts' },
  { value: 'BSCRIM', label: 'Bachelor of Science in Criminology' },
  { value: 'BSCS', label: 'Bachelor of Science in Computer Science' },
  { value: 'JD', label: 'Juris Doctor' },
  { value: 'BSN', label: 'Bachelor of Science in Nursing' },
  { value: 'RLE', label: 'Related Learning Experience' },
  { value: 'CG', label: 'Career Guidance' },
  { value: 'BSPT', label: 'Bachelor of Science in Physical Therapy' },
  { value: 'GSP', label: 'Graduate Studies Programs' },
  { value: 'MBA', label: 'Master of Business Administration' },
];

export function getCollegeProgramLabel(acronym: string): string {
  const found = COLLEGE_PROGRAMS.find((p) => p.value === acronym);
  return found ? found.label : acronym;
}

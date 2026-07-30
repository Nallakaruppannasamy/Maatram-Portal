const validCsv = `registrationNumber,firstName,middleName,lastName,gender,dateOfBirth,bloodGroup,nationality,community,religion,email,mobile,alternateMobile,parentName,parentMobile,parentOccupation,guardianName,guardianMobile,addressLine1,addressLine2,city,district,state,country,pincode,organizationCode,zoneCode,collegeCode,departmentName,programName,course,batch,academicYear,semester,section
MTM-REG-001,Raj,Kumar,Singh,MALE,2002-05-15,O_POSITIVE,Indian,,,raj.singh@student.org,9876543210,,Surender Singh,9876543212,,,123 Main Road,,Chennai,Chennai,Tamil Nadu,India,600001,MTM-ORG,ZONE-1,MIT-CHE,Computer Science and Engineering,B.E. Computer Science and Engineering,B.E.,2022-2026,4th Year,Semester 7,A
MTM-REG-002,Priya,,Patel,FEMALE,2003-09-20,A_POSITIVE,Indian,,,priya.patel@student.org,9876543211,,Amit Patel,9876543213,,,45 West Mada St,,Chennai,Chennai,Tamil Nadu,India,600004,MTM-ORG,ZONE-1,MIT-CHE,Computer Science and Engineering,B.E. Computer Science and Engineering,B.E.,2022-2026,4th Year,Semester 7,A`;

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((val) => val.replace(/^"|"$/g, '').trim());
}

const lines = validCsv.split(/\r?\n/).filter((line) => line.trim() !== '');
const headers = parseCsvLine(lines[0]);
const values = parseCsvLine(lines[1]);

console.log('Headers vs Values:');
for (let i = 0; i < Math.max(headers.length, values.length); i++) {
  console.log(`${i}: Header="${headers[i]}" -> Value="${values[i]}"`);
}

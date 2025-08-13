export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  startDate: string;
  status: 'active' | 'inactive' | 'pending';
}

export const generateSampleEmployees = (count: number): Employee[] => {
  const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  const positions = [
    'Software Engineer', 'Senior Engineer', 'Engineering Manager', 'Product Manager',
    'Marketing Specialist', 'Marketing Manager', 'Sales Representative', 'Sales Manager',
    'HR Specialist', 'HR Manager', 'Financial Analyst', 'Operations Specialist'
  ];
  const statuses: Employee['status'][] = ['active', 'inactive', 'pending'];
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  return Array.from({ length: count }, (_, index) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    
    return {
      id: (index + 1).toString(),
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      department,
      position: positions[Math.floor(Math.random() * positions.length)],
      salary: Math.floor(Math.random() * 100000) + 40000,
      startDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
  });
};
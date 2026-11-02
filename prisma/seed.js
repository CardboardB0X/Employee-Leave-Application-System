const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding with Custom Personnel ---');

  // 0. Clean up previous transactional data & existing users
  await prisma.leaveApproval.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  // Disconnect manager references to avoid self-referential foreign key constraint during deletion
  await prisma.user.updateMany({ data: { managerId: null } });
  await prisma.user.deleteMany({});
  console.log('✓ Previous records cleaned');

  // 1. Roles
  const rolesData = [
    { name: 'SUPER_ADMIN', description: 'System Administrator with unrestricted access' },
    { name: 'HR_ADMIN', description: 'Human Resources Manager with global leave management' },
    { name: 'MANAGER', description: 'Department Manager with subordinate approval permissions' },
    { name: 'EMPLOYEE', description: 'Standard Employee with personal leave request permissions' },
  ];

  const roles = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    roles[r.name] = role;
  }
  console.log('✓ Roles seeded');

  // 2. Departments
  const deptsData = [
    { name: 'Executive', code: 'EXEC' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Engineering', code: 'ENG' },
    { name: 'Finance & Accounting', code: 'FIN' },
    { name: 'Sales & Marketing', code: 'MKT' },
  ];

  const departments = {};
  for (const d of deptsData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
    departments[d.code] = dept;
  }
  console.log('✓ Departments seeded');

  // 3. Leave Types
  const leaveTypesData = [
    {
      name: 'Vacation Leave',
      code: 'VL',
      description: 'Annual paid vacation leave for rest and leisure.',
      defaultAnnualDays: 15.0,
      requiresAttachment: false,
      requiresHrApproval: false,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Sick Leave',
      code: 'SL',
      description: 'Paid medical leave for illness or medical consultations.',
      defaultAnnualDays: 10.0,
      requiresAttachment: true,
      requiresHrApproval: false,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Emergency Leave',
      code: 'EL',
      description: 'Leave for unforeseen urgent personal or family emergencies.',
      defaultAnnualDays: 5.0,
      requiresAttachment: false,
      requiresHrApproval: false,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Maternity Leave',
      code: 'ML',
      description: 'Statutory maternity leave for female employees.',
      defaultAnnualDays: 105.0,
      requiresAttachment: true,
      requiresHrApproval: true,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Paternity Leave',
      code: 'PL',
      description: 'Statutory paternity leave for married male employees.',
      defaultAnnualDays: 7.0,
      requiresAttachment: true,
      requiresHrApproval: true,
      isPaid: true,
      isActive: true,
    },
    {
      name: 'Leave Without Pay',
      code: 'LWOP',
      description: 'Unpaid personal leave subject to HR endorsement.',
      defaultAnnualDays: 30.0,
      requiresAttachment: false,
      requiresHrApproval: true,
      isPaid: false,
      isActive: true,
    },
  ];

  const leaveTypes = [];
  for (const lt of leaveTypesData) {
    const leaveType = await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: lt,
    });
    leaveTypes.push(leaveType);
  }
  console.log('✓ Leave Types seeded');

  // 4. Seed 12 Users specified by user
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('Password123!', salt);

  const usersData = [
    // 1. Super Admin
    {
      employeeCode: 'ADM-001',
      firstName: 'Adrian',
      lastName: 'Sanchez',
      email: 'adrian.sanchez@company.com',
      passwordHash: defaultPassword,
      roleId: roles['SUPER_ADMIN'].id,
      departmentId: departments['EXEC'].id,
    },
    // 2. HR Admin
    {
      employeeCode: 'HR-001',
      firstName: 'Emmanuel',
      lastName: 'Creo',
      email: 'emmanuel.creo@company.com',
      passwordHash: defaultPassword,
      roleId: roles['HR_ADMIN'].id,
      departmentId: departments['HR'].id,
    },
    // 3. Dept Manager - Engineering
    {
      employeeCode: 'MGR-001',
      firstName: 'Gabrielle Red',
      lastName: 'Jeciel',
      email: 'gabrielle.jeciel@company.com',
      passwordHash: defaultPassword,
      roleId: roles['MANAGER'].id,
      departmentId: departments['ENG'].id,
    },
    // 4. Dept Manager - Finance
    {
      employeeCode: 'MGR-002',
      firstName: 'Joshua James',
      lastName: 'Fabian',
      email: 'joshua.fabian@company.com',
      passwordHash: defaultPassword,
      roleId: roles['MANAGER'].id,
      departmentId: departments['FIN'].id,
    },
    // 5. Dept Manager - Sales & Marketing
    {
      employeeCode: 'MGR-003',
      firstName: 'Andersen',
      lastName: 'Avellana',
      email: 'andersen.avellana@company.com',
      passwordHash: defaultPassword,
      roleId: roles['MANAGER'].id,
      departmentId: departments['MKT'].id,
    },
    // 6. Employee - Engineering
    {
      employeeCode: 'EMP-001',
      firstName: 'Christoper',
      lastName: 'Claveria',
      email: 'christoper.claveria@company.com',
      passwordHash: defaultPassword,
      roleId: roles['EMPLOYEE'].id,
      departmentId: departments['ENG'].id,
    },
    // 7. Employee - Engineering
    {
      employeeCode: 'EMP-002',
      firstName: 'Von Arvin',
      lastName: 'Apilado',
      email: 'von.apilado@company.com',
      passwordHash: defaultPassword,
      roleId: roles['EMPLOYEE'].id,
      departmentId: departments['ENG'].id,
    },
    // 8. Employee - Engineering
    {
      employeeCode: 'EMP-003',
      firstName: 'Zachary Owen',
      lastName: 'Marayag',
      email: 'zachary.marayag@company.com',
      passwordHash: defaultPassword,
      roleId: roles['EMPLOYEE'].id,
      departmentId: departments['ENG'].id,
    },
    // 9. Employee - Engineering
    {
      employeeCode: 'EMP-004',
      firstName: 'Micah',
      lastName: 'Dosol',
      email: 'micah.dosol@company.com',
      passwordHash: defaultPassword,
      roleId: roles['EMPLOYEE'].id,
      departmentId: departments['ENG'].id,
    },
    // 10. Employee - Finance
    {
      employeeCode: 'EMP-005',
      firstName: 'Ronnel',
      lastName: 'Mercado',
      email: 'ronnel.mercado@company.com',
      passwordHash: defaultPassword,
      roleId: roles['EMPLOYEE'].id,
      departmentId: departments['FIN'].id,
    },
    // 11. Employee - Human Resources
    {
      employeeCode: 'EMP-006',
      firstName: 'Liah Faith',
      lastName: 'Espineli',
      email: 'liah.espineli@company.com',
      passwordHash: defaultPassword,
      roleId: roles['EMPLOYEE'].id,
      departmentId: departments['HR'].id,
    },
    // 12. Employee - Sales & Marketing
    {
      employeeCode: 'EMP-007',
      firstName: 'Angelo Jordan',
      lastName: 'Maduro',
      email: 'angelo.maduro@company.com',
      passwordHash: defaultPassword,
      roleId: roles['EMPLOYEE'].id,
      departmentId: departments['MKT'].id,
    },
  ];

  const createdUsers = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: u,
    });
    createdUsers[u.email] = user;
  }
  console.log(`✓ 12 personnel seeded: ${usersData.map((u) => u.firstName + ' ' + u.lastName).join(', ')}`);

  // Establish reporting hierarchy
  const adrian = createdUsers['adrian.sanchez@company.com'];
  const emmanuel = createdUsers['emmanuel.creo@company.com'];
  const gabrielle = createdUsers['gabrielle.jeciel@company.com'];
  const joshua = createdUsers['joshua.fabian@company.com'];
  const andersen = createdUsers['andersen.avellana@company.com'];

  // Managers report to Adrian Sanchez (Super Admin / Executive)
  await prisma.user.update({ where: { email: 'emmanuel.creo@company.com' }, data: { managerId: adrian.id } });
  await prisma.user.update({ where: { email: 'gabrielle.jeciel@company.com' }, data: { managerId: adrian.id } });
  await prisma.user.update({ where: { email: 'joshua.fabian@company.com' }, data: { managerId: adrian.id } });
  await prisma.user.update({ where: { email: 'andersen.avellana@company.com' }, data: { managerId: adrian.id } });

  // Engineering subordinates report to Gabrielle Red Jeciel
  await prisma.user.update({ where: { email: 'christoper.claveria@company.com' }, data: { managerId: gabrielle.id } });
  await prisma.user.update({ where: { email: 'von.apilado@company.com' }, data: { managerId: gabrielle.id } });
  await prisma.user.update({ where: { email: 'zachary.marayag@company.com' }, data: { managerId: gabrielle.id } });
  await prisma.user.update({ where: { email: 'micah.dosol@company.com' }, data: { managerId: gabrielle.id } });

  // Finance subordinates report to Joshua James Fabian
  await prisma.user.update({ where: { email: 'ronnel.mercado@company.com' }, data: { managerId: joshua.id } });

  // HR subordinates report to Emmanuel Creo
  await prisma.user.update({ where: { email: 'liah.espineli@company.com' }, data: { managerId: emmanuel.id } });

  // Marketing subordinates report to Andersen Avellana
  await prisma.user.update({ where: { email: 'angelo.maduro@company.com' }, data: { managerId: andersen.id } });

  console.log('✓ Organizational reporting hierarchy established');

  // 5. Seed 2026 Leave Balances for all 12 employees
  const currentYear = 2026;
  for (const user of Object.values(createdUsers)) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          userId: user.id,
          leaveTypeId: lt.id,
          fiscalYear: currentYear,
          totalAllocated: lt.defaultAnnualDays,
          usedDays: 0.0,
          pendingDays: 0.0,
          carriedOver: 0.0,
        },
      });
    }
  }
  console.log('✓ 2026 Leave Balances initialized for all 12 employees');

  // 6. Seed Sample Realistic Leave Requests
  const christoper = createdUsers['christoper.claveria@company.com'];
  const von = createdUsers['von.apilado@company.com'];
  const zachary = createdUsers['zachary.marayag@company.com'];
  const vacType = leaveTypes.find((t) => t.code === 'VL');
  const sickType = leaveTypes.find((t) => t.code === 'SL');

  if (christoper && vacType) {
    // Christoper Claveria: Pending request
    await prisma.leaveRequest.create({
      data: {
        requestNumber: 'LR-2026-0001',
        userId: christoper.id,
        leaveTypeId: vacType.id,
        startDate: new Date('2026-11-10'),
        endDate: new Date('2026-11-12'),
        totalDays: 3.0,
        reason: 'Annual family retreat and recharge.',
        status: 'PENDING',
      },
    });
    await prisma.leaveBalance.update({
      where: {
        uk_user_leave_year: {
          userId: christoper.id,
          leaveTypeId: vacType.id,
          fiscalYear: currentYear,
        },
      },
      data: { pendingDays: 3.0 },
    });
  }

  if (von && sickType) {
    // Von Arvin Apilado: Approved sick leave
    await prisma.leaveRequest.create({
      data: {
        requestNumber: 'LR-2026-0002',
        userId: von.id,
        leaveTypeId: sickType.id,
        startDate: new Date('2026-11-04'),
        endDate: new Date('2026-11-05'),
        totalDays: 2.0,
        reason: 'Acute fever and medical rest per doctor advice.',
        status: 'APPROVED',
      },
    });
    await prisma.leaveBalance.update({
      where: {
        uk_user_leave_year: {
          userId: von.id,
          leaveTypeId: sickType.id,
          fiscalYear: currentYear,
        },
      },
      data: { usedDays: 2.0 },
    });
  }

  if (zachary && vacType) {
    // Zachary Owen Marayag: Manager approved, awaiting HR clearance
    await prisma.leaveRequest.create({
      data: {
        requestNumber: 'LR-2026-0003',
        userId: zachary.id,
        leaveTypeId: vacType.id,
        startDate: new Date('2026-11-16'),
        endDate: new Date('2026-11-18'),
        totalDays: 3.0,
        reason: 'Personal wellness and family event.',
        status: 'MANAGER_APPROVED',
      },
    });
    await prisma.leaveBalance.update({
      where: {
        uk_user_leave_year: {
          userId: zachary.id,
          leaveTypeId: vacType.id,
          fiscalYear: currentYear,
        },
      },
      data: { pendingDays: 3.0 },
    });
  }
  console.log('✓ Active leave requests seeded');

  // 7. Seed Official 2026 Company & Public Holidays
  const holidaysData = [
    { name: "New Year's Day", date: new Date('2026-01-01') },
    { name: "Lunar New Year", date: new Date('2026-02-17') },
    { name: "Maundy Thursday", date: new Date('2026-04-02') },
    { name: "Good Friday", date: new Date('2026-04-03') },
    { name: "Labor Day", date: new Date('2026-05-01') },
    { name: "Independence Day", date: new Date('2026-06-12') },
    { name: "National Heroes Day", date: new Date('2026-08-31') },
    { name: "All Saints' Day", date: new Date('2026-11-01') },
    { name: "Bonifacio Day", date: new Date('2026-11-30') },
    { name: "Feast of the Immaculate Conception", date: new Date('2026-12-08') },
    { name: "Christmas Day", date: new Date('2026-12-25') },
    { name: "Rizal Day", date: new Date('2026-12-30') },
    { name: "New Year's Eve", date: new Date('2026-12-31') },
  ];

  for (const h of holidaysData) {
    await prisma.holiday.upsert({
      where: {
        name_date: {
          name: h.name,
          date: h.date,
        },
      },
      update: {},
      create: h,
    });
  }
  console.log('✓ 2026 Official Statutory Holidays seeded');

  // 8. Seed Initial Notifications
  if (christoper) {
    await prisma.notification.createMany({
      data: [
        {
          userId: christoper.id,
          title: 'Leave Application Submitted',
          message: "Your Vacation Leave request (LR-2026-0001) for Nov 10–12 is awaiting Gabrielle Red Jeciel's review.",
          type: 'INFO',
          link: '/dashboard',
        },
        {
          userId: christoper.id,
          title: 'Statutory Holiday Notice',
          message: 'Bonifacio Day on Monday, Nov 30 is an official non-working holiday.',
          type: 'HOLIDAY',
          link: '/dashboard/team-calendar',
        },
      ],
      skipDuplicates: true,
    });
  }

  // 9. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      action: 'PERSONNEL_INITIALIZED',
      resourceType: 'USER_DIRECTORY',
      ipAddress: '127.0.0.1',
      userAgent: 'Seed CLI',
      details: {
        message: 'All 12 personnel successfully provisioned with strict RBAC.',
        personnelCount: 12,
      },
    },
  });
  console.log('✓ Initial Audit Log recorded');

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
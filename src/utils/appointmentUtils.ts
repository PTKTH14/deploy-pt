
export const filterAppointments = (
  appointments: any[], 
  tableFilter?: string,
  shouldShowTables?: boolean,
  searchName?: string,
  selectedDate?: string,
  selectedDepartment?: string,
  selectedAppointmentType?: string,
  selectedStatus?: string
) => {
  if (!appointments) return [];
  
  let filteredAppointments = [...appointments];

  // Filter by table for departments that have tables
  if (shouldShowTables && tableFilter) {
    if (tableFilter === 'summary') {
      // For summary tab, show appointments that belong to multiple departments (joint cases)
      filteredAppointments = filteredAppointments.filter(appointment => 
        appointment.departments && appointment.departments.length > 1
      );
    } else {
      // For specific table tabs, filter by table number
      const tableNumber = tableFilter.replace('table', '');
      filteredAppointments = filteredAppointments.filter(appointment => 
        appointment.table_number === parseInt(tableNumber)
      );
    }
  }

  // Apply other filters
  return filteredAppointments.filter(appointment => {
    const matchesName = !searchName || appointment.full_name?.toLowerCase().includes(searchName.toLowerCase());
    const matchesDate = !selectedDate || appointment.appointment_date === selectedDate;
    const matchesDepartment = selectedDepartment === 'all' || 
      (appointment.departments && appointment.departments.some((dept: string) => 
        dept.includes(selectedDepartment) || selectedDepartment.includes(dept)
      ));
    const matchesAppointmentType = selectedAppointmentType === 'all' || 
      appointment.appointment_type === selectedAppointmentType;
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
    
    return matchesName && matchesDate && matchesDepartment && matchesAppointmentType && matchesStatus;
  });
};

export const shouldShowTableTabs = (department: string) => {
  return department === 'กายภาพ' || department === 'แผนจีน';
};


import React from 'react';

interface AppointmentTableTabsProps {
  department: string;
  activeTable: string;
  setActiveTable: (table: string) => void;
}

const AppointmentTableTabs = ({ department, activeTable, setActiveTable }: AppointmentTableTabsProps) => {
  const getTableLabels = () => {
    if (department === 'กายภาพ') {
      return ['โต๊ะ 1', 'โต๊ะ 2', 'โต๊ะ 3', 'เคสรวม'];
    } else if (department === 'แผนจีน') {
      return ['โต๊ะ 1', 'โต๊ะ 2'];
    }
    return [];
  };

  const tableLabels = getTableLabels();

  if (tableLabels.length === 0) return null;

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {tableLabels.map((label, index) => (
        <button
          key={index}
          onClick={() => setActiveTable(department === 'กายภาพ' && index === 3 ? 'summary' : `table${index + 1}`)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTable === (department === 'กายภาพ' && index === 3 ? 'summary' : `table${index + 1}`)
              ? 'bg-white text-blue-600 shadow-sm border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default AppointmentTableTabs;

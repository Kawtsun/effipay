import React from 'react';

// 1. Define the TypeScript interface for your data structure
interface LeaveSummaryItem {
    employee_id: number;
    counted_leave_work_days: number;
}

// 2. Define the props interface for the Inertia page
interface LeaveReportProps {
    leaveSummary: LeaveSummaryItem[];
}

// 3. The React component receives the data as a prop
const LeaveReport: React.FC<LeaveReportProps> = ({ leaveSummary }) => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4 dark:text-gray-100">Leave Workday Summary</h1>

            <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="py-2 px-4 text-left dark:text-gray-200">Employee ID</th>
                        <th className="py-2 px-4 text-left dark:text-gray-200">Work Days on Leave</th>
                    </tr>
                </thead>
                <tbody>
                    {leaveSummary.map((item) => (
                        <tr key={item.employee_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-2 px-4 dark:text-gray-300">{item.employee_id}</td>
                            <td className="py-2 px-4 dark:text-gray-300">{item.counted_leave_work_days}</td>
                        </tr>
                    ))}
                    {leaveSummary.length === 0 && (
                        <tr>
                            <td colSpan={2} className="py-4 text-center dark:text-gray-400">No leave data found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LeaveReport;
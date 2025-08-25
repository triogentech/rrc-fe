export default function StaffPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Header Section */}
      <div className="col-span-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all your staff members in one place</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="col-span-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Staff Overview</h2>
              <button className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                + Add New Staff
              </button>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400">
              Staff management content will go here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

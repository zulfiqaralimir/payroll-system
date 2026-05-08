export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">Access Denied</h2>
      <p className="text-sm text-gray-500 text-center max-w-sm">
        You do not have permission to view this section.
        Contact the CFO to request access.
      </p>
    </div>
  );
}

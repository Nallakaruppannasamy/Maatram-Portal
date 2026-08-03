import React from 'react'

interface TableLoaderProps {
  rows?: number
  columns?: number
}

export const TableLoader: React.FC<TableLoaderProps> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="w-full animate-pulse bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <div className="h-12 bg-gray-100/80 border-b border-[#E5E7EB] px-6 flex items-center gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="h-14 px-6 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div key={cIdx} className="h-3.5 bg-gray-100 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TableLoader

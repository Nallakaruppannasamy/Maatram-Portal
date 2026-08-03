import React from 'react'

interface CardSkeletonProps {
  count?: number
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 animate-pulse flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="w-8 h-8 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}

export default CardSkeleton

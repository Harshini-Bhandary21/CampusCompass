'use client'

export default function LoadingSpinner({ message = 'Loading...', size = 'default' }) {
  const sizes = {
    small: 'h-8 w-8',
    default: 'h-12 w-12',
    large: 'h-16 w-16',
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className={`${sizes[size]} border-4 border-gray-200 border-t-primary rounded-full animate-spin`}
        ></div>
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  )
}

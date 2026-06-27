export default function EmptyState({
  title = "Nothing here",
  description = "No data available."
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">

      <div className="text-6xl">
        📭
      </div>

      <h2 className="mt-6 text-2xl font-bold">
        {title}
      </h2>

      <p className="mt-2 text-gray-500">
        {description}
      </p>

    </div>
  );
}
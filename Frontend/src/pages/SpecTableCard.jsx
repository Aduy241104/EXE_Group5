export default function SpecTableCard({ attributes = {} }) {
  const entries = Object.entries(attributes || {});
  if (!entries.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow ring-1 ring-gray-100 p-4">
      <h3 className="font-semibold mb-3">📋 Thông tin chi tiết</h3>
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-t first:border-0">
              <td className="py-2 text-gray-600 capitalize">{k}</td>
              <td className="py-2 font-medium text-gray-800">{v || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

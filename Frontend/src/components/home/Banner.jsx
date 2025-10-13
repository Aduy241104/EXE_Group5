export default function Banner() {
  return (
    <section className="bg-gradient-to-r from-yellow-400 to-orange-500 text-center py-12">
      <h2 className="text-3xl font-bold text-white mb-4 animate-pulse">
        "Nhà" mới toanh. Khám phá nhanh!
      </h2>
      <div className="mt-6 flex justify-center">
        <div className="bg-white shadow-lg rounded-full flex items-center w-full max-w-3xl px-4 py-2">
          <select className="p-2 border-r outline-none">
            <option>Danh mục</option>
            <option>Sách vở</option>
            <option>Điện tử</option>
            <option>Thời trang</option>
          </select>
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            className="flex-1 px-4 py-2 outline-none"
          />
          <select className="p-2 border-l outline-none">
            <option>Khu vực</option>
            <option>Hà Nội</option>
            <option>TP. HCM</option>
          </select>
          <button className="ml-3 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full font-semibold text-white transition-transform duration-300 transform hover:scale-105 hover:from-yellow-500 hover:to-orange-500">
            Tìm kiếm
          </button>
        </div>
      </div>
    </section>
  );
}

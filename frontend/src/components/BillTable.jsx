import { Pencil, Trash2 } from "lucide-react";

const BillTable = ({
  items,
  editingId,
  form,
  setForm,
  selectedDate,
  getItemLabel,
  startEdit,
  saveEdit,
  deleteItem,
  total,
}) => {
  return (
    <>
                     {/* แสดงเฉพาะ Table */}
      <div className="overflow-x-auto rounded-3xl border border-gray-300 mb-8 max-w-4xl mx-auto ">
        <table className="w-full table-fixed">
          {" "}
          <thead className="bg-gray-200 text-gray-600">
            <tr>
              <th className="hidden md:table-cell p-4 w-12 text-center"></th>
              <th className="p-4 text-left">รายการ</th>
              <th className="p-4 text-right w-24 md:w-32">จำนวนเงิน</th>
              <th className="p-4 w-16 md:w-28 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="hidden md:table-cell p-4 text-center text-gray-400">
                  {idx + 1}
                </td>

                {/* รายการ: ใช้คลาส break-words เพื่อกันข้อความยาวเกินจนดันตารางทะลุ */}
                <td className="px-2 md:px-4 py-4">
                  {editingId === item.id ? (
                    <textarea
                      value={form.label}
                      onChange={(e) =>
                        setForm({ ...form, label: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none text-sm md:text-base focus:outline-none focus:border-[#f3a638] transition-all "
                      rows={2}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap wrap-break-words text-gray-700 text-sm md:text-base leading-snug">
                      {getItemLabel(item, selectedDate)}
                    </div>
                  )}
                </td>

                <td className="p-4 text-right">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={Math.abs(form.amount)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setForm({
                          ...form,
                          amount: item.type === "discount" ? -v : v,
                        });
                      }}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 outline-none text-right text-sm focus:outline-none focus:border-[#f3a638] transition-all"
                    />
                  ) : (
                    <span
                      className={`font-bold text-sm md:text-base ${item.amount < 0 ? "text-red-600" : "text-gray-700"}`}
                    >
                      {item.amount.toLocaleString()}
                    </span>
                  )}
                </td>

                <td className="p-2 md:p-4">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-2">
                    {editingId === item.id ? (
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="md:w-auto px-2 py-1 md:px-4 md:py-2 bg-[#D5F5E3] text-[#1D8348] hover:bg-[#abebc6] rounded-xl"
                      >
                        บันทึก
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 bg-[#ffe3c2] rounded-lg text-orange-500 hover:bg-[#ffdaaf]"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 bg-red-100 rounded-lg text-red-500 hover:bg-red-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-100 border-t border-gray-300">
              <td className="hidden md:table-cell p-4"></td>
              <td className="p-4 text-right ">
                รวม
              </td>
              <td className="p-4 text-right">
                <span className="text-[18px]  font-black text-blue-400">
                  {total.toLocaleString()}
                </span>
                <span className="ml-5">
                  บาท
                </span>
              </td>
              <td className="p-4"></td>
            </tr>
          </tbody>
        </table>
      </div>
             {" "}
    </>
  );
};
export default BillTable;

// Local URL/UX validation only. This is not an API query contract or timezone policy.
export function readDateFilter(params, name) {
  const values = params.getAll(name);
  const raw = values[0] || "";
  if (values.length > 1) {
    return {
      value: "",
      error:
        "Parameter tanggal berulang. Pilih satu tanggal atau reset filter; URL belum diubah.",
    };
  }
  if (!raw) return { value: "", error: undefined };

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) {
    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (
      year > 0 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= days[month - 1]
    ) {
      return { value: raw, error: undefined };
    }
  }
  return {
    value: "",
    error:
      "Tanggal pada URL tidak valid. Pilih tanggal kalender dengan format YYYY-MM-DD atau reset filter; URL belum diubah.",
  };
}

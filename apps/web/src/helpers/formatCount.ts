const formatCount = (value?: number | null): string => {
  if (value == null) return "0";
  const n = Number(value);

  if (Number.isNaN(n)) return "0";

  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return n.toString();
};

export default formatCount;

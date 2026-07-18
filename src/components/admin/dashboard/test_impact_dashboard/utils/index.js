// utils/numberFormatter.js
export const formatNumber = (num) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(2).replace(/\.00$/, "") + "M";
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(0) + "k";
    }
    return num.toString();
  };
  
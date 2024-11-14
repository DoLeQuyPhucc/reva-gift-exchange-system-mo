export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateOnlyDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
};

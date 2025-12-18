const DNPAY_PAYMENT_STATUS = {
  REQUIRES_AUTHORIZATION: 'requires_authorization',
  REQUIRES_COMFIRMATION: 'requires_confirmation',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled'
};

interface StatusInfo {
  label: string;
  colorClass: string;
}

export const getPaymentStatus = (status: string): StatusInfo => {
  switch (status) {
    case DNPAY_PAYMENT_STATUS.REQUIRES_AUTHORIZATION:
      return { label: "Requires Authorization", colorClass: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" };
    case DNPAY_PAYMENT_STATUS.REQUIRES_COMFIRMATION:
      return { label: "Requires Confirmation", colorClass: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" };
    case DNPAY_PAYMENT_STATUS.PROCESSING:
      return { label: "Processing", colorClass: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" };
    case DNPAY_PAYMENT_STATUS.SUCCEEDED:
      return { label: "Succeeded", colorClass: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" };
    case DNPAY_PAYMENT_STATUS.FAILED:
      return { label: "Failed", colorClass: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" };
    case DNPAY_PAYMENT_STATUS.CANCELED:
      return { label: "Canceled", colorClass: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300" };
    default:
      return { label: "Unknown", colorClass: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300" };
  }
};
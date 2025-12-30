import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode, SyntheticEvent } from "react";
import { Fragment, memo } from "react";

const modalVariants = cva(
  "inline-block w-full scale-100 rounded-xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle dark:bg-black",
  {
    defaultVariants: { size: "sm" },
    variants: {
      size: {
        lg: "sm:max-w-5xl",
        md: "sm:max-w-3xl",
        sm: "sm:max-w-lg",
        xs: "sm:max-w-sm"
      }
    }
  }
);

interface ModalProps extends VariantProps<typeof modalVariants> {
  children: ReactNode | ReactNode[];
  onClose?: () => void;
  show: boolean;
  title?: ReactNode;
  staticBackdrop?: boolean;
  closeButtonAction?: () => void;
}

const Modal = ({ children, onClose, show, size = "sm", title, staticBackdrop = false, closeButtonAction }: ModalProps) => {

  const handleClose = (event: SyntheticEvent) => {
    if (staticBackdrop) return;
    event.stopPropagation(); // This stops the event from propagating further
    onClose?.();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ngăn chặn sự kiện nổi bọt
    e.stopPropagation();

    // Nếu click đúng vào overlay
    if (e.target === e.currentTarget) {
      if (staticBackdrop) {
        return;
      }
      onClose?.();
    }
  };

  if (!show) return null;

  return (
    <Transition as={Fragment} show={show}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 flex min-h-screen items-center justify-center overflow-y-auto p-4 text-center sm:block sm:p-0 z-70"
        onClose={() => {
          if (!staticBackdrop) {
            onClose?.();
          }
        }}
        onClick={handleOverlayClick}
      >
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" />
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80"
          onClick={handleOverlayClick}
        />
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-100"
          enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <DialogPanel className={modalVariants({ size })}
          onClick={(e) => e.stopPropagation()}>
            {title ? (
              <DialogTitle className="divider flex items-center justify-between px-5 py-3.5 rounded-t-xl text-lg font-medium text-gray-900 dark:text-gray-100">
                <b>{title}</b>
                {onClose ? (
                  <button
                    className="rounded-full p-1 text-gray-800 hover:bg-gray-200 dark:text-gray-100 dark:hover:bg-[#121212] button-animated"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (closeButtonAction) {
                        closeButtonAction();
                      } else {
                        onClose?.();
                      }
                    }}
                    type="button"
                  >
                    <XMarkIcon className="size-5" />
                  </button>
                ) : null}
              </DialogTitle>
            ) : null}
            {children}
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
};

export default memo(Modal);

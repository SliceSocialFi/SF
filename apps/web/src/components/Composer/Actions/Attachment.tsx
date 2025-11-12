import {
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon
} from "@heroicons/react/24/outline";
import {
  MediaAudioMimeType,
  MediaImageMimeType
} from "@lens-protocol/metadata";
import { MAX_IMAGE_UPLOAD } from "@slice/data/constants";
import type { ChangeEvent, JSX } from "react";
import React, {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { toast } from "sonner";
import MenuTransition from "@/components/Shared/MenuTransition";
import { Spinner, Tooltip } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import useUploadAttachments from "@/hooks/useUploadAttachments";
import { usePostAttachmentStore } from "@/store/non-persisted/post/usePostAttachmentStore";
import { createPortal } from "react-dom";

const ImageMimeType = Object.values(MediaImageMimeType);
const AudioMimeType = Object.values(MediaAudioMimeType);
const VideoMimeType = [
  "video/mp4",
  "video/mpeg",
  "video/ogg",
  "video/webm",
  "video/quicktime"
];

type AttachmentMenuProps = {
  onPickImage?: () => void;
  onPickVideo?: () => void;
  onPickAudio?: () => void;
  /** báo cho cha biết đang mở/đóng (để cho phép overflow nếu cần) */
  onOpenChange?: (open: boolean) => void;
};

const Attachment: React.FC<AttachmentMenuProps> = ({
  onPickImage,
  onPickVideo,
  onPickAudio,
  onOpenChange
}) => {
  const { attachments, isUploading } = usePostAttachmentStore();
  const { handleUploadAttachments } = useUploadAttachments();
  const [open, setOpen] = useState(false);
  const id = useId();

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const computePosition = () => {
    const btn = btnRef.current;
    const panel = panelRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelW = panel?.offsetWidth ?? 280;
    const panelH = panel?.offsetHeight ?? 220;

    let left = rect.left;
    let top = rect.bottom + gap;

    if (left + panelW > vw - 8) left = Math.max(8, vw - panelW - 8);
    if (top + panelH > vh - 8) top = Math.max(8, rect.top - gap - panelH);

    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(computePosition);
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || btnRef.current?.contains(target))
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isTypeAllowed = (files: FileList) =>
    Array.from(files).some((file) =>
      [...ImageMimeType, ...AudioMimeType, ...VideoMimeType].includes(
        file.type
      )
    );

  const isUploadAllowed = (files: FileList) => {
    const isImage = files[0]?.type.startsWith("image");
    return isImage
      ? attachments.length + files.length <= MAX_IMAGE_UPLOAD
      : files.length === 1;
  };

  const handleAttachment = async (evt: ChangeEvent<HTMLInputElement>) => {
    evt.preventDefault();
    setOpen(false);
    const { files } = evt.target;
    if (!files) return;

    if (!isUploadAllowed(files)) {
      return toast.error(
        `Exceeded max limit of 1 audio, 1 video, or ${MAX_IMAGE_UPLOAD} images`
      );
    }
    if (!isTypeAllowed(files)) {
      return toast.error("File format not allowed.");
    }
    try {
      await handleUploadAttachments(files);
      evt.target.value = "";
    } catch {
      toast.error("Something went wrong while uploading!");
    }
  };

  const disableImageUpload = attachments.length >= MAX_IMAGE_UPLOAD;
  const disableOtherUpload = attachments.length > 0;

  const renderUploadOption = (
    idSuffix: string,
    label: string,
    icon: JSX.Element,
    accept: string[],
    disabled: boolean
  ) => (
    <label
      className={cn(
        "menu-item !flex cursor-pointer items-center gap-1 space-x-1 rounded-lg",
        { "opacity-50": disabled }
      )}
      htmlFor={`${id}_${idSuffix}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {icon}
      <span className="text-sm">{label}</span>
      <input
        accept={accept.join(",")}
        className="hidden"
        disabled={disabled}
        id={`${id}_${idSuffix}`}
        multiple={idSuffix === "image"}
        onChange={handleAttachment}
        type="file"
      />
    </label>
  );

  return (
    <Tooltip content="Media" placement="top" withDelay>
      <div className="relative">
        <button
          ref={btnRef}
          aria-label="Attachment"
          className="rounded-full outline-offset-8"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          {isUploading ? <Spinner size="sm" /> : <PhotoIcon className="size-5" />}
        </button>

        {open &&
          createPortal(
            <MenuTransition show>
              <div
                ref={panelRef}
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  zIndex: 1000
                }}
                className="w-[280px] rounded-xl border border-gray-200 bg-white shadow-xs
                           focus:outline-hidden dark:border-gray-700 dark:bg-gray-900"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <div className="p-2">
                  {renderUploadOption(
                    "image",
                    "Upload image(s)",
                    <PhotoIcon className="size-4" />,
                    ImageMimeType,
                    disableImageUpload
                  )}
                  {renderUploadOption(
                    "video",
                    "Upload video",
                    <VideoCameraIcon className="size-4" />,
                    VideoMimeType,
                    disableOtherUpload
                  )}
                  {renderUploadOption(
                    "audio",
                    "Upload audio",
                    <MusicalNoteIcon className="size-4" />,
                    AudioMimeType,
                    disableOtherUpload
                  )}
                </div>
              </div>
            </MenuTransition>,
            document.body
          )}
      </div>
    </Tooltip>
  );
};

export default memo(Attachment);

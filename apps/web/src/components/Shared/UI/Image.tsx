import { PLACEHOLDER_IMAGE } from "@slice/data/constants";
import type {
  DetailedHTMLProps,
  ImgHTMLAttributes,
  Ref,
  SyntheticEvent
} from "react";
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { createPortal } from "react-dom";

/** Props mở rộng */
type BaseImgProps = DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;

export interface SmartImageProps extends BaseImgProps {
  /** Ảnh fallback khi lỗi (mặc định: PLACEHOLDER_IMAGE) */
  fallbackSrc?: string;
  /** Bật xem ảnh phóng to bằng Portal khi click */
  previewOnClick?: boolean;
  /** Class cho khung preview */
  previewClassName?: string;
  /** Z-index cho preview */
  previewZIndex?: number;
  /** Giữ tỉ lệ khung để hạn chế layout shift (ví dụ "1/1", "16/9") */
  aspectRatio?: `${number}/${number}`;
}

const Image = forwardRef(function SmartImage(
  {
    onError,
    fallbackSrc = PLACEHOLDER_IMAGE,
    previewOnClick = false,
    previewClassName,
    previewZIndex = 1050,
    aspectRatio, // ví dụ "16/9"
    loading = "lazy",
    decoding = "async",
    ...props
  }: SmartImageProps,
  ref: Ref<HTMLImageElement>
) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleError = useCallback(
    (event: SyntheticEvent<HTMLImageElement, Event>) => {
      if (!imageLoadFailed) {
        setImageLoadFailed(true);
        onError?.(event);
      }
    },
    [imageLoadFailed, onError]
  );

  // reset cờ lỗi nếu src thay đổi
  useEffect(() => {
    setImageLoadFailed(false);
  }, [props.src]);

  // đóng preview bằng ESC
  useEffect(() => {
    if (!showPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPreview(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPreview]);

  const imgElement = (
    <img
      {...props}
      ref={ref}
      alt={props.alt || ""}
      onError={handleError}
      loading={loading}
      decoding={decoding as "async" | "sync" | "auto"}
      src={imageLoadFailed ? fallbackSrc : (props.src as string | undefined)}
      onClick={(e) => {
        props.onClick?.(e);
        if (previewOnClick) setShowPreview(true);
      }}
      style={{
        maxWidth: "100%",
        display: "block",
        ...(props.style || {})
      }}
    />
  );

  // nếu cần khung cố định tỉ lệ để giảm CLS
  const wrapped = useMemo(() => {
    if (!aspectRatio) return imgElement;
    return (
      <div
        style={{
          aspectRatio,
          width: "100%",
          overflow: "hidden"
        }}
      >
        {imgElement}
      </div>
    );
  }, [aspectRatio, imgElement]);

  return (
    <>
      {wrapped}

      {/* Preview qua Portal: fixed + backdrop, không đẩy layout, không bị overflow cắt */}
      {previewOnClick &&
        showPreview &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: previewZIndex
            }}
            onMouseDown={() => setShowPreview(false)}
          >
            {/* backdrop */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0.7))",
                backdropFilter: "blur(2px)"
              }}
            />
            {/* khung ảnh */}
            <div
              className={previewClassName}
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                padding: "24px"
              }}
              // chặn click vào ảnh không đóng
              onMouseDown={(e) => e.stopPropagation()}
            >
              <img
                alt={props.alt || ""}
                src={imageLoadFailed ? fallbackSrc : (props.src as string | undefined)}
                style={{
                  maxWidth: "min(92vw, 1400px)",
                  maxHeight: "92vh",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px rgba(0,0,0,.35)",
                  objectFit: "contain",
                  backgroundColor: "transparent"
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
});

export default memo(Image);

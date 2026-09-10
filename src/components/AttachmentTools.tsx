import { useEffect, useRef, useState } from 'react';
import type { Id } from '../../convex/_generated/dataModel';

export type AttachmentMeta = {
  attachmentStorageId?: Id<'_storage'>;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
};

type AttachmentLike = {
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
};

export const isImageAttachment = (attachment: Pick<AttachmentLike, 'attachmentName' | 'attachmentType'>) =>
  attachment.attachmentType?.startsWith('image/')
  || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(attachment.attachmentName ?? '');

export const formatFileSize = (size?: number) => {
  if (!size) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const uploadAttachment = async (
  file: File,
  generateUploadUrl: () => Promise<string>,
): Promise<AttachmentMeta> => {
  const uploadUrl = await generateUploadUrl();
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Attachment upload failed. Please try again.');
  }

  const uploadResult = await uploadResponse.json();
  return {
    attachmentStorageId: uploadResult.storageId,
    attachmentName: file.name,
    attachmentType: file.type,
    attachmentSize: file.size,
  };
};

export const AttachmentLink = ({
  attachment,
  compact = false,
  onImageClick,
}: {
  attachment: AttachmentLike;
  compact?: boolean;
  onImageClick?: (image: { url: string; name: string }) => void;
}) => {
  if (!attachment.attachmentUrl) return null;

  const isImage = isImageAttachment(attachment);

  return (
    <a
      href={attachment.attachmentUrl}
      target="_blank"
      rel="noreferrer"
      className={`attachment-link ${isImage ? 'attachment-image' : ''} ${compact ? 'compact' : ''}`}
      onClick={(event) => {
        if (!isImage || !onImageClick) return;
        event.preventDefault();
        onImageClick({ url: attachment.attachmentUrl!, name: attachment.attachmentName || 'Attached image' });
      }}
    >
      {isImage ? (
        <>
          <img
            src={attachment.attachmentUrl}
            alt={attachment.attachmentName || 'Attached image'}
            className={compact ? 'attachment-thumb' : 'attachment-preview'}
          />
          {!compact && (
            <span className="attachment-copy">
              <span className="attachment-name">{attachment.attachmentName || 'Attached image'}</span>
              <span className="attachment-size">{formatFileSize(attachment.attachmentSize)} · Open full size</span>
            </span>
          )}
        </>
      ) : (
        <>
          <span className="material-symbols-outlined attachment-icon">attach_file</span>
          <span className="attachment-copy">
            <span className="attachment-name">{attachment.attachmentName || 'Attachment'}</span>
            <span className="attachment-size">{formatFileSize(attachment.attachmentSize)}</span>
          </span>
        </>
      )}
    </a>
  );
};

export const AttachmentPicker = ({
  selectedFile,
  onFileChange,
  onClear,
}: {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  onClear: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile || !isImageAttachment({ attachmentName: selectedFile.name, attachmentType: selectedFile.type })) {
      setImagePreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleChange = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (!file) return;
    onFileChange(file);
  };

  return (
    <>
      <input ref={fileInputRef} type="file" hidden onChange={(event) => handleChange(event.target.files)} />
      <button type="button" className="chat-drawer-send-btn" onClick={() => fileInputRef.current?.click()} title="Attach an image or file" aria-label="Attach an image or file">
        <span className="material-symbols-outlined">attach_file</span>
      </button>
      {selectedFile && (
        <div className="selected-attachment-pill">
          {imagePreviewUrl ? <img src={imagePreviewUrl} alt="Selected upload preview" className="selected-attachment-preview" /> : <span className="material-symbols-outlined">attach_file</span>}
          <span>{selectedFile.name}</span>
          <button type="button" aria-label="Remove attachment" onClick={onClear}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </>
  );
};

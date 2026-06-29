import { useRef } from 'react';
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

export const AttachmentLink = ({ attachment, compact = false }: { attachment: AttachmentLike; compact?: boolean }) => {
  if (!attachment.attachmentUrl) return null;

  const isImage = attachment.attachmentType?.startsWith('image/');

  return (
    <a
      href={attachment.attachmentUrl}
      target="_blank"
      rel="noreferrer"
      className={`attachment-link ${compact ? 'compact' : ''}`}
    >
      {isImage ? (
        <img src={attachment.attachmentUrl} alt={attachment.attachmentName || 'Attachment'} className="attachment-thumb" />
      ) : (
        <span className="material-symbols-outlined attachment-icon">attach_file</span>
      )}
      <span className="attachment-copy">
        <span className="attachment-name">{attachment.attachmentName || 'Attachment'}</span>
        <span className="attachment-size">{formatFileSize(attachment.attachmentSize)}</span>
      </span>
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

  const handleChange = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (!file) return;
    onFileChange(file);
  };

  return (
    <>
      <input ref={fileInputRef} type="file" hidden onChange={(event) => handleChange(event.target.files)} />
      <button type="button" className="chat-drawer-send-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
        <span className="material-symbols-outlined">attach_file</span>
      </button>
      {selectedFile && (
        <div className="selected-attachment-pill">
          <span className="material-symbols-outlined">attach_file</span>
          <span>{selectedFile.name}</span>
          <button type="button" aria-label="Remove attachment" onClick={onClear}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </>
  );
};

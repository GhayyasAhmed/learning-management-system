export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function validateImageFile(
  file: File,
  options: FileValidationOptions = {}
): string | null {
  const maxSizeMB = options.maxSizeMB ?? 2;
  const allowedTypes = options.allowedTypes ?? [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return "Please upload a valid image file (PNG, JPG, or WEBP).";
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Image must be smaller than ${maxSizeMB}MB.`;
  }
  return null;
}
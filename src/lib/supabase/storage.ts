import { createClient } from './client';

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

/**
 * Uploads an image file to Supabase Storage bucket ('journal-attachments').
 * Falls back gracefully to base64 Data URL if bucket is not yet created in Supabase Dashboard.
 */
export async function uploadJournalImage(file: File): Promise<UploadResult> {
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fileSize = file.size;
  const fileType = file.type || 'image/png';

  const supabase = createClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('journal-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('journal-attachments')
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            fileName: file.name,
            fileSize,
            fileType,
          };
        }
      } else {
        console.warn('Supabase storage upload notice:', error?.message);
      }
    } catch (err) {
      console.warn('Storage bucket upload fallback:', err);
    }
  }

  // Graceful fallback: convert to Data URL if storage bucket is not active
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        fileName: file.name,
        fileSize,
        fileType,
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

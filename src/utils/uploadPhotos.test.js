import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadPhotos } from './uploadPhotos';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn()
    }
  }
}));

describe('uploadPhotos', () => {
  const mockUpload = vi.fn();
  const mockGetPublicUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    supabase.storage.from.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl
    });
  });

  it('should upload a new file and return the photo object', async () => {
    mockUpload.mockResolvedValue({ data: {}, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://fake.url/image.jpg' } });

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const photos = [{ file, description: 'Test Photo', author: 'Me' }];

    const result = await uploadPhotos(photos);

    expect(mockUpload).toHaveBeenCalled();
    expect(mockGetPublicUrl).toHaveBeenCalled();
    expect(result).toEqual([
      {
        url: 'https://fake.url/image.jpg',
        position: 0,
        author: 'Me',
        kind: 'photo',
        description: 'Test Photo'
      }
    ]);
  });

  it('should ignore already uploaded files and return them', async () => {
    const photos = [{ url: 'https://existing.url/image.jpg', description: 'Existing', author: 'You' }];
    const result = await uploadPhotos(photos);

    expect(mockUpload).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        url: 'https://existing.url/image.jpg',
        position: 0,
        author: 'You',
        kind: 'photo',
        description: 'Existing'
      }
    ]);
  });

  it('should include property_id and room_type_id if provided in options', async () => {
    const photos = [{ url: 'https://existing.url/image.jpg', description: 'Room' }];
    const result = await uploadPhotos(photos, { property_id: 'prop-1', room_type_id: 'rt-1' });

    expect(result[0]).toMatchObject({
      property_id: 'prop-1',
      room_type_id: 'rt-1'
    });
  });

  it('should wrap in photo key if wrapInPhotoKey is true', async () => {
    const photos = [{ url: 'https://existing.url/image.jpg', description: 'Room' }];
    const result = await uploadPhotos(photos, { wrapInPhotoKey: true, property_id: 'prop-1' });

    expect(result[0]).toEqual({
      photo: expect.objectContaining({
        url: 'https://existing.url/image.jpg',
        property_id: 'prop-1'
      })
    });
  });

  it('should throw error if upload fails', async () => {
    mockUpload.mockResolvedValue({ data: null, error: new Error('Upload failed') });

    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const photos = [{ file, description: 'Test Photo' }];

    await expect(uploadPhotos(photos)).rejects.toThrow('Failed to upload photo "test.jpg": Upload failed');
  });
});

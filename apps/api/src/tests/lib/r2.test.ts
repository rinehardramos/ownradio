import { describe, it, expect, vi } from 'vitest';

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn().mockResolvedValue({}),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn(),
}));

import { uploadToR2 } from '../../lib/r2.js';

describe('uploadToR2', () => {
  it('calls S3 PutObjectCommand with correct params', async () => {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    await uploadToR2('djs/test.jpg', Buffer.from('imgdata'), 'image/jpeg');

    expect(mockSend).toHaveBeenCalledOnce();
    expect(vi.mocked(PutObjectCommand)).toHaveBeenCalledWith(
      expect.objectContaining({ Key: 'djs/test.jpg', ContentType: 'image/jpeg' })
    );
  });
});

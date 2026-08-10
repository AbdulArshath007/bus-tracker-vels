// ─── S3 Service ───────────────────────────────────────────────────────────────
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private client: S3Client;
  private bucket: string;
  private presignedTtl: number;

  constructor(private configService: ConfigService) {
    const endpoint = configService.get<string>('s3.endpoint');
    this.client = new S3Client({
      region: this.configService.get<string>('s3.region') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId') || '',
        secretAccessKey: this.configService.get<string>('s3.secretAccessKey') || '',
      },
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
    this.bucket = this.configService.get<string>('s3.bucketName') || 'bus-tracker-bucket';
    this.presignedTtl = this.configService.get<number>('s3.presignedUrlTtlSeconds') || 300;
  }

  // Upload file bytes and return the S3 object key
  async upload(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<string> {
    const ext = originalName.split('.').pop()?.toLowerCase() ?? 'bin';
    const key = `attachments/${uuidv4()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Strict private access — access only via pre-signed URLs
        ACL: 'private' as any,
      }),
    );

    return key;
  }

  // Return a short-lived pre-signed download URL
  async presign(key: string): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: this.presignedTtl });
  }

  // Delete an object (called by cleanup job)
  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.error(`S3 delete failed for key ${key}: ${err.message}`);
      throw err;
    }
  }
}

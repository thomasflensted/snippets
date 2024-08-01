import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from 'crypto'

const s3 = new S3Client({
    region: 'BUCKET_REGION',
    credentials: {
        accessKeyId: 'BUCKET_ACCESS_KEY',
        secretAccessKey: 'BUCKET_SECRET'
    },
})

async function uploadImageToS3(image: File) {

    const checksum = await computeSHA256(image);
    const signedUrlResult = await getSignedURL(image.type, image.size, checksum);
    if (!signedUrlResult.url) return null;

    await fetch(signedUrlResult.url, {
        method: 'PUT',
        body: image,
        headers: {
            "Content-Type": 'image/jpeg'
        }
    })
    return signedUrlResult;
}

async function computeSHA256(file: File) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashIndex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join("")
    return hashIndex;
}

async function getSignedURL(type: string, size: number, checksum: string) {

    const id = 'thomas';

    const generateFilename = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

    const putObjectCommand = new PutObjectCommand({
        Bucket: 'YOURBUCKETNAME',
        Key: generateFilename(),
        ContentLength: size,
        ContentType: type,
        ChecksumSHA256: checksum,
        Metadata: {
            userId: id.toString()
        }
    })

    const signedUrl = await getSignedUrl(s3, putObjectCommand, { expiresIn: 60 })
    if (!signedUrl) return { error: "Something went wrong." };
    return { url: signedUrl }
}
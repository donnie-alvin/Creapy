const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { MONETIZATION_MODE } = require('../utils/monetization');

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

exports.getR2SignedUploadUrl = async (req, res, next) => {
  try {
    const { contentType, folder = 'uploads' } = req.query;
    const normalizedFolder = String(folder || "uploads").toLowerCase();

    if (!contentType) {
      return res.status(400).json({ status: 'fail', message: 'contentType is required' });
    }

    if (
      normalizedFolder === "listings" &&
      MONETIZATION_MODE === "LANDLORD_PAID"
    ) {
      if (!req.user || req.user.role !== "landlord") {
        return res.status(403).json({
          status: "fail",
          message: "Landlord role required to publish listings",
        });
      }
    }

    const ext = (contentType.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '');
    const random = crypto.randomBytes(10).toString('hex');
    const userId = req.user?._id?.toString() || 'anon';

    const key = `${normalizedFolder}/${userId}/${Date.now()}-${random}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 }); // 60 seconds

    const publicUrl = `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;

    return res.status(200).json({
      status: 'success',
      data: { uploadUrl, key, publicUrl },
    });
  } catch (err) {
    return next(err);
  }
};

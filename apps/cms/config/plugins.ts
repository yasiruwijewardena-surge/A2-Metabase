import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  // Railway's container filesystem is ephemeral: anything written to
  // public/uploads disappears on the next deploy. When Cloudinary credentials
  // are present we upload there instead; without them we fall back to local
  // disk, which keeps `npm run develop` working on a fresh clone.
  const cloudinaryName = env('CLOUDINARY_NAME');
  const useCloudinary = Boolean(cloudinaryName);

  return {
    'users-permissions': {
      config: {
        jwtManagement: 'refresh',
        sessions: {
          httpOnly: true,
        },
      },
    },
    upload: {
      config: {
        ...(useCloudinary
          ? {
              provider: 'cloudinary',
              providerOptions: {
                cloud_name: cloudinaryName,
                api_key: env('CLOUDINARY_KEY'),
                api_secret: env('CLOUDINARY_SECRET'),
              },
              actionOptions: {
                upload: { folder: env('CLOUDINARY_FOLDER', 'metabase-replica') },
                uploadStream: { folder: env('CLOUDINARY_FOLDER', 'metabase-replica') },
                delete: {},
              },
            }
          : {}),
        security: {
          allowedTypes: allowedMediaTypes,
          deniedTypes,
        },
      },
    },
  };
};

export default config;

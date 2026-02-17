import path from 'path';

// Get the base uploads directory based on environment
// Supports UPLOADS_DIR env var for Docker/custom deployments
export function getUploadsBaseDir(): string {
    if (process.env.UPLOADS_DIR) {
        return process.env.UPLOADS_DIR;
    }
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction
        ? path.join(process.cwd(), 'build', 'client', 'uploads')
        : path.join(process.cwd(), 'static', 'uploads');
}

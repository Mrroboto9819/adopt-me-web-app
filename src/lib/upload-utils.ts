import path from 'path';

// Get the base uploads directory based on environment
export function getUploadsBaseDir(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction
        ? path.join(process.cwd(), 'build', 'client', 'uploads')
        : path.join(process.cwd(), 'static', 'uploads');
}

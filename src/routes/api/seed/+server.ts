import { json } from '@sveltejs/kit';
import { seedBreeds } from '$lib/seed';

export async function GET() {
    try {
        await seedBreeds();
        return json({ status: 'success', message: 'Database reset and seeded successfully!' });
    } catch (error: any) {
        return json({ status: 'error', message: error.message }, { status: 500 });
    }
}

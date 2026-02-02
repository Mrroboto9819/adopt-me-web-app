import { createYoga } from 'graphql-yoga';
import { schema } from '$lib/graphql/schema';
import { connectDB } from '$lib/db';
import { verifyToken } from '$lib/auth';
import { User } from '$lib/models/User';
import type { RequestEvent } from '@sveltejs/kit';

// Connect to database on server startup
connectDB();

const yoga = createYoga<RequestEvent>({
    schema,
    graphqlEndpoint: '/api/graphql',
    fetchAPI: { Response },
    context: async ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return { user: null };

        const token = authHeader.split(' ')[1]; // Bearer <token>
        if (!token) return { user: null };

        try {
            const payload = verifyToken(token);
            if (!payload) return { user: null };

            const user = await User.findById(payload.userId);
            return { user };
        } catch (error) {
            console.error('Auth context error:', error);
            return { user: null };
        }
    }
});

export { yoga as GET, yoga as POST, yoga as OPTIONS };

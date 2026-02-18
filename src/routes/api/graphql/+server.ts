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
        if (!authHeader) return { user: null, isBanned: false };

        const token = authHeader.split(' ')[1]; // Bearer <token>
        if (!token) return { user: null, isBanned: false };

        try {
            const payload = verifyToken(token);
            if (!payload) return { user: null, isBanned: false };

            const user = await User.findById(payload.userId);

            // Check if user is banned - return banned context so resolvers can handle it
            if (user && user.isBanned) {
                return {
                    user: null,
                    isBanned: true,
                    banReason: user.banReason || 'Your account has been suspended'
                };
            }

            return { user, isBanned: false };
        } catch (error) {
            console.error('Auth context error:', error);
            return { user: null, isBanned: false };
        }
    }
});

export { yoga as GET, yoga as POST, yoga as OPTIONS };

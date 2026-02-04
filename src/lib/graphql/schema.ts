import { createSchema } from 'graphql-yoga';
import { Pet } from '$lib/models/Pet';
import { User } from '$lib/models/User';
import { Post } from '$lib/models/Post';
import { Breed } from '$lib/models/Breed';
import { Species } from '$lib/models/Species';
import { PostVote } from '$lib/models/PostVote';
import { Comment } from '$lib/models/Comment';
import { signToken } from '$lib/auth';
import type { IPet } from '$lib/models/Pet';
import type { IUser } from '$lib/models/User';
import type { IPost } from '$lib/models/Post';
import { GraphQLError } from 'graphql';

const typeDefs = `
  type User {
    id: ID!
    email: String!
    name: String!
    role: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    profilePicture: String
    coverImage: String
    address: Address
    timezone: String
    preferredSpecies: [Species!]!
    posts: [Post!]!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Pet {
    id: ID!
    name: String!
    species: Species
    customSpecies: String
    breed: Breed
    customBreed: String
    age: Int
    gender: String
    size: String
    color: String
    images: [String!]!
    coverImage: String
    description: String
    status: String
    health: Health
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    owner: User
  }

  type Species {
    id: ID!
    name: String!
    label: String!
    createdAt: String!
    updatedAt: String!
  }

  type Breed {
    id: ID!
    name: String!
    species: Species
    createdAt: String!
    updatedAt: String!
  }

  type Health {
    vaccinated: Boolean
    neutered: Boolean
  }

  type Address {
    street: String
    city: String
    state: String
    zipCode: String
    country: String
  }

  input AddressInput {
    street: String!
    city: String!
    state: String!
    zipCode: String!
    country: String
  }

  enum PostType {
    post
    adopt
    missing
  }

  type Post {
    id: ID!
    title: String!
    description: String!
    postType: PostType!
    tags: [String!]!
    images: [String!]!
    video: String
    location: String
    adoptionAddress: Address
    createdAt: String!
    updatedAt: String!
    author: User!
    pet: Pet
    upvotes: Int!
    downvotes: Int!
    voteScore: Int!
    userVote: Int
    commentCount: Int!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    parent: Comment
    replies: [Comment!]!
    createdAt: String!
    updatedAt: String!
  }

  type PostVote {
    id: ID!
    user: User!
    post: Post!
    value: Int!
    createdAt: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type PostEdge {
    cursor: String!
    node: Post!
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type Query {
    hello: String
    pets(limit: Int = 50, offset: Int = 0): [Pet!]!
    myPets(limit: Int = 50, offset: Int = 0): [Pet!]!
    myPosts(limit: Int = 50, offset: Int = 0): [Post!]!
    user(id: ID!): User
    userPosts(userId: ID!, limit: Int = 50, offset: Int = 0): [Post!]!
    userPets(userId: ID!, limit: Int = 50, offset: Int = 0): [Pet!]!
    users(limit: Int = 50, offset: Int = 0): [User!]!
    posts(limit: Int = 50, offset: Int = 0): [Post!]!
    post(id: ID!): Post
    postsFeed(first: Int = 10, after: String, speciesId: ID, postType: PostType, sortBy: String): PostConnection!
    me: User
    species: [Species!]!
    getBreeds: [Breed!]!
    breedsBySpeciesId(speciesId: ID!): [Breed!]!
    commentsByPost(postId: ID!, limit: Int = 50, offset: Int = 0): [Comment!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    addPet(name: String!, speciesId: ID, customSpecies: String, breedId: ID, customBreed: String, age: Int, coverImage: String, images: [String!]): Pet!
    createUser(email: String!, name: String!, password: String!, address: AddressInput, timezone: String, profilePicture: String, preferredSpecies: [ID!]): User!
    createPost(title: String!, description: String!, postType: PostType!, petId: ID, location: String, tags: [String!], images: [String!], video: String, adoptionAddress: AddressInput): Post!

    updateUser(name: String, address: AddressInput, timezone: String, profilePicture: String, coverImage: String, preferredSpecies: [ID!]): User!
    
    
    # Breed Mutations
    initializeBreeds: [Breed!]!
    addBreedToSpecies(species: String!, breedName: String!): Breed!
    removeBreedFromSpecies(species: String!, breedName: String!): Breed!
    createSpecies(species: String!, label: String!, breeds: [String!]!): Breed!

    # Vote Mutations
    votePost(postId: ID!, value: Int!): Post!
    removeVote(postId: ID!): Post!

    # Comment Mutations
    createComment(postId: ID!, content: String!, parentId: ID): Comment!
    deleteComment(commentId: ID!): Boolean!
  }
`;

interface Context {
  user: IUser | null;
}

interface AddressArgs {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface PaginationArgs {
  limit?: number;
  offset?: number;
}

interface PostsFeedArgs {
  first?: number;
  after?: string;
  speciesId?: string;
  postType?: 'post' | 'adopt' | 'missing';
  sortBy?: 'recent' | 'popular';
}

interface LoginArgs {
  email: string;
  password: string;
}

interface CreateUserArgs {
  email: string;
  name: string;
  password: string;
  address?: AddressArgs;
  timezone?: string;
  profilePicture?: string;
  preferredSpecies?: string[];
}

interface UpdateUserArgs {
  name?: string;
  address?: AddressArgs;
  timezone?: string;
  profilePicture?: string;
  coverImage?: string;
  preferredSpecies?: string[];
}

interface AddPetArgs {
  name: string;
  speciesId?: string;
  customSpecies?: string;
  breedId?: string;
  customBreed?: string;
  age?: number;
  coverImage?: string;
  images?: string[];
}

interface CreatePostArgs {
  title: string;
  description: string;
  postType: 'post' | 'adopt' | 'missing';
  petId?: string;
  location?: string;
  tags?: string[];
  images?: string[];
  video?: string;
  adoptionAddress?: AddressArgs;
}

interface VotePostArgs {
  postId: string;
  value: number;
}

interface CreateCommentArgs {
  postId: string;
  content: string;
  parentId?: string;
}

interface CommentsByPostArgs {
  postId: string;
  limit?: number;
  offset?: number;
}

import { initialBreeds } from '$lib/data/initialBreeds';

// ... (resolvers)

const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    pets: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs) => {
      // Use populate to prevent N+1 queries
      return await Pet.find({})
        .populate('owner')
        .populate('species')
        .populate('breed')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    myPets: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Only return pets owned by the current user
      return await Pet.find({ owner: context.user._id })
        .populate('owner')
        .populate('species')
        .populate('breed')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    myPosts: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Only return posts created by the current user
      return await Post.find({ author: context.user._id, isActive: true })
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    user: async (_: unknown, { id }: { id: string }) => {
      return await User.findById(id);
    },
    userPosts: async (_: unknown, { userId, limit = 50, offset = 0 }: { userId: string } & PaginationArgs) => {
      // Public posts by a specific user
      return await Post.find({ author: userId, isActive: true })
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    userPets: async (_: unknown, { userId, limit = 50, offset = 0 }: { userId: string } & PaginationArgs) => {
      // Public pets by a specific user
      return await Pet.find({ owner: userId })
        .populate('owner')
        .populate('species')
        .populate('breed')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    users: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs) => {
      return await User.find({})
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    posts: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs) => {
      // Use populate to prevent N+1 queries
      return await Post.find({})
        .populate('author')
        .populate('pet')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    post: async (_: unknown, { id }: { id: string }) => {
      return await Post.findById(id)
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        });
    },
    postsFeed: async (_: unknown, { first = 10, after, speciesId, postType, sortBy = 'popular' }: PostsFeedArgs, context: Context) => {
      // Build query
      const query: any = { isActive: true };

      // Filter by postType if provided
      if (postType) {
        query.postType = postType;
      }

      // Filter by species if provided - need to find pets with this species first
      let petIds: any[] | null = null;
      if (speciesId) {
        const petsWithSpecies = await Pet.find({ species: speciesId }).select('_id');
        petIds = petsWithSpecies.map(p => p._id);
        query.pet = { $in: petIds };
      }

      // Get user's preferred species for prioritization
      let userPreferredSpeciesIds: string[] = [];
      if (context.user) {
        const userWithPrefs = await User.findById(context.user._id).select('preferredSpecies');
        if (userWithPrefs?.preferredSpecies && userWithPrefs.preferredSpecies.length > 0) {
          userPreferredSpeciesIds = userWithPrefs.preferredSpecies.map((s: any) => s.toString());
        }
      }

      // For popular sorting, we use aggregation to calculate vote scores
      if (sortBy === 'popular') {
        // Use aggregation pipeline for popularity sorting
        const pipeline: any[] = [
          { $match: query },
          // Lookup votes to calculate score
          {
            $lookup: {
              from: 'postvotes',
              localField: '_id',
              foreignField: 'post',
              as: 'votes'
            }
          },
          // Calculate vote score
          {
            $addFields: {
              voteScore: {
                $subtract: [
                  { $size: { $filter: { input: '$votes', cond: { $eq: ['$$this.value', 1] } } } },
                  { $size: { $filter: { input: '$votes', cond: { $eq: ['$$this.value', -1] } } } }
                ]
              }
            }
          },
          // Lookup pet to get species for prioritization
          {
            $lookup: {
              from: 'pets',
              localField: 'pet',
              foreignField: '_id',
              as: 'petData'
            }
          },
          // Add preference bonus and calculate combined score
          // Preferred species get a boost (+5 points) but don't completely override popularity
          // This allows highly popular non-preferred posts to still appear in the mix
          {
            $addFields: {
              preferenceBonus: {
                $cond: {
                  if: {
                    $and: [
                      { $gt: [{ $size: '$petData' }, 0] },
                      { $gt: [userPreferredSpeciesIds.length, 0] },
                      {
                        $in: [
                          { $toString: { $arrayElemAt: ['$petData.species', 0] } },
                          userPreferredSpeciesIds
                        ]
                      }
                    ]
                  },
                  then: 5, // Boost preferred species by 5 points
                  else: 0
                }
              },
              // Combined score = voteScore + preferenceBonus
              combinedScore: {
                $add: [
                  '$voteScore',
                  {
                    $cond: {
                      if: {
                        $and: [
                          { $gt: [{ $size: '$petData' }, 0] },
                          { $gt: [userPreferredSpeciesIds.length, 0] },
                          {
                            $in: [
                              { $toString: { $arrayElemAt: ['$petData.species', 0] } },
                              userPreferredSpeciesIds
                            ]
                          }
                        ]
                      },
                      then: 5,
                      else: 0
                    }
                  }
                ]
              }
            }
          },
          // Sort by combined score (popularity + preference bonus), then by date
          { $sort: { combinedScore: -1, createdAt: -1 } },
          // Handle offset-based pagination for popular sorting (cursor = offset number)
          // Skip posts already fetched
          ...(after ? [{ $skip: parseInt(after, 10) || 0 }] : []),
          // Limit results
          { $limit: first + 1 },
          // Remove temp fields before returning
          { $project: { votes: 0, petData: 0, preferenceBonus: 0, combinedScore: 0, voteScore: 0 } }
        ];

        let posts = await Post.aggregate(pipeline);

        // Populate the results
        posts = await Post.populate(posts, [
          { path: 'author' },
          {
            path: 'pet',
            populate: [
              { path: 'species' },
              { path: 'breed' }
            ]
          }
        ]);

        // Add id field from _id for GraphQL compatibility (aggregation returns plain objects)
        // Must be done after populate to ensure id is preserved
        posts = posts.map((post: any) => ({
          ...post,
          id: post._id.toString()
        }));

        // Get total count
        const countQuery: any = { isActive: true };
        if (postType) countQuery.postType = postType;
        if (petIds) countQuery.pet = { $in: petIds };
        const totalCount = await Post.countDocuments(countQuery);

        const hasNextPage = posts.length > first;
        // For popular sorting, use offset-based pagination
        // Calculate current offset: previous offset + number of items being returned
        const currentOffset = after ? parseInt(after, 10) || 0 : 0;
        const edges = posts.slice(0, first).map((post: any, index: number) => ({
          cursor: String(currentOffset + index + 1), // Offset for next fetch
          node: post
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage,
            // End cursor is the total offset after this batch
            endCursor: edges.length > 0 ? String(currentOffset + edges.length) : null
          },
          totalCount
        };
      }

      // Default: sort by recent (original behavior)
      // If cursor provided, fetch posts created before this cursor
      if (after) {
        try {
          const cursorPost = await Post.findById(after);
          if (cursorPost) {
            query.createdAt = { $lt: cursorPost.createdAt };
          }
        } catch (error) {
          console.error('Invalid cursor:', error);
        }
      }

      const posts = await Post.find(query)
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(first + 1);

      const countQuery: any = { isActive: true };
      if (postType) countQuery.postType = postType;
      if (petIds) countQuery.pet = { $in: petIds };
      const totalCount = await Post.countDocuments(countQuery);

      const hasNextPage = posts.length > first;
      const edges = posts.slice(0, first).map((post) => ({
        cursor: post._id.toString(),
        node: post
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        },
        totalCount
      };
    },
    me: async (_: unknown, __: unknown, context: Context) => {
      return context.user;
    },
    species: async () => {
      return await Species.find({});
    },
    getBreeds: async () => {
      return await Breed.find({}).populate('species');
    },
    breedsBySpeciesId: async (_: unknown, { speciesId }: { speciesId: string }) => {
      return await Breed.find({ species: speciesId }).populate('species').sort({ name: 1 });
    },
    commentsByPost: async (_: unknown, { postId, limit = 50, offset = 0 }: CommentsByPostArgs) => {
      // Fetch top-level comments (no parent)
      return await Comment.find({ post: postId, parent: null, isActive: true })
        .populate('author')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);
    }
  },
  Mutation: {
    login: async (_: unknown, { email, password }: LoginArgs) => {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new GraphQLError('Invalid email format');
      }

      const user = await User.findOne({ email });
      if (!user) throw new GraphQLError('Invalid credentials');

      const isValid = await user.comparePassword(password);
      if (!isValid) throw new GraphQLError('Invalid credentials');

      const token = signToken(user._id.toString());
      return { token, user };
    },
    addPet: async (_: unknown, args: AddPetArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Validate inputs
      if (!args.name || args.name.trim().length === 0) {
        throw new GraphQLError('Pet name is required');
      }

      // Must provide either speciesId or customSpecies
      if ((!args.speciesId || args.speciesId.trim().length === 0) && (!args.customSpecies || args.customSpecies.trim().length === 0)) {
        throw new GraphQLError('Pet species is required (either select one or type custom)');
      }

      const newPet = new Pet({
        ...args,
        species: args.speciesId,
        customSpecies: args.customSpecies,
        breed: args.breedId,
        customBreed: args.customBreed,
        coverImage: args.coverImage,
        images: args.images || [],
        owner: context.user._id
      });
      return await newPet.save();
    },
    createUser: async (_: unknown, args: CreateUserArgs) => {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        throw new GraphQLError('Invalid email format');
      }

      // Validate password strength
      if (args.password.length < 8) {
        throw new GraphQLError('Password must be at least 8 characters long');
      }

      // Validate name
      if (!args.name || args.name.trim().length === 0) {
        throw new GraphQLError('Name is required');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: args.email });
      if (existingUser) {
        throw new GraphQLError('User with this email already exists');
      }

      const newUser = new User({
        email: args.email,
        name: args.name,
        passwordHash: args.password, // Will be hashed in pre-save hook
        ...(args.address ? { address: { ...args.address, country: args.address.country || 'USA' } } : {}),
        timezone: args.timezone || 'UTC',
        profilePicture: args.profilePicture,
        preferredSpecies: args.preferredSpecies || []
      });
      return await newUser.save();
    },
    updateUser: async (_: unknown, args: UpdateUserArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const updates: any = {};
      if (args.name) updates.name = args.name;
      if (args.timezone) updates.timezone = args.timezone;
      if (args.profilePicture !== undefined) updates.profilePicture = args.profilePicture;
      if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
      if (args.address) {
        updates.address = { ...args.address, country: args.address.country || 'USA' };
      }
      if (args.preferredSpecies !== undefined) {
        updates.preferredSpecies = args.preferredSpecies;
      }

      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { $set: updates },
        { new: true }
      );

      if (!updatedUser) throw new GraphQLError('User not found');
      return updatedUser;
    },
    createPost: async (_: unknown, args: CreatePostArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Validate inputs
      if (!args.title || args.title.trim().length === 0) {
        throw new GraphQLError('Post title is required');
      }
      if (!args.description || args.description.trim().length === 0) {
        throw new GraphQLError('Post description is required');
      }

      // Location is only required for adopt and missing post types
      if ((args.postType === 'adopt' || args.postType === 'missing') &&
          (!args.location || args.location.trim().length === 0)) {
        throw new GraphQLError('Location is required for adoption and missing pet posts');
      }

      // Verify pet exists if provided
      if (args.petId) {
        const pet = await Pet.findById(args.petId);
        if (!pet) {
          throw new GraphQLError('Pet not found');
        }
      }

      // Validate media: max 4 images, and images/video are mutually exclusive
      const hasImages = args.images && args.images.length > 0;
      const hasVideo = args.video && args.video.trim().length > 0;

      if (hasImages && hasVideo) {
        throw new GraphQLError('A post can have either images or a video, not both');
      }

      if (hasImages && args.images!.length > 4) {
        throw new GraphQLError('Maximum 4 images allowed per post');
      }

      const newPost = new Post({
        title: args.title,
        description: args.description,
        postType: args.postType || 'post',
        tags: args.tags || [],
        images: args.images || [],
        video: args.video || null,
        author: context.user._id,
        ...(args.petId ? { pet: args.petId } : {}),
        location: args.location,
        ...(args.adoptionAddress ? { adoptionAddress: { ...args.adoptionAddress, country: args.adoptionAddress.country || 'USA' } } : {})
      });
      const savedPost = await newPost.save();

      // Re-fetch with population to ensure proper ID serialization
      const populatedPost = await Post.findById(savedPost._id)
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        });

      return populatedPost;
    },
    initializeBreeds: async (_: unknown, __: unknown, context: Context) => {
      // Optional: restriction to admin only, for now open or check context
      // if (!context.user || context.user.role !== 'admin') throw new GraphQLError('Unauthorized');

      const results = [];
      for (const [key, value] of Object.entries(initialBreeds)) {
        const existing = await Breed.findOne({ species: key });
        if (!existing) {
          const newBreed = new Breed({
            species: key,
            label: value.label,
            breeds: value.breeds
          });
          results.push(await newBreed.save());
        } else {
          results.push(existing);
        }
      }
      return results;
    },
    addBreedToSpecies: async (_: unknown, { species, breedName }: { species: string, breedName: string }, context: Context) => {
      // if (!context.user) throw new GraphQLError('Unauthorized');

      const breedDoc = await Breed.findOne({ species });
      if (!breedDoc) throw new GraphQLError('Species not found');

      if (!breedDoc.breeds.includes(breedName)) {
        breedDoc.breeds.push(breedName);
        await breedDoc.save();
      }
      return breedDoc;
    },
    removeBreedFromSpecies: async (_: unknown, { species, breedName }: { species: string, breedName: string }, context: Context) => {
      // if (!context.user) throw new GraphQLError('Unauthorized');

      const breedDoc = await Breed.findOne({ species });
      if (!breedDoc) throw new GraphQLError('Species not found');

      breedDoc.breeds = breedDoc.breeds.filter((b: string) => b !== breedName);
      await breedDoc.save();
      return breedDoc;
    },
    createSpecies: async (_: unknown, { species, label, breeds }: { species: string, label: string, breeds: string[] }, context: Context) => {
      // if (!context.user) throw new GraphQLError('Unauthorized');

      const existing = await Breed.findOne({ species });
      if (existing) throw new GraphQLError('Species already exists');

      const newBreed = new Breed({
        species,
        label,
        breeds
      });
      return await newBreed.save();
    },

    // Vote mutations
    votePost: async (_: unknown, { postId, value }: VotePostArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Validate vote value
      if (value !== 1 && value !== -1) {
        throw new GraphQLError('Vote value must be 1 (upvote) or -1 (downvote)');
      }

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) throw new GraphQLError('Post not found');

      // Upsert vote (create or update)
      await PostVote.findOneAndUpdate(
        { user: context.user._id, post: postId },
        { user: context.user._id, post: postId, value },
        { upsert: true, new: true }
      );

      return post;
    },

    removeVote: async (_: unknown, { postId }: { postId: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const post = await Post.findById(postId);
      if (!post) throw new GraphQLError('Post not found');

      await PostVote.findOneAndDelete({ user: context.user._id, post: postId });

      return post;
    },

    // Comment mutations
    createComment: async (_: unknown, { postId, content, parentId }: CreateCommentArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new GraphQLError('Comment content is required');
      }
      if (content.length > 2000) {
        throw new GraphQLError('Comment must be less than 2000 characters');
      }

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) throw new GraphQLError('Post not found');

      // If parentId provided, validate it exists and belongs to the same post
      if (parentId) {
        const parentComment = await Comment.findById(parentId);
        if (!parentComment) throw new GraphQLError('Parent comment not found');
        if (parentComment.post.toString() !== postId) {
          throw new GraphQLError('Parent comment does not belong to this post');
        }
      }

      const newComment = new Comment({
        content: content.trim(),
        author: context.user._id,
        post: postId,
        ...(parentId ? { parent: parentId } : {})
      });

      const savedComment = await newComment.save();
      return await Comment.findById(savedComment._id).populate('author');
    },

    deleteComment: async (_: unknown, { commentId }: { commentId: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const comment = await Comment.findById(commentId);
      if (!comment) throw new GraphQLError('Comment not found');

      // Only author can delete their comment
      if (comment.author.toString() !== context.user._id.toString()) {
        throw new GraphQLError('You can only delete your own comments');
      }

      // Soft delete by setting isActive to false
      await Comment.findByIdAndUpdate(commentId, { isActive: false });

      // Also soft delete all replies
      await Comment.updateMany({ parent: commentId }, { isActive: false });

      return true;
    }
  },
  Post: {
    // Only resolve if not already populated
    author: async (parent: IPost) => {
      if (parent.author && typeof parent.author === 'object' && '_id' in parent.author) {
        return parent.author;
      }
      return await User.findById(parent.author);
    },
    pet: async (parent: IPost) => {
      if (!parent.pet) return null;
      if (parent.pet && typeof parent.pet === 'object' && '_id' in parent.pet) {
        return parent.pet;
      }
      return await Pet.findById(parent.pet);
    },
    // Ensure new fields have default values for existing posts
    postType: (parent: any) => parent.postType || 'post',
    tags: (parent: any) => parent.tags || [],
    images: (parent: any) => parent.images || [],
    // Vote counts
    upvotes: async (parent: any) => {
      return await PostVote.countDocuments({ post: parent._id, value: 1 });
    },
    downvotes: async (parent: any) => {
      return await PostVote.countDocuments({ post: parent._id, value: -1 });
    },
    voteScore: async (parent: any) => {
      const upvotes = await PostVote.countDocuments({ post: parent._id, value: 1 });
      const downvotes = await PostVote.countDocuments({ post: parent._id, value: -1 });
      return upvotes - downvotes;
    },
    userVote: async (parent: any, _: unknown, context: Context) => {
      if (!context.user) return null;
      const vote = await PostVote.findOne({ post: parent._id, user: context.user._id });
      return vote ? vote.value : null;
    },
    commentCount: async (parent: any) => {
      return await Comment.countDocuments({ post: parent._id, isActive: true });
    }
  },
  Pet: {
    // Only resolve if not already populated
    owner: async (parent: IPet) => {
      if (!parent.owner) return null;
      if (typeof parent.owner === 'object' && '_id' in parent.owner) {
        return parent.owner;
      }
      return await User.findById(parent.owner);
    },
    species: async (parent: any) => {
      if (!parent.species) return null;
      if (typeof parent.species === 'object' && '_id' in parent.species) {
        return parent.species;
      }
      return await Species.findById(parent.species);
    },
    breed: async (parent: any) => {
      if (!parent.breed) return null;
      if (typeof parent.breed === 'object' && '_id' in parent.breed) {
        return parent.breed;
      }
      return await Breed.findById(parent.breed);
    }
  },
  User: {
    posts: async (parent: IUser) => {
      return await Post.find({ author: parent._id });
    },
    preferredSpecies: async (parent: any) => {
      if (!parent.preferredSpecies || parent.preferredSpecies.length === 0) {
        return [];
      }
      // If already populated, return as-is
      if (parent.preferredSpecies[0] && typeof parent.preferredSpecies[0] === 'object' && '_id' in parent.preferredSpecies[0]) {
        return parent.preferredSpecies;
      }
      // Otherwise populate
      return await Species.find({ _id: { $in: parent.preferredSpecies } });
    }
  },
  Breed: {
    species: async (parent: any) => {
      if (!parent.species) return null;
      if (typeof parent.species === 'object' && '_id' in parent.species) {
        return parent.species;
      }
      return await Species.findById(parent.species);
    }
  },
  Comment: {
    author: async (parent: any) => {
      if (parent.author && typeof parent.author === 'object' && '_id' in parent.author) {
        return parent.author;
      }
      return await User.findById(parent.author);
    },
    post: async (parent: any) => {
      if (parent.post && typeof parent.post === 'object' && '_id' in parent.post) {
        return parent.post;
      }
      return await Post.findById(parent.post);
    },
    parent: async (parent: any) => {
      if (!parent.parent) return null;
      if (typeof parent.parent === 'object' && '_id' in parent.parent) {
        return parent.parent;
      }
      return await Comment.findById(parent.parent);
    },
    replies: async (parent: any) => {
      return await Comment.find({ parent: parent._id, isActive: true })
        .populate('author')
        .sort({ createdAt: 1 });
    }
  }
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});

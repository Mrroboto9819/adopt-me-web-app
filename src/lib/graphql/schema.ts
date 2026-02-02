import { createSchema } from 'graphql-yoga';
import { Pet } from '$lib/models/Pet';
import { User } from '$lib/models/User';
import { Post } from '$lib/models/Post';
import { Breed } from '$lib/models/Breed';
import { Species } from '$lib/models/Species';
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
    species: String!
    label: String!
    breeds: [String!]!
    isActive: Boolean!
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

  type Post {
    id: ID!
    title: String!
    description: String!
    location: String!
    adoptionAddress: Address
    createdAt: String!
    updatedAt: String!
    author: User!
    pet: Pet!
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
    users(limit: Int = 50, offset: Int = 0): [User!]!
    posts(limit: Int = 50, offset: Int = 0): [Post!]!
    postsFeed(first: Int = 10, after: String): PostConnection!
    me: User
    species: [Species!]!
    getBreeds: [Breed!]!
    getBreedBySpecies(species: String!): Breed
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    addPet(name: String!, speciesId: ID, customSpecies: String, breedId: ID, customBreed: String, age: Int, coverImage: String, images: [String!]): Pet!
    createUser(email: String!, name: String!, password: String!, address: AddressInput, timezone: String, profilePicture: String): User!
    createPost(title: String!, description: String!, petId: ID!, location: String!, adoptionAddress: AddressInput): Post!

    updateUser(name: String, address: AddressInput, timezone: String, profilePicture: String, coverImage: String): User!
    
    
    # Breed Mutations
    initializeBreeds: [Breed!]!
    addBreedToSpecies(species: String!, breedName: String!): Breed!
    removeBreedFromSpecies(species: String!, breedName: String!): Breed!
    createSpecies(species: String!, label: String!, breeds: [String!]!): Breed!
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
}

interface UpdateUserArgs {
  name?: string;
  address?: AddressArgs;
  timezone?: string;
  profilePicture?: string;
  coverImage?: string;
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
  petId: string;
  location: string;
  adoptionAddress?: AddressArgs;
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
    postsFeed: async (_: unknown, { first = 10, after }: PostsFeedArgs) => {
      // Build query
      const query: any = { isActive: true };

      // If cursor provided, fetch posts created before this cursor
      if (after) {
        try {
          const cursorPost = await Post.findById(after);
          if (cursorPost) {
            query.createdAt = { $lt: cursorPost.createdAt };
          }
        } catch (error) {
          // Invalid cursor, ignore and fetch from start
          console.error('Invalid cursor:', error);
        }
      }

      // Fetch one extra to determine if there's a next page
      const posts = await Post.find(query)
        .populate('author')
        .populate('pet')
        .sort({ createdAt: -1 })
        .limit(first + 1);

      // Get total count for metadata
      const totalCount = await Post.countDocuments({ isActive: true });

      // Check if there are more posts
      const hasNextPage = posts.length > first;

      // Remove the extra post if it exists
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
      return await Breed.find({ isActive: true });
    },
    getBreedBySpecies: async (_: unknown, { species }: { species: string }) => {
      return await Breed.findOne({ species, isActive: true });
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
        profilePicture: args.profilePicture
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
      if (!args.location || args.location.trim().length === 0) {
        throw new GraphQLError('Location is required');
      }

      // Verify pet exists
      const pet = await Pet.findById(args.petId);
      if (!pet) {
        throw new GraphQLError('Pet not found');
      }

      const newPost = new Post({
        title: args.title,
        description: args.description,
        author: context.user._id,
        pet: args.petId,
        location: args.location,
        ...(args.adoptionAddress ? { adoptionAddress: { ...args.adoptionAddress, country: args.adoptionAddress.country || 'USA' } } : {})
      });
      return await newPost.save();
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
      if (parent.pet && typeof parent.pet === 'object' && '_id' in parent.pet) {
        return parent.pet;
      }
      return await Pet.findById(parent.pet);
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
    }
  }
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});

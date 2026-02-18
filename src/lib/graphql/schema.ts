import { createSchema } from 'graphql-yoga';
import { Pet } from '$lib/models/Pet';
import { User } from '$lib/models/User';
import { Post } from '$lib/models/Post';
import { Breed } from '$lib/models/Breed';
import { Species } from '$lib/models/Species';
import { Country } from '$lib/models/Country';
import { PostVote } from '$lib/models/PostVote';
import { Comment } from '$lib/models/Comment';
import { Report } from '$lib/models/Report';
import { BugReport } from '$lib/models/BugReport';
import { LoginImage } from '$lib/models/LoginImage';
import { signToken } from '$lib/auth';
import type { IPet } from '$lib/models/Pet';
import type { IUser } from '$lib/models/User';
import type { IPost } from '$lib/models/Post';
import { GraphQLError } from 'graphql';
import {
  sanitizeText,
  sanitizeDescription,
  sanitizeUrl,
  sanitizeArray,
  sanitizeUrlArray,
  sanitizeLocation,
  sanitizeAddress
} from '$lib/utils/sanitize';
import { getCountryFlag } from '$lib/utils/countryFlag';
import fs from 'fs';
import path from 'path';
import { getUploadsBaseDir } from '$lib/upload-utils';

// Returns true only if the uploaded file physically exists on disk
const fileExistsForUrl = (url: string): boolean => {
  if (!url || !url.startsWith('/uploads/')) return false;
  const relativePath = url.slice('/uploads/'.length);
  const filePath = path.join(getUploadsBaseDir(), relativePath);
  return fs.existsSync(filePath);
};
import { generateVerificationCode, sendEmailVerificationCode, sendWelcomeEmail, sendPasswordResetEmail } from '$lib/services/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendPhoneVerificationCode, verifyPhoneCode, formatPhoneNumber } from '$lib/services/sms';

// Admin email for admin-only operations (same as auth store)
import { ADMIN_EMAIL } from '$env/static/private';

// Helper function to check if user is admin
const isAdmin = (user: { email?: string } | null | undefined): boolean => {
  return user?.email === ADMIN_EMAIL;
};

const typeDefs = `
  type CoverImageOffset {
    x: Float!
    y: Float!
  }

  input CoverImageOffsetInput {
    x: Float!
    y: Float!
  }

  type UserWarning {
    id: ID!
    reason: String!
    reportId: ID
    issuedBy: User
    issuedAt: String!
    acknowledged: Boolean!
    acknowledgedAt: String
  }

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    secondLastName: String
    fullName: String!
    role: String!
    isActive: Boolean!
    isBanned: Boolean!
    banReason: String
    createdAt: String!
    updatedAt: String!
    profilePicture: String
    coverImage: String
    coverImageOffset: CoverImageOffset
    address: Address
    timezone: String
    language: String
    preferredSpecies: [Species!]!
    posts: [Post!]!
    # Verification
    phone: String
    phoneCountryCode: String
    phoneVerified: Boolean
    emailVerified: Boolean
    # App Settings
    theme: String
    notifications: NotificationSettings
    # Warnings/Strikes
    warnings: [UserWarning!]!
    warningCount: Int!
    # Saved Posts
    savedPostsCount: Int!
    likedPostsCount: Int!
  }

  type NotificationSettings {
    email: Boolean
    push: Boolean
    sms: Boolean
    newMessages: Boolean
    adoptionUpdates: Boolean
    newsletter: Boolean
  }

  input NotificationSettingsInput {
    email: Boolean
    push: Boolean
    sms: Boolean
    newMessages: Boolean
    adoptionUpdates: Boolean
    newsletter: Boolean
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
    weight: Float
    weightUnit: String
    images: [String!]!
    coverImage: String
    description: String
    status: String
    # Personality & Compatibility
    energyLevel: String
    temperament: [String!]
    goodWithKids: Boolean
    goodWithDogs: Boolean
    goodWithCats: Boolean
    houseTrained: Boolean
    trainingLevel: String
    # Health
    health: Health
    specialNeeds: String
    # Adoption
    adoptionFee: Float
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

  type Country {
    id: ID!
    name: String!
    alpha2: String!
    alpha3: String!
    numeric: String!
    phoneCode: String
    continent: String
    capital: String
    timezone: String
    currency: String
    tld: String
    flag: String
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
    microchipped: Boolean
  }

  input HealthInput {
    vaccinated: Boolean
    neutered: Boolean
    microchipped: Boolean
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

  enum ReportType {
    lost
    found
  }

  enum PreferredContactMethod {
    phone
    email
  }

  type Post {
    id: ID!
    title: String!
    description: String!
    postType: PostType!
    reportType: ReportType
    preferredContact: PreferredContactMethod
    tags: [String!]!
    images: [String!]!
    video: String
    location: String
    adoptionAddress: Address
    createdAt: String!
    updatedAt: String!
    author: User!
    pet: Pet
    pets: [Pet!]!
    upvotes: Int!
    downvotes: Int!
    voteScore: Int!
    userVote: Int
    commentCount: Int!
    reportCount: Int!
    isSaved: Boolean!
    # Contact info resolved from author for adopt/missing posts
    contactEmail: String
    contactPhone: String
    contactPhoneCountryCode: String
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

  enum ReportReason {
    spam
    inappropriate
    harassment
    scam
    animal_abuse
    fake_listing
    other
  }

  enum ReportStatus {
    pending
    reviewed
    resolved
    dismissed
  }

  type Report {
    id: ID!
    reasons: [ReportReason!]!
    description: String
    reporter: User!
    post: Post!
    postOwner: User!
    status: ReportStatus!
    adminNotes: String
    reviewedBy: User
    reviewedAt: String
    createdAt: String!
    updatedAt: String!
  }

  enum BugReportCategory {
    bug
    feature
    improvement
    other
  }

  enum BugReportSeverity {
    low
    medium
    high
    critical
  }

  enum BugReportStatus {
    open
    in_progress
    resolved
    closed
    wont_fix
  }

  type BugReport {
    id: ID!
    title: String!
    description: String!
    category: BugReportCategory!
    severity: BugReportSeverity!
    page: String
    browser: String
    device: String
    screenshot: String
    reporter: User
    reporterEmail: String
    status: BugReportStatus!
    adminNotes: String
    createdAt: String!
    updatedAt: String!
  }

  type AdminReportCounts {
    pendingBugReports: Int!
    totalBugReports: Int!
    pendingPostReports: Int!
    totalPostReports: Int!
  }

  type DiskStats {
    uploadsSize: Float!
    uploadsSizeFormatted: String!
    uploadsFileCount: Int!
    diskTotal: Float!
    diskFree: Float!
    diskUsed: Float!
    diskUsedPercent: Float!
    diskTotalFormatted: String!
    diskFreeFormatted: String!
    diskUsedFormatted: String!
  }

  type LoginImage {
    id: ID!
    url: String!
    alt: String
    order: Int!
    isActive: Boolean!
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
    postsFeed(first: Int = 10, after: String, speciesId: ID, postType: PostType, sortBy: String, search: String): PostConnection!
    me: User
    species: [Species!]!
    getBreeds: [Breed!]!
    breedsBySpeciesId(speciesId: ID!): [Breed!]!
    countries: [Country!]!
    commentsByPost(postId: ID!, limit: Int = 50, offset: Int = 0): [Comment!]!
    mySavedPosts(limit: Int = 50, offset: Int = 0): [Post!]!
    myLikedPosts(limit: Int = 50, offset: Int = 0): [Post!]!
    # Login images for carousel (public)
    loginImages: [LoginImage!]!

    # Admin-only queries
    adminBugReports(status: BugReportStatus, category: BugReportCategory, severity: BugReportSeverity, limit: Int = 50, offset: Int = 0): [BugReport!]!
    adminBugReport(id: ID!): BugReport
    adminReports(status: ReportStatus, reason: ReportReason, limit: Int = 50, offset: Int = 0): [Report!]!
    adminReport(id: ID!): Report
    adminReportCounts: AdminReportCounts!
    adminDiskStats: DiskStats!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    addPet(name: String!, speciesId: ID, customSpecies: String, breedId: ID, customBreed: String, age: Int, gender: String, size: String, color: String, weight: Float, weightUnit: String, description: String, status: String, energyLevel: String, temperament: [String!], goodWithKids: Boolean, goodWithDogs: Boolean, goodWithCats: Boolean, houseTrained: Boolean, trainingLevel: String, specialNeeds: String, adoptionFee: Float, coverImage: String, images: [String!], health: HealthInput): Pet!
    updatePet(id: ID!, name: String, speciesId: ID, customSpecies: String, breedId: ID, customBreed: String, age: Int, gender: String, size: String, color: String, weight: Float, weightUnit: String, description: String, status: String, energyLevel: String, temperament: [String!], goodWithKids: Boolean, goodWithDogs: Boolean, goodWithCats: Boolean, houseTrained: Boolean, trainingLevel: String, specialNeeds: String, adoptionFee: Float, coverImage: String, images: [String!], health: HealthInput): Pet!
    deletePet(id: ID!): Boolean!
    createUser(email: String!, firstName: String!, lastName: String!, secondLastName: String, password: String!, address: AddressInput, timezone: String, profilePicture: String, preferredSpecies: [ID!], language: String): User!
    createPost(title: String!, description: String!, postType: PostType!, petId: ID, petIds: [ID!], location: String, tags: [String!], images: [String!], video: String, adoptionAddress: AddressInput, reportType: ReportType, preferredContact: PreferredContactMethod): Post!
    updatePost(id: ID!, title: String, description: String, petId: ID, petIds: [ID!], location: String, tags: [String!], images: [String!], video: String, preferredContact: PreferredContactMethod): Post!
    deletePost(id: ID!): Boolean!

    updateUser(firstName: String, lastName: String, secondLastName: String, address: AddressInput, timezone: String, profilePicture: String, coverImage: String, coverImageOffset: CoverImageOffsetInput, preferredSpecies: [ID!], language: String, phone: String, phoneCountryCode: String, theme: String, notifications: NotificationSettingsInput): User!
    
    
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

    # Account Mutations
    deleteAccount: Boolean!

    # Report Mutations
    reportPost(postId: ID!, reasons: [ReportReason!]!, description: String): Report!

    # Bug Report Mutations
    submitBugReport(title: String!, description: String!, category: BugReportCategory!, severity: BugReportSeverity!, page: String, browser: String, device: String, screenshot: String, reporterEmail: String): BugReport!

    # Saved Posts Mutations
    savePost(postId: ID!): Post!
    unsavePost(postId: ID!): Post!

    # Email Verification Mutations
    sendEmailVerification: Boolean!
    verifyEmail(code: String!): User!
    resendEmailVerification: Boolean!

    # Phone Verification Mutations
    sendPhoneVerification(phoneNumber: String!, countryCode: String!): Boolean!
    verifyPhone(code: String!): User!
    resendPhoneVerification: Boolean!

    # Password Reset Mutations
    # Returns reset URL in development mode (when email fails), null in production
    requestPasswordReset(email: String!): String
    resetPassword(token: String!, newPassword: String!): Boolean!

    # Login Image Mutations (Admin only)
    addLoginImage(url: String!, alt: String, order: Int): LoginImage!
    updateLoginImage(id: ID!, url: String, alt: String, order: Int, isActive: Boolean): LoginImage!
    deleteLoginImage(id: ID!): Boolean!

    # Admin Bug Report Mutations
    updateBugReport(id: ID!, status: BugReportStatus, adminNotes: String): BugReport!
    deleteBugReport(id: ID!): Boolean!

    # Admin Post Report Mutations
    updateReport(id: ID!, status: ReportStatus, adminNotes: String): Report!
    deleteReport(id: ID!): Boolean!
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
  search?: string;
}

interface LoginArgs {
  email: string;
  password: string;
}

interface CreateUserArgs {
  email: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  password: string;
  address?: AddressArgs;
  timezone?: string;
  profilePicture?: string;
  preferredSpecies?: string[];
  language?: string;
}

interface NotificationSettingsArgs {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  newMessages?: boolean;
  adoptionUpdates?: boolean;
  newsletter?: boolean;
}

interface CoverImageOffsetArgs {
  x: number;
  y: number;
}

interface UpdateUserArgs {
  firstName?: string;
  lastName?: string;
  secondLastName?: string;
  address?: AddressArgs;
  timezone?: string;
  profilePicture?: string;
  coverImage?: string;
  coverImageOffset?: CoverImageOffsetArgs;
  preferredSpecies?: string[];
  language?: string;
  phone?: string;
  phoneCountryCode?: string;
  theme?: string;
  notifications?: NotificationSettingsArgs;
}

interface AddPetArgs {
  name: string;
  speciesId?: string;
  customSpecies?: string;
  breedId?: string;
  customBreed?: string;
  age?: number;
  gender?: string;
  size?: string;
  color?: string;
  weight?: number;
  weightUnit?: string;
  description?: string;
  status?: string;
  // Personality & Compatibility
  energyLevel?: string;
  temperament?: string[];
  goodWithKids?: boolean;
  goodWithDogs?: boolean;
  goodWithCats?: boolean;
  houseTrained?: boolean;
  trainingLevel?: string;
  // Health & Adoption
  specialNeeds?: string;
  adoptionFee?: number;
  coverImage?: string;
  images?: string[];
  health?: {
    vaccinated?: boolean;
    neutered?: boolean;
    microchipped?: boolean;
  };
}

interface UpdatePetArgs {
  id: string;
  name?: string;
  speciesId?: string;
  customSpecies?: string;
  breedId?: string;
  customBreed?: string;
  age?: number;
  gender?: string;
  size?: string;
  color?: string;
  weight?: number;
  weightUnit?: string;
  description?: string;
  status?: string;
  // Personality & Compatibility
  energyLevel?: string;
  temperament?: string[];
  goodWithKids?: boolean;
  goodWithDogs?: boolean;
  goodWithCats?: boolean;
  houseTrained?: boolean;
  trainingLevel?: string;
  // Health & Adoption
  specialNeeds?: string;
  adoptionFee?: number;
  coverImage?: string;
  images?: string[];
  health?: {
    vaccinated?: boolean;
    neutered?: boolean;
    microchipped?: boolean;
  };
}

interface CreatePostArgs {
  title: string;
  description: string;
  postType: 'post' | 'adopt' | 'missing';
  petId?: string;
  petIds?: string[];
  location?: string;
  tags?: string[];
  images?: string[];
  video?: string;
  adoptionAddress?: AddressArgs;
  reportType?: 'lost' | 'found';
  preferredContact?: 'phone' | 'email';
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

interface ReportPostArgs {
  postId: string;
  reasons: ('spam' | 'inappropriate' | 'harassment' | 'scam' | 'animal_abuse' | 'fake_listing' | 'other')[];
  description?: string;
}

interface SubmitBugReportArgs {
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'improvement' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  page?: string;
  browser?: string;
  device?: string;
  screenshot?: string;
  reporterEmail?: string;
}

import { initialBreeds } from '$lib/data/initialBreeds';

// ... (resolvers)

const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    pets: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs) => {
      // Use populate to prevent N+1 queries
      return await Pet.find({ isActive: true })
        .populate('owner')
        .populate('species')
        .populate('breed')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    myPets: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Only return active pets owned by the current user
      return await Pet.find({ owner: context.user._id, isActive: true })
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
        .populate({
          path: 'pets',
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
      return await User.findOne({ _id: id, isActive: true });
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
        .populate({
          path: 'pets',
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
      // Public active pets by a specific user
      return await Pet.find({ owner: userId, isActive: true })
        .populate('owner')
        .populate('species')
        .populate('breed')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    users: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs) => {
      return await User.find({ isActive: true })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    posts: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs) => {
      // Use populate to prevent N+1 queries, only return active posts
      return await Post.find({ isActive: true })
        .populate('author')
        .populate('pet')
        .populate('pets')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    post: async (_: unknown, { id }: { id: string }) => {
      return await Post.findOne({ _id: id, isActive: true })
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        })
        .populate({
          path: 'pets',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        });
    },
    postsFeed: async (_: unknown, { first = 10, after, speciesId, postType, sortBy = 'popular', search }: PostsFeedArgs, context: Context) => {
      // Build query
      const query: any = { isActive: true };

      // Filter by postType if provided
      if (postType) {
        query.postType = postType;
      }

      // Search functionality - bilingual support (English & Spanish)
      let searchPetIds: any[] | null = null;
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        const searchRegex = new RegExp(searchTerm, 'i');

        // Map bilingual post type keywords to actual post types
        const postTypeKeywords: Record<string, 'adopt' | 'missing' | 'post'> = {
          // English
          'adopt': 'adopt',
          'adoption': 'adopt',
          'missing': 'missing',
          'lost': 'missing',
          'post': 'post',
          'general': 'post',
          // Spanish
          'adopcion': 'adopt',
          'adopción': 'adopt',
          'perdido': 'missing',
          'perdida': 'missing',
          'extraviado': 'missing',
          'extraviada': 'missing',
          'publicacion': 'post',
          'publicación': 'post',
        };

        // Check if search term matches a post type keyword
        const matchedPostType = postTypeKeywords[searchTerm];
        if (matchedPostType && !postType) {
          query.postType = matchedPostType;
        } else {
          // Search in pets by name
          const petsMatchingSearch = await Pet.find({
            $or: [
              { name: searchRegex },
              { customSpecies: searchRegex },
              { customBreed: searchRegex }
            ]
          }).select('_id');
          searchPetIds = petsMatchingSearch.map(p => p._id);

          // Build search conditions for posts
          const searchConditions: any[] = [
            { title: searchRegex },
            { description: searchRegex },
            { tags: { $elemMatch: { $regex: searchRegex } } }
          ];

          // Add pet name match condition if pets found
          if (searchPetIds.length > 0) {
            searchConditions.push({ pet: { $in: searchPetIds } });
          }

          query.$or = searchConditions;
        }
      }

      // Filter by species if provided - need to find pets with this species first
      let petIds: any[] | null = null;
      if (speciesId) {
        const petsWithSpecies = await Pet.find({ species: speciesId }).select('_id');
        petIds = petsWithSpecies.map(p => p._id);

        // If we also have search pet IDs, intersect them
        if (searchPetIds && searchPetIds.length > 0) {
          const speciesPetIdStrings = petIds.map(id => id.toString());
          const intersectedPetIds = searchPetIds.filter(id =>
            speciesPetIdStrings.includes(id.toString())
          );
          // Update the $or condition to only include intersected pet IDs
          if (query.$or) {
            query.$or = query.$or.map((cond: any) => {
              if (cond.pet) {
                return { pet: { $in: intersectedPetIds.length > 0 ? intersectedPetIds : [] } };
              }
              return cond;
            });
          }
          query.pet = { $in: petIds };
        } else {
          query.pet = { $in: petIds };
        }
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
          },
          {
            path: 'pets',
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
        // Use same query for accurate count (includes search conditions)
        const totalCount = await Post.countDocuments(query);

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
        .populate({
          path: 'pets',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(first + 1);

      // For total count, we need to exclude the cursor-based filter
      // Create a clean query without the createdAt constraint
      const countQueryBase: any = { isActive: true };
      if (query.postType) countQueryBase.postType = query.postType;
      if (query.pet) countQueryBase.pet = query.pet;
      if (query.$or) countQueryBase.$or = query.$or;
      const totalCount = await Post.countDocuments(countQueryBase);

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
    countries: async () => {
      const countries = await Country.find({}).sort({ name: 1 }).lean();
      return countries.map((country: any) => ({
        ...country,
        id: String(country._id),
        flag: getCountryFlag(country.flag, country.alpha2)
      }));
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
    },
    mySavedPosts: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Get user with saved posts
      const user = await User.findById(context.user._id).select('savedPosts');
      if (!user || !user.savedPosts || user.savedPosts.length === 0) {
        return [];
      }

      // Only return active posts that the user has saved
      return await Post.find({
        _id: { $in: user.savedPosts },
        isActive: true
      })
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        })
        .populate({
          path: 'pets',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        })
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },
    myLikedPosts: async (_: unknown, { limit = 50, offset = 0 }: PaginationArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Get all posts the user has upvoted (value = 1)
      const likedVotes = await PostVote.find({ user: context.user._id, value: 1 })
        .select('post')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      if (likedVotes.length === 0) {
        return [];
      }

      const postIds = likedVotes.map(v => v.post);

      // Return the posts in the order they were liked
      const posts = await Post.find({
        _id: { $in: postIds },
        isActive: true
      })
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        })
        .populate({
          path: 'pets',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        });

      // Sort by the order of likedVotes (most recently liked first)
      const postMap = new Map(posts.map(p => [p._id.toString(), p]));
      return postIds
        .map(id => postMap.get(id.toString()))
        .filter(Boolean);
    },
    loginImages: async () => {
      // Return all active login images sorted by order
      const images = await LoginImage.find({ isActive: true })
        .sort({ order: 1 })
        .lean();
      return images.map((img: any) => ({
        ...img,
        id: img._id.toString()
      }));
    },

    // Admin-only queries
    adminBugReports: async (
      _: unknown,
      { status, category, severity, limit = 50, offset = 0 }: {
        status?: string;
        category?: string;
        severity?: string;
        limit?: number;
        offset?: number;
      },
      context: Context
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const filter: any = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (severity) filter.severity = severity;

      return await BugReport.find(filter)
        .populate('reporter')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },

    adminBugReport: async (
      _: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const report = await BugReport.findById(id).populate('reporter');
      if (!report) throw new GraphQLError('Bug report not found');
      return report;
    },

    adminReports: async (
      _: unknown,
      { status, reason, limit = 50, offset = 0 }: {
        status?: string;
        reason?: string;
        limit?: number;
        offset?: number;
      },
      context: Context
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const filter: any = {};
      if (status) filter.status = status;
      if (reason) filter.reasons = reason;

      return await Report.find(filter)
        .populate('reporter')
        .populate({
          path: 'post',
          populate: [
            { path: 'author' },
            {
              path: 'pet',
              populate: [{ path: 'species' }, { path: 'breed' }]
            },
            {
              path: 'pets',
              populate: [{ path: 'species' }, { path: 'breed' }]
            }
          ]
        })
        .populate('postOwner')
        .populate('reviewedBy')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },

    adminReport: async (
      _: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const report = await Report.findById(id)
        .populate('reporter')
        .populate({
          path: 'post',
          populate: [
            { path: 'author' },
            {
              path: 'pet',
              populate: [{ path: 'species' }, { path: 'breed' }]
            },
            {
              path: 'pets',
              populate: [{ path: 'species' }, { path: 'breed' }]
            }
          ]
        })
        .populate('postOwner')
        .populate('reviewedBy');

      if (!report) throw new GraphQLError('Report not found');
      return report;
    },

    adminReportCounts: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const [pendingBugReports, totalBugReports, pendingPostReports, totalPostReports] = await Promise.all([
        BugReport.countDocuments({ status: 'open' }),
        BugReport.countDocuments({}),
        Report.countDocuments({ status: 'pending' }),
        Report.countDocuments({})
      ]);

      return {
        pendingBugReports,
        totalBugReports,
        pendingPostReports,
        totalPostReports
      };
    },

    adminDiskStats: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const fs = await import('fs');
      const path = await import('path');
      const { execSync } = await import('child_process');

      // Helper to format bytes
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      // Get uploads directory size
      // Support UPLOADS_DIR env var for Docker/custom deployments
      const isProduction = process.env.NODE_ENV === 'production';
      const uploadsDir = process.env.UPLOADS_DIR
        ? process.env.UPLOADS_DIR
        : isProduction
          ? path.default.join(process.cwd(), 'build', 'client', 'uploads')
          : path.default.join(process.cwd(), 'static', 'uploads');

      let uploadsSize = 0;
      let uploadsFileCount = 0;

      const getDirectorySize = (dirPath: string): void => {
        try {
          const fsModule = fs.default || fs;
          if (!fsModule.existsSync(dirPath)) {
            console.log(`Uploads directory not found: ${dirPath}`);
            return;
          }
          const files = fsModule.readdirSync(dirPath);
          for (const file of files) {
            const filePath = path.default.join(dirPath, file);
            const stat = fsModule.statSync(filePath);
            if (stat.isDirectory()) {
              getDirectorySize(filePath);
            } else {
              uploadsSize += stat.size;
              uploadsFileCount++;
            }
          }
        } catch (e) {
          console.error('Error reading uploads directory:', e);
        }
      };

      getDirectorySize(uploadsDir);
      console.log(`Disk stats - Uploads dir: ${uploadsDir}, Size: ${uploadsSize}, Files: ${uploadsFileCount}`);

      // Get disk stats (platform-specific)
      let diskTotal = 0;
      let diskFree = 0;
      let diskUsed = 0;

      try {
        // Try using Node.js fs.statfs first (most reliable, works in Docker)
        const fsModule = fs.default || fs;
        const statfs = fsModule.statfsSync;
        if (typeof statfs === 'function') {
          const stats = statfs(process.cwd());
          // stats.bsize = block size, stats.blocks = total blocks, stats.bfree = free blocks
          diskTotal = stats.bsize * stats.blocks;
          diskFree = stats.bsize * stats.bfree;
          diskUsed = diskTotal - diskFree;
          console.log(`Disk stats via statfs - Total: ${diskTotal}, Free: ${diskFree}, Used: ${diskUsed}`);
        } else {
          throw new Error('statfsSync not available');
        }
      } catch (statfsError) {
        // Fallback to shell commands
        console.log('statfs not available, falling back to shell commands:', statfsError);
        try {
          if (process.platform === 'win32') {
            // Windows: use wmic
            const drive = process.cwd().split(':')[0] + ':';
            const output = execSync(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /format:csv`, { encoding: 'utf8' });
            const lines = output.trim().split('\n');
            if (lines.length >= 2) {
              const values = lines[1].split(',');
              if (values.length >= 3) {
                diskFree = parseInt(values[1]) || 0;
                diskTotal = parseInt(values[2]) || 0;
                diskUsed = diskTotal - diskFree;
              }
            }
          } else {
            // Unix/Linux/Mac: use df with POSIX format (-P) for consistent output
            let output = '';
            try {
              // Try df -P first (POSIX), then df -k, then plain df
              output = execSync(`df -P "${process.cwd()}"`, { encoding: 'utf8' });
            } catch {
              try {
                output = execSync(`df -k "${process.cwd()}"`, { encoding: 'utf8' });
              } catch {
                output = execSync(`df "${process.cwd()}"`, { encoding: 'utf8' });
              }
            }

            console.log('df output:', output);

            const lines = output.trim().split('\n');
            // Find the data line (skip header, handle wrapped lines)
            let dataLine = '';
            for (let i = 1; i < lines.length; i++) {
              dataLine += ' ' + lines[i];
            }

            const values = dataLine.trim().split(/\s+/);
            console.log('Parsed df values:', values);

            // Format: Filesystem 1K-blocks Used Available Use% Mounted
            // Values array indices: 0=filesystem, 1=total, 2=used, 3=available, 4=use%, 5=mount
            if (values.length >= 4) {
              // Values are in 1K blocks for -P and -k flags
              const multiplier = 1024;
              diskTotal = (parseInt(values[1]) || 0) * multiplier;
              diskUsed = (parseInt(values[2]) || 0) * multiplier;
              diskFree = (parseInt(values[3]) || 0) * multiplier;
              console.log(`Disk stats via df - Total: ${diskTotal}, Free: ${diskFree}, Used: ${diskUsed}`);
            }
          }
        } catch (e) {
          console.error('Error getting disk stats via shell:', e);
        }
      }

      const diskUsedPercent = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0;

      return {
        uploadsSize,
        uploadsSizeFormatted: formatBytes(uploadsSize),
        uploadsFileCount,
        diskTotal,
        diskFree,
        diskUsed,
        diskUsedPercent: Math.round(diskUsedPercent * 100) / 100,
        diskTotalFormatted: formatBytes(diskTotal),
        diskFreeFormatted: formatBytes(diskFree),
        diskUsedFormatted: formatBytes(diskUsed),
      };
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

      // Check if account is banned
      if (user.isBanned) {
        const reason = user.banReason ? `: ${user.banReason}` : '';
        throw new GraphQLError(`Your account has been suspended${reason}. Please contact support at pablo.cabrera.castrejon@gmail.com for assistance.`);
      }

      // Check if account was deleted (deactivated by user)
      if (!user.isActive) {
        throw new GraphQLError('This account has been deleted. If you believe this is an error, please contact support at pablo.cabrera.castrejon@gmail.com');
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) throw new GraphQLError('Invalid credentials');

      const token = signToken(user._id.toString());
      return { token, user };
    },
    addPet: async (_: unknown, args: AddPetArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Sanitize inputs
      const name = sanitizeText(args.name);
      const customSpecies = sanitizeText(args.customSpecies);
      const customBreed = sanitizeText(args.customBreed);
      const color = sanitizeText(args.color);
      const description = sanitizeDescription(args.description);
      const specialNeeds = sanitizeDescription(args.specialNeeds);
      const temperament = sanitizeArray(args.temperament);
      const coverImage = sanitizeUrl(args.coverImage);
      const images = sanitizeUrlArray(args.images);

      // Validate inputs
      if (!name || name.length === 0) {
        throw new GraphQLError('Pet name is required');
      }

      // Must provide either speciesId or customSpecies
      if ((!args.speciesId || args.speciesId.trim().length === 0) && (!customSpecies || customSpecies.length === 0)) {
        throw new GraphQLError('Pet species is required (either select one or type custom)');
      }

      const newPet = new Pet({
        name,
        age: args.age,
        gender: args.gender || undefined,
        size: args.size || undefined,
        color: color || undefined,
        weight: args.weight || undefined,
        weightUnit: args.weightUnit || 'kg',
        description: description || undefined,
        status: args.status || 'available',
        species: args.speciesId || undefined,
        customSpecies: customSpecies || undefined,
        breed: args.breedId || undefined,
        customBreed: customBreed || undefined,
        // Personality & Compatibility
        energyLevel: args.energyLevel || undefined,
        temperament: temperament.length > 0 ? temperament : undefined,
        goodWithKids: args.goodWithKids,
        goodWithDogs: args.goodWithDogs,
        goodWithCats: args.goodWithCats,
        houseTrained: args.houseTrained,
        trainingLevel: args.trainingLevel || undefined,
        // Health & Adoption
        specialNeeds: specialNeeds || undefined,
        adoptionFee: args.adoptionFee || undefined,
        coverImage: coverImage || undefined,
        images,
        owner: context.user._id,
        ...(args.health ? {
          health: {
            vaccinated: args.health.vaccinated ?? false,
            neutered: args.health.neutered ?? false,
            microchipped: args.health.microchipped ?? false
          }
        } : {})
      });
      return await newPet.save();
    },
    updatePet: async (_: unknown, args: UpdatePetArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Find the pet and verify ownership
      const pet = await Pet.findById(args.id);
      if (!pet) throw new GraphQLError('Pet not found');
      if (pet.owner?.toString() !== context.user._id.toString()) {
        throw new GraphQLError('You can only edit your own pets');
      }

      // Build updates object
      const updates: any = {};
      if (args.name !== undefined) updates.name = sanitizeText(args.name);
      if (args.speciesId !== undefined) updates.species = args.speciesId || undefined;
      if (args.customSpecies !== undefined) updates.customSpecies = sanitizeText(args.customSpecies) || undefined;
      if (args.breedId !== undefined) updates.breed = args.breedId || undefined;
      if (args.customBreed !== undefined) updates.customBreed = sanitizeText(args.customBreed) || undefined;
      if (args.age !== undefined) updates.age = args.age;
      if (args.gender !== undefined) updates.gender = args.gender;
      if (args.size !== undefined) updates.size = args.size;
      if (args.color !== undefined) updates.color = sanitizeText(args.color);
      if (args.weight !== undefined) updates.weight = args.weight;
      if (args.weightUnit !== undefined) updates.weightUnit = args.weightUnit;
      if (args.description !== undefined) updates.description = sanitizeDescription(args.description);
      if (args.status !== undefined) updates.status = args.status;
      // Personality & Compatibility
      if (args.energyLevel !== undefined) updates.energyLevel = args.energyLevel;
      if (args.temperament !== undefined) updates.temperament = sanitizeArray(args.temperament);
      if (args.goodWithKids !== undefined) updates.goodWithKids = args.goodWithKids;
      if (args.goodWithDogs !== undefined) updates.goodWithDogs = args.goodWithDogs;
      if (args.goodWithCats !== undefined) updates.goodWithCats = args.goodWithCats;
      if (args.houseTrained !== undefined) updates.houseTrained = args.houseTrained;
      if (args.trainingLevel !== undefined) updates.trainingLevel = args.trainingLevel;
      // Health & Adoption
      if (args.specialNeeds !== undefined) updates.specialNeeds = sanitizeDescription(args.specialNeeds);
      if (args.adoptionFee !== undefined) updates.adoptionFee = args.adoptionFee;
      if (args.coverImage !== undefined) {
        const sanitized = sanitizeUrl(args.coverImage);
        if (sanitized && fileExistsForUrl(sanitized)) {
          updates.coverImage = sanitized;
        }
        // If file doesn't exist, skip updating coverImage (keep existing DB value)
      }
      if (args.images !== undefined) {
        updates.images = sanitizeUrlArray(args.images).filter(fileExistsForUrl);
      }
      if (args.health !== undefined) {
        updates.health = {
          vaccinated: args.health.vaccinated ?? false,
          neutered: args.health.neutered ?? false,
          microchipped: args.health.microchipped ?? false
        };
      }

      const updatedPet = await Pet.findByIdAndUpdate(
        args.id,
        { $set: updates },
        { new: true }
      ).populate('species').populate('breed').populate('owner');

      if (!updatedPet) throw new GraphQLError('Failed to update pet');
      return updatedPet;
    },
    deletePet: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Find the pet and verify ownership
      const pet = await Pet.findById(id);
      if (!pet) throw new GraphQLError('Pet not found');
      if (pet.owner?.toString() !== context.user._id.toString()) {
        throw new GraphQLError('You can only delete your own pets');
      }

      // Soft delete the pet
      await Pet.findByIdAndUpdate(id, { isActive: false });

      // Also soft delete any posts associated with this pet
      await Post.updateMany({ pet: id }, { isActive: false });

      return true;
    },
    createUser: async (_: unknown, args: CreateUserArgs) => {
      // Sanitize inputs
      const email = args.email?.trim().toLowerCase();
      const firstName = sanitizeText(args.firstName);
      const lastName = sanitizeText(args.lastName);
      const secondLastName = args.secondLastName ? sanitizeText(args.secondLastName) : undefined;
      const profilePicture = sanitizeUrl(args.profilePicture);
      const address = sanitizeAddress(args.address);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        throw new GraphQLError('Invalid email format');
      }

      // Validate password strength
      if (args.password.length < 8) {
        throw new GraphQLError('Password must be at least 8 characters long');
      }

      // Validate names
      if (!firstName || firstName.length === 0) {
        throw new GraphQLError('First name is required');
      }
      if (!lastName || lastName.length === 0) {
        throw new GraphQLError('Last name is required');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new GraphQLError('User with this email already exists');
      }

      const newUser = new User({
        email,
        firstName,
        lastName,
        secondLastName,
        passwordHash: args.password, // Will be hashed in pre-save hook
        ...(address ? { address: { ...address, country: address.country || 'USA' } } : {}),
        timezone: args.timezone || 'UTC',
        profilePicture: profilePicture || undefined,
        preferredSpecies: args.preferredSpecies || [],
        language: args.language || 'en'
      });
      return await newUser.save();
    },
    updateUser: async (_: unknown, args: UpdateUserArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const updates: any = {};
      if (args.firstName) updates.firstName = sanitizeText(args.firstName);
      if (args.lastName) updates.lastName = sanitizeText(args.lastName);
      if (args.secondLastName !== undefined) updates.secondLastName = args.secondLastName ? sanitizeText(args.secondLastName) : null;
      if (args.timezone) updates.timezone = args.timezone;
      if (args.profilePicture !== undefined) updates.profilePicture = sanitizeUrl(args.profilePicture) || null;
      if (args.coverImage !== undefined) updates.coverImage = sanitizeUrl(args.coverImage) || null;
      if (args.coverImageOffset !== undefined) {
        // Clamp values between 0-100
        updates.coverImageOffset = {
          x: Math.min(100, Math.max(0, args.coverImageOffset.x)),
          y: Math.min(100, Math.max(0, args.coverImageOffset.y)),
        };
      }
      if (args.address) {
        const sanitizedAddress = sanitizeAddress(args.address);
        if (sanitizedAddress) {
          updates.address = { ...sanitizedAddress, country: sanitizedAddress.country || 'USA' };
        }
      }
      if (args.preferredSpecies !== undefined) {
        updates.preferredSpecies = args.preferredSpecies;
      }
      if (args.language) updates.language = args.language;
      // New settings fields
      if (args.phone !== undefined) updates.phone = sanitizeText(args.phone) || null;
      if (args.phoneCountryCode !== undefined) updates.phoneCountryCode = args.phoneCountryCode || null;
      if (args.theme) updates.theme = args.theme;
      if (args.notifications) updates.notifications = args.notifications;

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

      // Sanitize inputs
      const title = sanitizeText(args.title);
      const description = sanitizeDescription(args.description);
      const location = sanitizeLocation(args.location);
      const tags = sanitizeArray(args.tags);
      const images = sanitizeUrlArray(args.images);
      const video = sanitizeUrl(args.video);
      const adoptionAddress = sanitizeAddress(args.adoptionAddress);

      // Validate inputs
      if (!title || title.length === 0) {
        throw new GraphQLError('Post title is required');
      }
      if (!description || description.length === 0) {
        throw new GraphQLError('Post description is required');
      }

      // Validate media: images and video are mutually exclusive
      const hasImages = images.length > 0;
      const hasVideo = video.length > 0;

      if (hasImages && hasVideo) {
        throw new GraphQLError('A post can have either images or a video, not both');
      }

      // === ADOPTION POST VALIDATION ===
      if (args.postType === 'adopt') {
        // Pet is required for adoption posts
        if (!args.petId && (!args.petIds || args.petIds.length === 0)) {
          throw new GraphQLError('Pet selection is required for adoption posts');
        }
        // Media is required (image or video)
        if (!hasImages && !hasVideo) {
          throw new GraphQLError('At least one image or video is required for adoption posts');
        }
        // Location is required
        if (!location) {
          throw new GraphQLError('Location is required for adoption posts');
        }
        // Preferred contact is required
        if (!args.preferredContact) {
          throw new GraphQLError('Preferred contact method is required for adoption posts');
        }
        // Validate user has the selected contact method
        if (args.preferredContact === 'phone' && !context.user.phone) {
          throw new GraphQLError('Please add a phone number to your profile first');
        }
        if (args.preferredContact === 'email' && !context.user.email) {
          throw new GraphQLError('Please verify your email address first');
        }
      }

      // === MISSING (LOST/FOUND) POST VALIDATION ===
      if (args.postType === 'missing') {
        // Report type is required
        if (!args.reportType) {
          throw new GraphQLError('Report type (lost/found) is required for missing pet posts');
        }
        // Image is required for missing posts
        if (!hasImages) {
          throw new GraphQLError('At least one image is required for missing pet posts');
        }
        // Location is required
        if (!location) {
          throw new GraphQLError('Location is required for missing pet posts');
        }
        // Preferred contact is required
        if (!args.preferredContact) {
          throw new GraphQLError('Preferred contact method is required for missing pet posts');
        }
        // Lost pets require pet selection
        if (args.reportType === 'lost' && !args.petId && (!args.petIds || args.petIds.length === 0)) {
          throw new GraphQLError('Pet selection is required when reporting a lost pet');
        }
        // Validate user has the selected contact method
        if (args.preferredContact === 'phone' && !context.user.phone) {
          throw new GraphQLError('Please add a phone number to your profile first');
        }
        if (args.preferredContact === 'email' && !context.user.email) {
          throw new GraphQLError('Please verify your email address first');
        }
      }

      // Verify pet exists if provided
      if (args.petId) {
        const pet = await Pet.findById(args.petId);
        if (!pet) {
          throw new GraphQLError('Pet not found');
        }
      }
      // Verify all petIds exist if provided
      if (args.petIds && args.petIds.length > 0) {
        for (const pid of args.petIds) {
          const pet = await Pet.findById(pid);
          if (!pet) throw new GraphQLError(`Pet not found: ${pid}`);
        }
      }

      // Resolve final pets array: prefer petIds, fall back to petId
      const resolvedPetIds = args.petIds && args.petIds.length > 0
        ? args.petIds
        : args.petId ? [args.petId] : [];

      const newPost = new Post({
        title,
        description,
        postType: args.postType || 'post',
        reportType: args.reportType || undefined,
        preferredContact: args.preferredContact || undefined,
        tags,
        images,
        video: video || null,
        author: context.user._id,
        ...(args.petId ? { pet: args.petId } : {}),
        ...(resolvedPetIds.length > 0 ? { pets: resolvedPetIds } : {}),
        location: location || undefined,
        ...(adoptionAddress ? { adoptionAddress: { ...adoptionAddress, country: adoptionAddress.country || 'USA' } } : {})
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
        })
        .populate({
          path: 'pets',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        });

      return populatedPost;
    },
    updatePost: async (_: unknown, args: { id: string; title?: string; description?: string; petId?: string; petIds?: string[]; location?: string; tags?: string[]; images?: string[]; video?: string; preferredContact?: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const post = await Post.findById(args.id);
      if (!post) throw new GraphQLError('Post not found');

      // Check ownership
      if (post.author.toString() !== context.user._id.toString()) {
        throw new GraphQLError('You can only edit your own posts');
      }

      // Update fields if provided
      if (args.title !== undefined) {
        const title = sanitizeText(args.title);
        if (!title || title.length === 0) {
          throw new GraphQLError('Post title is required');
        }
        post.title = title;
      }

      if (args.description !== undefined) {
        const description = sanitizeDescription(args.description);
        if (!description || description.length === 0) {
          throw new GraphQLError('Post description is required');
        }
        post.description = description;
      }

      if (args.petId !== undefined) {
        if (args.petId) {
          const pet = await Pet.findById(args.petId);
          if (!pet) throw new GraphQLError('Pet not found');
          post.pet = args.petId as any;
        } else {
          post.pet = undefined;
        }
      }

      if (args.petIds !== undefined) {
        if (args.petIds.length > 0) {
          for (const pid of args.petIds) {
            const pet = await Pet.findById(pid);
            if (!pet) throw new GraphQLError(`Pet not found: ${pid}`);
          }
          post.pets = args.petIds as any;
        } else {
          post.pets = [];
        }
      }

      if (args.location !== undefined) {
        post.location = sanitizeLocation(args.location);
      }

      if (args.tags !== undefined) {
        post.tags = sanitizeArray(args.tags);
      }

      if (args.images !== undefined) {
        const images = sanitizeUrlArray(args.images).filter(fileExistsForUrl);
        post.images = images;
      }

      if (args.video !== undefined) {
        post.video = sanitizeUrl(args.video) || undefined;
      }

      if (args.preferredContact !== undefined) {
        post.preferredContact = args.preferredContact as any;
      }

      await post.save();

      // Return populated post
      return await Post.findById(post._id)
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        })
        .populate({
          path: 'pets',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        });
    },
    deletePost: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const post = await Post.findById(id);
      if (!post) throw new GraphQLError('Post not found');

      // Check ownership
      if (post.author.toString() !== context.user._id.toString()) {
        throw new GraphQLError('You can only delete your own posts');
      }

      // Soft delete - set isActive to false
      post.isActive = false;
      await post.save();

      // Also delete related comments
      await Comment.updateMany({ post: id }, { isActive: false });

      // Remove from users' savedPosts
      await User.updateMany(
        { savedPosts: id },
        { $pull: { savedPosts: id } }
      );

      return true;
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

      // Sanitize content
      const sanitizedContent = sanitizeDescription(content);

      // Validate content
      if (!sanitizedContent || sanitizedContent.length === 0) {
        throw new GraphQLError('Comment content is required');
      }
      if (sanitizedContent.length > 2000) {
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
        content: sanitizedContent,
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
    },

    deleteAccount: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const userId = context.user._id;

      // Soft delete all user's posts
      await Post.updateMany({ author: userId }, { isActive: false });

      // Soft delete all user's pets
      await Pet.updateMany({ owner: userId }, { isActive: false });

      // Soft delete all user's comments
      await Comment.updateMany({ author: userId }, { isActive: false });

      // Soft delete the user account
      await User.findByIdAndUpdate(userId, { isActive: false });

      return true;
    },

    reportPost: async (_: unknown, { postId, reasons, description }: ReportPostArgs, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Validate at least one reason is provided
      if (!reasons || reasons.length === 0) {
        throw new GraphQLError('At least one reason must be selected');
      }

      // Check if post exists and is active
      const post = await Post.findOne({ _id: postId, isActive: true });
      if (!post) throw new GraphQLError('Post not found');

      // Cannot report your own post
      if (post.author.toString() === context.user._id.toString()) {
        throw new GraphQLError('You cannot report your own post');
      }

      // Check if user already reported this post
      const existingReport = await Report.findOne({
        post: postId,
        reporter: context.user._id
      });
      if (existingReport) {
        throw new GraphQLError('You have already reported this post');
      }

      // Create the report with sanitized description
      const newReport = new Report({
        reasons,
        description: sanitizeDescription(description),
        reporter: context.user._id,
        post: postId,
        postOwner: post.author,
        status: 'pending'
      });

      const savedReport = await newReport.save();

      // Return with populated fields
      return await Report.findById(savedReport._id)
        .populate('reporter')
        .populate('post')
        .populate('postOwner');
    },

    submitBugReport: async (_: unknown, args: SubmitBugReportArgs, context: Context) => {
      // Sanitize inputs
      const title = sanitizeText(args.title);
      const description = sanitizeDescription(args.description);
      const page = sanitizeText(args.page);
      const browser = sanitizeText(args.browser);
      const device = sanitizeText(args.device);
      const screenshot = sanitizeUrl(args.screenshot);
      const reporterEmail = args.reporterEmail?.trim().toLowerCase();

      // Validate inputs
      if (!title || title.length === 0) {
        throw new GraphQLError('Bug report title is required');
      }
      if (!description || description.length === 0) {
        throw new GraphQLError('Bug report description is required');
      }

      // If not logged in, email is required
      if (!context.user && !reporterEmail) {
        throw new GraphQLError('Email is required for anonymous bug reports');
      }

      // Validate email format if provided
      if (reporterEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(reporterEmail)) {
          throw new GraphQLError('Invalid email format');
        }
      }

      const newBugReport = new BugReport({
        title,
        description,
        category: args.category || 'bug',
        severity: args.severity || 'medium',
        page: page || undefined,
        browser: browser || undefined,
        device: device || undefined,
        screenshot: screenshot || undefined,
        reporter: context.user?._id || undefined,
        reporterEmail: reporterEmail || context.user?.email || undefined,
        status: 'open'
      });

      const savedReport = await newBugReport.save();

      // Return with populated reporter if logged in
      if (context.user) {
        return await BugReport.findById(savedReport._id).populate('reporter');
      }
      return savedReport;
    },

    savePost: async (_: unknown, { postId }: { postId: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Check if post exists and is active
      const post = await Post.findOne({ _id: postId, isActive: true });
      if (!post) throw new GraphQLError('Post not found');

      // Add to saved posts if not already saved (use $addToSet to prevent duplicates)
      await User.findByIdAndUpdate(
        context.user._id,
        { $addToSet: { savedPosts: postId } }
      );

      return await Post.findById(postId)
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        });
    },

    unsavePost: async (_: unknown, { postId }: { postId: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) throw new GraphQLError('Post not found');

      // Remove from saved posts
      await User.findByIdAndUpdate(
        context.user._id,
        { $pull: { savedPosts: postId } }
      );

      return await Post.findById(postId)
        .populate('author')
        .populate({
          path: 'pet',
          populate: [
            { path: 'species' },
            { path: 'breed' }
          ]
        });
    },

    // Email Verification
    sendEmailVerification: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const user = await User.findById(context.user._id);
      if (!user) throw new GraphQLError('User not found');

      if (user.emailVerified) {
        throw new GraphQLError('Email already verified');
      }

      // Generate verification code
      const code = generateVerificationCode();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save token to user
      user.emailVerificationToken = code;
      user.emailVerificationExpires = expires;
      await user.save();

      // Send email
      try {
        await sendEmailVerificationCode(
          user.email,
          code,
          user.firstName,
          (user.language as 'en' | 'es') || 'en'
        );
      } catch (error: any) {
        // Clear the token since email failed
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        throw new GraphQLError(error.message || 'Failed to send verification email');
      }

      return true;
    },

    verifyEmail: async (_: unknown, { code }: { code: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const user = await User.findById(context.user._id);
      if (!user) throw new GraphQLError('User not found');

      if (user.emailVerified) {
        throw new GraphQLError('Email already verified');
      }

      if (!user.emailVerificationToken || !user.emailVerificationExpires) {
        throw new GraphQLError('No verification code found. Please request a new one.');
      }

      if (new Date() > user.emailVerificationExpires) {
        throw new GraphQLError('Verification code has expired. Please request a new one.');
      }

      if (user.emailVerificationToken !== code) {
        throw new GraphQLError('Invalid verification code');
      }

      // Mark email as verified
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // Send welcome email
      await sendWelcomeEmail(
        user.email,
        user.firstName,
        (user.language as 'en' | 'es') || 'en'
      );

      return user;
    },

    resendEmailVerification: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const user = await User.findById(context.user._id);
      if (!user) throw new GraphQLError('User not found');

      if (user.emailVerified) {
        throw new GraphQLError('Email already verified');
      }

      // Check if last code was sent less than 1 minute ago
      if (user.emailVerificationExpires) {
        const timeSinceLastSend = Date.now() - (user.emailVerificationExpires.getTime() - 15 * 60 * 1000);
        if (timeSinceLastSend < 60 * 1000) {
          throw new GraphQLError('Please wait before requesting a new code');
        }
      }

      // Generate new code
      const code = generateVerificationCode();
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      user.emailVerificationToken = code;
      user.emailVerificationExpires = expires;
      await user.save();

      try {
        await sendEmailVerificationCode(
          user.email,
          code,
          user.firstName,
          (user.language as 'en' | 'es') || 'en'
        );
      } catch (error: any) {
        // Clear the token since email failed
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        throw new GraphQLError(error.message || 'Failed to send verification email');
      }

      return true;
    },

    // Phone Verification
    sendPhoneVerification: async (
      _: unknown,
      { phoneNumber, countryCode }: { phoneNumber: string; countryCode: string },
      context: Context
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const user = await User.findById(context.user._id);
      if (!user) throw new GraphQLError('User not found');

      // Format phone number to E.164
      const formattedPhone = formatPhoneNumber(phoneNumber, countryCode);

      // Validate phone number format
      if (!formattedPhone.match(/^\+[1-9]\d{6,14}$/)) {
        throw new GraphQLError('Invalid phone number format');
      }

      // Store the phone number and country code
      user.phone = formattedPhone;
      user.phoneCountryCode = countryCode.toUpperCase();
      user.phoneVerified = false;
      await user.save();

      // Send verification via Twilio Verify
      try {
        await sendPhoneVerificationCode(formattedPhone);
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Failed to send verification code');
      }

      return true;
    },

    verifyPhone: async (_: unknown, { code }: { code: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const user = await User.findById(context.user._id);
      if (!user) throw new GraphQLError('User not found');

      if (!user.phone) {
        throw new GraphQLError('No phone number to verify. Please add a phone number first.');
      }

      if (user.phoneVerified) {
        throw new GraphQLError('Phone number is already verified');
      }

      // Verify the code with Twilio
      try {
        const isValid = await verifyPhoneCode(user.phone, code);
        if (isValid) {
          user.phoneVerified = true;
          await user.save();
          return user;
        }
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Verification failed');
      }

      throw new GraphQLError('Invalid verification code');
    },

    resendPhoneVerification: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');

      const user = await User.findById(context.user._id);
      if (!user) throw new GraphQLError('User not found');

      if (!user.phone) {
        throw new GraphQLError('No phone number to verify. Please add a phone number first.');
      }

      if (user.phoneVerified) {
        throw new GraphQLError('Phone number is already verified');
      }

      // Send new verification via Twilio Verify
      try {
        await sendPhoneVerificationCode(user.phone);
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Failed to send verification code');
      }

      return true;
    },

    // Password Reset Mutations
    requestPasswordReset: async (_: unknown, { email }: { email: string }) => {
      const sanitizedEmail = email.toLowerCase().trim();
      const APP_URL = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
      const isDevelopment = process.env.NODE_ENV !== 'production';

      // Find user by email (exclude banned and deactivated users)
      const user = await User.findOne({ email: sanitizedEmail, isBanned: false, isActive: true });

      // Always return null to prevent email enumeration attacks (don't reveal if user exists)
      if (!user) {
        console.log(`[PasswordReset] No user found for email: ${sanitizedEmail}`);
        return null;
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

      // Set token and expiry (1 hour)
      user.passwordResetToken = resetTokenHash;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Try to send password reset email
      try {
        await sendPasswordResetEmail(
          user.email,
          resetToken, // Send unhashed token in email
          user.firstName,
          (user.language as 'en' | 'es') || 'en'
        );
        console.log(`[PasswordReset] Email sent to: ${sanitizedEmail}`);
        return null; // Success - don't expose the URL
      } catch (error: any) {
        console.error('[PasswordReset] Failed to send email:', error.message);

        // In development mode, return the reset URL directly so user can still reset password
        if (isDevelopment) {
          console.log(`[PasswordReset] DEV MODE - Reset URL: ${resetUrl}`);
          return resetUrl; // Return URL for development testing
        }

        // In production, clear token and throw error
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        throw new GraphQLError('Failed to send password reset email. Please try again.');
      }
    },

    resetPassword: async (_: unknown, { token, newPassword }: { token: string; newPassword: string }) => {
      // Hash the token from the URL to compare with stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid (non-expired) token
      const user = await User.findOne({
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
        isBanned: false,
      });

      if (!user) {
        throw new GraphQLError('Invalid or expired reset token. Please request a new password reset.');
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw new GraphQLError('Password must be at least 8 characters long');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      user.passwordHash = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      // Skip the pre-save hook that would double-hash (mark field as not modified)
      user.markModified('passwordResetToken');
      user.markModified('passwordResetExpires');

      await User.updateOne(
        { _id: user._id },
        {
          $set: { passwordHash: hashedPassword },
          $unset: { passwordResetToken: 1, passwordResetExpires: 1 }
        }
      );

      console.log(`[PasswordReset] Password reset successful for: ${user.email}`);
      return true;
    },

    // Login Image Mutations
    addLoginImage: async (
      _: unknown,
      { url, alt, order }: { url: string; alt?: string; order?: number },
      context: Context
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const sanitizedUrl = sanitizeUrl(url);
      if (!sanitizedUrl) {
        throw new GraphQLError('Valid image URL is required');
      }

      // If no order specified, add to the end
      let imageOrder = order;
      if (imageOrder === undefined) {
        const lastImage = await LoginImage.findOne({ isActive: true }).sort({ order: -1 });
        imageOrder = lastImage ? lastImage.order + 1 : 0;
      }

      const newImage = new LoginImage({
        url: sanitizedUrl,
        alt: sanitizeText(alt) || 'Login background image',
        order: imageOrder,
        isActive: true
      });

      const savedImage = await newImage.save();
      return {
        ...savedImage.toObject(),
        id: savedImage._id.toString()
      };
    },

    updateLoginImage: async (
      _: unknown,
      { id, url, alt, order, isActive }: { id: string; url?: string; alt?: string; order?: number; isActive?: boolean },
      context: Context
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const image = await LoginImage.findById(id);
      if (!image) throw new GraphQLError('Login image not found');

      if (url !== undefined) image.url = sanitizeUrl(url) || image.url;
      if (alt !== undefined) image.alt = sanitizeText(alt);
      if (order !== undefined) image.order = order;
      if (isActive !== undefined) image.isActive = isActive;

      const updatedImage = await image.save();
      return {
        ...updatedImage.toObject(),
        id: updatedImage._id.toString()
      };
    },

    deleteLoginImage: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const image = await LoginImage.findById(id);
      if (!image) throw new GraphQLError('Login image not found');

      await LoginImage.findByIdAndDelete(id);
      return true;
    },

    // Admin Bug Report Mutations
    updateBugReport: async (
      _: unknown,
      { id, status, adminNotes }: { id: string; status?: string; adminNotes?: string },
      context: Context
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const report = await BugReport.findById(id);
      if (!report) throw new GraphQLError('Bug report not found');

      if (status !== undefined) report.status = status as any;
      if (adminNotes !== undefined) report.adminNotes = sanitizeText(adminNotes);

      const updatedReport = await report.save();
      return await BugReport.findById(updatedReport._id).populate('reporter');
    },

    deleteBugReport: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const report = await BugReport.findById(id);
      if (!report) throw new GraphQLError('Bug report not found');

      await BugReport.findByIdAndDelete(id);
      return true;
    },

    // Admin Post Report Mutations
    updateReport: async (
      _: unknown,
      { id, status, adminNotes }: { id: string; status?: string; adminNotes?: string },
      context: Context
    ) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const report = await Report.findById(id);
      if (!report) throw new GraphQLError('Report not found');

      if (status !== undefined) {
        report.status = status as any;
        // Set reviewedBy and reviewedAt when status changes from pending
        if (status !== 'pending' && !report.reviewedBy) {
          report.reviewedBy = context.user._id as any;
          report.reviewedAt = new Date();
        }
      }
      if (adminNotes !== undefined) report.adminNotes = sanitizeText(adminNotes);

      const updatedReport = await report.save();
      return await Report.findById(updatedReport._id)
        .populate('reporter')
        .populate({
          path: 'post',
          populate: [
            { path: 'author' },
            {
              path: 'pet',
              populate: [{ path: 'species' }, { path: 'breed' }]
            }
          ]
        })
        .populate('postOwner')
        .populate('reviewedBy');
    },

    deleteReport: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) throw new GraphQLError('Unauthorized');
      if (!isAdmin(context.user)) throw new GraphQLError('Admin access required');

      const report = await Report.findById(id);
      if (!report) throw new GraphQLError('Report not found');

      await Report.findByIdAndDelete(id);
      return true;
    }
  },
  Post: {
    // Only resolve if not already populated
    author: async (parent: IPost) => {
      if (parent.author && typeof parent.author === 'object' && '_id' in parent.author) {
        return parent.author;
      }
      const user = await User.findById(parent.author);
      if (!user) {
        // Return a placeholder for deleted users
        const deletedUserId = parent.author?.toString() || 'deleted';
        return {
          _id: deletedUserId,
          id: deletedUserId,
          email: 'deleted@user.com',
          firstName: 'Deleted',
          lastName: 'User',
          secondLastName: null,
          fullName: 'Deleted User',
          role: 'user',
          isActive: false,
          isBanned: false,
          banReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profilePicture: null,
          coverImage: null,
          coverImageOffset: null,
          address: null,
          timezone: null,
          language: 'en',
          phone: null,
          phoneCountryCode: null,
          phoneVerified: false,
          emailVerified: false,
          theme: 'system',
          notifications: null,
          preferredSpecies: [],
          warnings: [],
          warningCount: 0,
          savedPosts: [],
          likedPosts: [],
        };
      }
      return user;
    },
    pet: async (parent: IPost) => {
      if (!parent.pet) return null;
      if (parent.pet && typeof parent.pet === 'object' && '_id' in parent.pet) {
        return parent.pet;
      }
      return await Pet.findById(parent.pet);
    },
    pets: async (parent: IPost) => {
      // If pets array is already populated, return it
      if (parent.pets && parent.pets.length > 0) {
        if (typeof (parent.pets[0] as any) === 'object' && '_id' in (parent.pets[0] as any)) {
          return parent.pets;
        }
        return await Pet.find({ _id: { $in: parent.pets } }).populate('species').populate('breed');
      }
      // Backward-compat: fall back to single pet field
      if (parent.pet) {
        const pet = typeof parent.pet === 'object' && '_id' in parent.pet
          ? parent.pet
          : await Pet.findById(parent.pet).populate('species').populate('breed');
        return pet ? [pet] : [];
      }
      return [];
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
    },
    reportCount: async (parent: any) => {
      return await Report.countDocuments({ post: parent._id });
    },
    isSaved: async (parent: any, _: unknown, context: Context) => {
      if (!context.user) return false;
      const user = await User.findById(context.user._id).select('savedPosts');
      if (!user || !user.savedPosts) return false;
      return user.savedPosts.some((savedId: any) => savedId.toString() === parent._id.toString());
    },
    // Contact info resolvers for adopt/missing posts
    contactEmail: async (parent: any) => {
      // Only return email for adopt/missing posts with email as preferred contact
      if (parent.postType === 'post') return null;
      if (parent.preferredContact !== 'email') return null;
      // Get author's email
      const authorId = parent.author?._id || parent.author;
      const author = await User.findById(authorId).select('email');
      return author?.email || null;
    },
    contactPhone: async (parent: any) => {
      // Only return phone for adopt/missing posts with phone as preferred contact
      if (parent.postType === 'post') return null;
      if (parent.preferredContact !== 'phone') return null;
      // Get author's phone
      const authorId = parent.author?._id || parent.author;
      const author = await User.findById(authorId).select('phone');
      return author?.phone || null;
    },
    contactPhoneCountryCode: async (parent: any) => {
      // Only return phone country code for adopt/missing posts with phone as preferred contact
      if (parent.postType === 'post') return null;
      if (parent.preferredContact !== 'phone') return null;
      // Get author's phone country code
      const authorId = parent.author?._id || parent.author;
      const author = await User.findById(authorId).select('phoneCountryCode');
      return author?.phoneCountryCode || null;
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
    // Ensure id is properly resolved for both MongoDB documents and plain objects
    id: (parent: any) => {
      if (parent.id) return parent.id;
      if (parent._id) return parent._id.toString ? parent._id.toString() : parent._id;
      return null;
    },
    fullName: (parent: IUser) => {
      const parts = [parent.firstName, parent.lastName];
      if (parent.secondLastName) parts.push(parent.secondLastName);
      return parts.join(' ');
    },
    posts: async (parent: IUser) => {
      return await Post.find({ author: parent._id, isActive: true });
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
    },
    warnings: (parent: any) => {
      // Return warnings array with id field mapped from _id
      if (!parent.warnings) return [];
      return parent.warnings.map((warning: any) => ({
        ...warning.toObject ? warning.toObject() : warning,
        id: warning._id?.toString() || warning.id
      }));
    },
    warningCount: (parent: any) => {
      return parent.warningCount || parent.warnings?.length || 0;
    },
    savedPostsCount: async (parent: any) => {
      if (!parent.savedPosts) return 0;
      // Count only active saved posts
      const count = await Post.countDocuments({
        _id: { $in: parent.savedPosts },
        isActive: true
      });
      return count;
    },
    likedPostsCount: async (parent: any) => {
      // Count posts the user has upvoted
      return await PostVote.countDocuments({ user: parent._id, value: 1 });
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
      const user = await User.findById(parent.author);
      if (!user) {
        // Return a placeholder for deleted users
        const deletedUserId = parent.author?.toString() || 'deleted';
        return {
          _id: deletedUserId,
          id: deletedUserId,
          email: 'deleted@user.com',
          firstName: 'Deleted',
          lastName: 'User',
          secondLastName: null,
          fullName: 'Deleted User',
          role: 'user',
          isActive: false,
          isBanned: false,
          banReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profilePicture: null,
          coverImage: null,
          coverImageOffset: null,
          address: null,
          timezone: null,
          language: 'en',
          phone: null,
          phoneCountryCode: null,
          phoneVerified: false,
          emailVerified: false,
          theme: 'system',
          notifications: null,
          preferredSpecies: [],
          warnings: [],
          warningCount: 0,
          savedPosts: [],
          likedPosts: [],
        };
      }
      return user;
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
  },
  Report: {
    reporter: async (parent: any) => {
      if (parent.reporter && typeof parent.reporter === 'object' && '_id' in parent.reporter) {
        return parent.reporter;
      }
      return await User.findById(parent.reporter);
    },
    post: async (parent: any) => {
      if (parent.post && typeof parent.post === 'object' && '_id' in parent.post) {
        return parent.post;
      }
      return await Post.findById(parent.post);
    },
    postOwner: async (parent: any) => {
      if (parent.postOwner && typeof parent.postOwner === 'object' && '_id' in parent.postOwner) {
        return parent.postOwner;
      }
      return await User.findById(parent.postOwner);
    },
    reviewedBy: async (parent: any) => {
      if (!parent.reviewedBy) return null;
      if (typeof parent.reviewedBy === 'object' && '_id' in parent.reviewedBy) {
        return parent.reviewedBy;
      }
      return await User.findById(parent.reviewedBy);
    }
  },
  BugReport: {
    id: (parent: any) => parent._id?.toString() || parent.id,
    reporter: async (parent: any) => {
      if (!parent.reporter) return null;
      if (parent.reporter && typeof parent.reporter === 'object' && '_id' in parent.reporter) {
        return parent.reporter;
      }
      return await User.findById(parent.reporter);
    }
  }
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});

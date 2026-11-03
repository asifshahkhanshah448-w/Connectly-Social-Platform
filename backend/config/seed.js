import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Follow from '../models/Follow.js';

export async function seedInitialData() {
  try {
    const passwordHash = await User.hashPassword('Password123!');

    // Helper to find or create user
    async function getOrCreateUser(userData) {
      let user = await User.findOne({ username: userData.username });
      if (!user) {
        user = await User.create({
          ...userData,
          passwordHash,
        });
      }
      return user;
    }

    const alex = await getOrCreateUser({
      name: 'Alex Rivera',
      username: 'alexrivera',
      email: 'alex@example.com',
      bio: 'Senior Full-Stack Engineer. Passionate about distributed systems, Node.js architecture, and clean design.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    });

    const elena = await getOrCreateUser({
      name: 'Elena Vance',
      username: 'elenavance',
      email: 'elena@example.com',
      bio: 'Product Designer & Frontend Lead. Focusing on accessibility, calm typography, and zero-clutter interfaces.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    });

    const marcus = await getOrCreateUser({
      name: 'Marcus Chen',
      username: 'marcuschen',
      email: 'marcus@example.com',
      bio: 'Open source contributor, backend enthusiast, and avid reader. Building scalable cloud tools.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    });

    const sophia = await getOrCreateUser({
      name: 'Sophia Patel',
      username: 'sophiapatel',
      email: 'sophia@example.com',
      bio: 'Software Architect & Tech Writer. Exploring modern reactive data pipelines and database optimization.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    });

    // Seed Follow relationships if none exist
    const followCount = await Follow.countDocuments();
    if (followCount === 0) {
      await Follow.create([
        { follower: alex._id, following: elena._id },
        { follower: alex._id, following: marcus._id },
        { follower: elena._id, following: alex._id },
        { follower: elena._id, following: sophia._id },
        { follower: marcus._id, following: alex._id },
        { follower: marcus._id, following: elena._id },
        { follower: sophia._id, following: alex._id },
      ]);
    }

    // Seed Posts if none exist
    const postCount = await Post.countDocuments();
    if (postCount === 0) {
      console.log('Seeding initial community posts into MongoDB...');

      const post1 = await Post.create({
        author: alex._id,
        content: 'Building resilient software starts with removing the non-essential. Just completed an architectural review of our service boundaries—clarity improved tenfold and latency dropped significantly.',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
        likes: [elena._id, marcus._id, sophia._id],
        createdAt: new Date(Date.now() - 3600000 * 4),
      });

      const post2 = await Post.create({
        author: elena._id,
        content: 'A reminder for web creators: clarity always beats complexity. If a user needs instructions to navigate a core flow, the interface needs refinement. Muted tones and strong typographic rhythm provide instant focus.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=900&q=80',
        likes: [alex._id, marcus._id],
        createdAt: new Date(Date.now() - 3600000 * 9),
      });

      const post3 = await Post.create({
        author: marcus._id,
        content: 'Exploring real-time indexing patterns with MongoDB and Mongoose today. What approaches do you rely on to keep compound indexes lean and fast at scale?',
        image: '',
        likes: [alex._id, sophia._id],
        createdAt: new Date(Date.now() - 3600000 * 20),
      });

      const post4 = await Post.create({
        author: sophia._id,
        content: 'Quiet morning writing technical documentation. Good docs are the highest-leverage investment any engineering team can make. Code explains what; documentation explains why.',
        image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=900&q=80',
        likes: [elena._id, alex._id],
        createdAt: new Date(Date.now() - 3600000 * 36),
      });

      // Comments
      await Comment.create([
        {
          post: post1._id,
          author: elena._id,
          content: 'Spot on, Alex! The cognitive load of over-engineered layers is often the biggest bottleneck.',
          createdAt: new Date(Date.now() - 3600000 * 3),
        },
        {
          post: post1._id,
          author: marcus._id,
          content: 'Totally agree. Simplifying state boundaries usually solves 80% of race conditions.',
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
        {
          post: post2._id,
          author: sophia._id,
          content: 'This principle has guided all of our design system iterations this quarter.',
          createdAt: new Date(Date.now() - 3600000 * 8),
        },
        {
          post: post3._id,
          author: alex._id,
          content: 'Single field indexes on foreign keys plus compound indexes matching your exact query filter prefix.',
          createdAt: new Date(Date.now() - 3600000 * 18),
        },
      ]);
      console.log('Seeded 4 initial community posts and comments.');
    }
  } catch (err) {
    console.error('Error during database seeding:', err);
  }
}

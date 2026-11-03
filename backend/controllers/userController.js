import mongoose from 'mongoose';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Follow from '../models/Follow.js';

export async function getUsers(req, res, next) {
  try {
    const { search, limit = 20 } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
      ];
    }

    // Exclude current user from suggestions if authenticated
    if (req.user && !search) {
      filter._id = { $ne: req.user._id };
    }

    const users = await User.find(filter)
      .select('name username bio avatar createdAt')
      .limit(parseInt(limit, 10) || 20)
      .sort({ createdAt: -1 });

    // If viewer is logged in, attach isFollowing flag
    let followingIds = new Set();
    if (req.user) {
      const follows = await Follow.find({ follower: req.user._id }).select('following');
      followingIds = new Set(follows.map((f) => f.following.toString()));
    }

    const enrichedUsers = users.map((u) => ({
      ...u.toJSON(),
      isFollowing: followingIds.has(u._id.toString()),
      isSelf: req.user ? req.user._id.toString() === u._id.toString() : false,
    }));

    return res.status(200).json({
      success: true,
      users: enrichedUsers,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserByUsername(req, res, next) {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const [postsCount, followersCount, followingCount] = await Promise.all([
      Post.countDocuments({ author: user._id }),
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
    ]);

    let isFollowing = false;
    let isSelf = false;

    if (req.user) {
      isSelf = req.user._id.toString() === user._id.toString();
      if (!isSelf) {
        const followDoc = await Follow.findOne({
          follower: req.user._id,
          following: user._id,
        });
        isFollowing = !!followDoc;
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user.toJSON(),
        postsCount,
        followersCount,
        followingCount,
        isFollowing,
        isSelf,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      }
      user.name = name.trim();
    }

    if (bio !== undefined) {
      if (bio.length > 200) {
        return res.status(400).json({ success: false, message: 'Bio cannot exceed 200 characters.' });
      }
      user.bio = bio.trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar.trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
}

export async function followUser(req, res, next) {
  try {
    const targetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid target user ID.' });
    }

    if (req.user._id.toString() === targetId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User to follow does not exist.' });
    }

    // Check if already following
    const existing = await Follow.findOne({
      follower: req.user._id,
      following: targetId,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Already following this user.',
        isFollowing: true,
      });
    }

    await Follow.create({
      follower: req.user._id,
      following: targetId,
    });

    const followersCount = await Follow.countDocuments({ following: targetId });

    return res.status(201).json({
      success: true,
      message: `You are now following ${targetUser.username}.`,
      isFollowing: true,
      followersCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function unfollowUser(req, res, next) {
  try {
    const targetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid target user ID.' });
    }

    const deleted = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: targetId,
    });

    const followersCount = await Follow.countDocuments({ following: targetId });

    return res.status(200).json({
      success: true,
      message: deleted ? 'Unfollowed successfully.' : 'You were not following this user.',
      isFollowing: false,
      followersCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFollowers(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const follows = await Follow.find({ following: id })
      .populate('follower', 'name username bio avatar')
      .sort({ createdAt: -1 });

    const followers = follows.map((f) => f.follower).filter(Boolean);

    return res.status(200).json({
      success: true,
      followers,
      count: followers.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFollowing(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const follows = await Follow.find({ follower: id })
      .populate('following', 'name username bio avatar')
      .sort({ createdAt: -1 });

    const following = follows.map((f) => f.following).filter(Boolean);

    return res.status(200).json({
      success: true,
      following,
      count: following.length,
    });
  } catch (err) {
    next(err);
  }
}

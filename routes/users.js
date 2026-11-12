const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Follow = require('../models/Follow');
const authMiddleware = require('../middleware/auth');

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { q, search } = req.query;
    const query = q || search;
    const filter = {};

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password').lean();

    // Populate follower and following counts
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const followersCount = await Follow.countDocuments({ following: u._id });
        const followingCount = await Follow.countDocuments({ follower: u._id });
        return {
          ...u,
          followersCount,
          followingCount,
        };
      })
    );

    res.json({
      success: true,
      count: usersWithCounts.length,
      users: usersWithCounts,
    });
  } catch (error) {
    console.error('Express get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, bio, profilePicture } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (profilePicture) updates.profilePicture = profilePicture.trim();

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Express update profile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let user;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id).select('-password').lean();
    }
    if (!user) {
      user = await User.findOne({ username: id.toLowerCase() }).select('-password').lean();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followersCount = await Follow.countDocuments({ following: user._id });
    const followingCount = await Follow.countDocuments({ follower: user._id });

    res.json({
      success: true,
      user: {
        ...user,
        followersCount,
        followingCount,
      },
    });
  } catch (error) {
    console.error('Express get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/:id/followers
router.get('/:id/followers', async (req, res) => {
  try {
    const follows = await Follow.find({ following: req.params.id }).populate(
      'follower',
      '-password'
    );
    const followers = follows.map((f) => f.follower).filter(Boolean);

    res.json({
      success: true,
      count: followers.length,
      followers,
    });
  } catch (error) {
    console.error('Express get followers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/:id/following
router.get('/:id/following', async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.params.id }).populate(
      'following',
      '-password'
    );
    const following = follows.map((f) => f.following).filter(Boolean);

    res.json({
      success: true,
      count: following.length,
      following,
    });
  } catch (error) {
    console.error('Express get following error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/users/:id/follow
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existing = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Already following user',
        isFollowing: true,
      });
    }

    await Follow.create({
      follower: currentUserId,
      following: targetUserId,
    });

    res.json({
      success: true,
      message: 'Followed user successfully',
      isFollowing: true,
    });
  } catch (error) {
    console.error('Express follow error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/users/:id/follow
router.delete('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    await Follow.findOneAndDelete({
      follower: currentUserId,
      following: targetUserId,
    });

    res.json({
      success: true,
      message: 'Unfollowed user successfully',
      isFollowing: false,
    });
  } catch (error) {
    console.error('Express unfollow error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

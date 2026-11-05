import User from '../models/User.js';
import { generateToken, isValidMediaUrl } from '../middleware/auth.js';

export async function register(req, res, next) {
  try {
    const { name, username, email, password, avatar } = req.body || {};

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (name.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'Full name cannot exceed 60 characters.' });
    }
    if (typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Username is required.' });
    }
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ success: false, message: 'Username must be between 3 and 30 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'Username can only contain letters, numbers, and underscores.' });
    }

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.length > 254 || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }
    if (password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password cannot exceed 128 characters.' });
    }

    if (avatar !== undefined && avatar !== null && avatar !== '' && !isValidMediaUrl(avatar)) {
      return res.status(400).json({ success: false, message: 'Invalid avatar URL. Only HTTP, HTTPS, and safe raster images are allowed.' });
    }

    // Check existing email or username
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'This username is already taken. Please choose another.' });
    }

    // Hash password and create user
    const passwordHash = await User.hashPassword(password);
    const user = new User({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      avatar: (typeof avatar === 'string' && avatar.trim()) || '/images/default-avatar.svg',
      bio: '',
    });

    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body || {};

    if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required.',
      });
    }

    const rawIdentifier = identifier.trim();
    const normalizedInput =
      rawIdentifier.startsWith('@') && rawIdentifier.indexOf('@', 1) === -1
        ? rawIdentifier.slice(1).trim()
        : rawIdentifier;

    if (!normalizedInput || normalizedInput.length > 254 || password.length > 128) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your username/email and password.',
      });
    }

    const cleanIdentifier = normalizedInput.toLowerCase();
    const escaped = normalizedInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Case-resilient & whitespace-resilient query for both email and username
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { username: cleanIdentifier },
        { email: { $regex: new RegExp(`^\\s*${escaped}\\s*$`, 'i') } },
        { username: { $regex: new RegExp(`^\\s*${escaped}\\s*$`, 'i') } },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your username/email and password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your username/email and password.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
}

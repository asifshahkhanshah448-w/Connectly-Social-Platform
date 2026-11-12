import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserByUsername, sanitizeUser } from '@/lib/dataService';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername, email, password } = body;

    const identifier = (emailOrUsername || email || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: 'Please provide email or username' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    // Lookup user by email or username
    let user = await getUserByEmail(identifier);
    if (!user) {
      user = await getUserByUsername(identifier);
    }

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. User not found or incorrect password.' },
        { status: 401 }
      );
    }

    // Compare bcrypt password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. User not found or incorrect password.' },
        { status: 401 }
      );
    }

    const safeUser = sanitizeUser(user);
    const token = signToken({ id: safeUser._id, username: safeUser.username });

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during login' },
      { status: 500 }
    );
  }
}

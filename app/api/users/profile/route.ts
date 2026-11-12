import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { updateUserProfile, getUserById } from '@/lib/dataService';

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, bio, profilePicture } = body;

    const updated = await updateUserProfile(authUser._id, {
      name,
      bio,
      profilePicture,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const detailed = await getUserById(authUser._id, authUser._id);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: detailed,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error updating profile' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getUserByUsername } from '@/lib/dataService';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);

    // Can query by ID or username
    let user = await getUserById(id, authUser?._id);
    if (!user) {
      const byUsername = await getUserByUsername(id);
      if (byUsername) {
        user = await getUserById(byUsername._id, authUser?._id);
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

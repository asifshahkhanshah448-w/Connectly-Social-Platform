import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { followUser, unfollowUser, getUserById } from '@/lib/dataService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (authUser._id === id) {
      return NextResponse.json(
        { success: false, message: 'You cannot follow yourself' },
        { status: 400 }
      );
    }

    await followUser(authUser._id, id);
    const updatedTargetUser = await getUserById(id, authUser._id);

    return NextResponse.json({
      success: true,
      message: 'Followed user successfully',
      isFollowing: true,
      user: updatedTargetUser,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error following user';
    console.error('Follow error:', error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await unfollowUser(authUser._id, id);
    const updatedTargetUser = await getUserById(id, authUser._id);

    return NextResponse.json({
      success: true,
      message: 'Unfollowed user successfully',
      isFollowing: false,
      user: updatedTargetUser,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error unfollowing user';
    console.error('Unfollow error:', error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

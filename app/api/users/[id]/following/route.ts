import { NextRequest, NextResponse } from 'next/server';
import { getUserFollowing } from '@/lib/dataService';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    const following = await getUserFollowing(id, authUser?._id);

    return NextResponse.json({
      success: true,
      count: following.length,
      following,
    });
  } catch (error) {
    console.error('Get following error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserFollowers } from '@/lib/dataService';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    const followers = await getUserFollowers(id, authUser?._id);

    return NextResponse.json({
      success: true,
      count: followers.length,
      followers,
    });
  } catch (error) {
    console.error('Get followers error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

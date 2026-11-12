import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/dataService';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('search') || undefined;

    const users = await getAllUsers(query, authUser?._id);

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

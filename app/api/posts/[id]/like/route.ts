import { NextRequest, NextResponse } from 'next/server';
import { likePost, unlikePost } from '@/lib/dataService';
import { getAuthUser } from '@/lib/auth';

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
    const result = await likePost(id, authUser._id);

    return NextResponse.json({
      success: true,
      message: 'Post liked',
      ...result,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error liking post';
    console.error('Like post error:', error);
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
    const result = await unlikePost(id, authUser._id);

    return NextResponse.json({
      success: true,
      message: 'Post unliked',
      ...result,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error unliking post';
    console.error('Unlike post error:', error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

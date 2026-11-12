import { NextRequest, NextResponse } from 'next/server';
import { deleteComment } from '@/lib/dataService';
import { getAuthUser } from '@/lib/auth';

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
    await deleteComment(id, authUser._id);

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
      commentId: id,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error deleting comment';
    console.error('Delete comment error:', error);
    const status = msg.includes('Not authorized') ? 403 : msg.includes('not found') ? 404 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPostComments, createComment } from '@/lib/dataService';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await getPostComments(id);

    return NextResponse.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in to comment.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Comment content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 600) {
      return NextResponse.json(
        { success: false, message: 'Comment cannot exceed 600 characters' },
        { status: 400 }
      );
    }

    const newComment = await createComment(id, authUser._id, content);

    return NextResponse.json(
      {
        success: true,
        message: 'Comment added',
        comment: newComment,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error adding comment';
    console.error('Add comment error:', error);
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}

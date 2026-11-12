import { NextRequest, NextResponse } from 'next/server';
import { getPostById, updatePost, deletePost } from '@/lib/dataService';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    const post = await getPostById(id, authUser?._id);

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Get post by id error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await req.json();
    const { content, image } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Content cannot be empty' },
        { status: 400 }
      );
    }

    const updated = await updatePost(id, authUser._id, content, image);

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully',
      post: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error updating post';
    console.error('Update post error:', error);
    const status = msg.includes('Not authorized') ? 403 : msg.includes('not found') ? 404 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
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
    await deletePost(id, authUser._id);

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
      postId: id,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error deleting post';
    console.error('Delete post error:', error);
    const status = msg.includes('Not authorized') ? 403 : msg.includes('not found') ? 404 : 400;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

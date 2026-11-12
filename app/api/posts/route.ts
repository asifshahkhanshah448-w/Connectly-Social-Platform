import { NextRequest, NextResponse } from 'next/server';
import { getPosts, createPost } from '@/lib/dataService';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const searchParams = req.nextUrl.searchParams;
    const sort = searchParams.get('sort') === 'trending' ? 'trending' : 'latest';
    const authorId = searchParams.get('authorId') || undefined;
    const followingOnly = searchParams.get('followingOnly') === 'true';

    const posts = await getPosts({
      sort,
      authorId,
      viewerId: authUser?._id,
      followingOnly,
    });

    return NextResponse.json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error fetching posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in to post.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { content, image } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Post content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'Post content cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    const newPost = await createPost(authUser._id, content, image);

    return NextResponse.json(
      {
        success: true,
        message: 'Post published successfully',
        post: newPost,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error creating post' },
      { status: 500 }
    );
  }
}

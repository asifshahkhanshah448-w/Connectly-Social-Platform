import { NextResponse } from 'next/server';
import { resetStore } from '@/lib/db';

export async function POST() {
  try {
    resetStore();
    return NextResponse.json({
      success: true,
      message: 'Store re-initialized to default demo data',
    });
  } catch (error) {
    console.error('Reset store error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error resetting store' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;
    const body = await request.json();
    const { title, modelData, commitReason } = body;

    const currentCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!currentCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const currentVersionNumber = currentCourse.versions[0]?.versionNumber || 0;

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: title || currentCourse.title,
        versions: {
          create: {
            versionNumber: currentVersionNumber + 1,
            modelData: JSON.stringify(modelData),
            commitReason: commitReason || 'Update course'
          }
        }
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    const formattedUpdatedCourse = {
      ...updatedCourse,
      versions: updatedCourse.versions.map(version => ({
        ...version,
        modelData: JSON.parse(version.modelData as unknown as string)
      }))
    };

    return NextResponse.json(formattedUpdatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    await prisma.course.delete({
      where: { id: courseId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}

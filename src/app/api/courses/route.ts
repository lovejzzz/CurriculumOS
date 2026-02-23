import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        versions: {
          orderBy: {
            versionNumber: 'desc'
          },
          take: 1
        }
      }
    });

    const formattedCourses = courses.map(course => ({
      ...course,
      versions: course.versions.map(version => ({
        ...version,
        modelData: JSON.parse(version.modelData)
      }))
    }));

    return NextResponse.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, modelData } = body;

    if (!title || !modelData) {
      return NextResponse.json(
        { error: 'Missing required fields: title, modelData' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        title,
        versions: {
          create: {
            versionNumber: 1,
            modelData: JSON.stringify(modelData),
            commitReason: 'Initial creation'
          }
        }
      },
      include: {
        versions: true
      }
    });

    const formattedCourse = {
      ...course,
      versions: course.versions.map(version => ({
        ...version,
        modelData: JSON.parse(version.modelData as unknown as string)
      }))
    };

    return NextResponse.json(formattedCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
